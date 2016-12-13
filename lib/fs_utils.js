'use strict'

var fs = require('fs'),
  url = require('url'),
  path = require('path'),
  https = require('https'),
  http = require('http'),
  fetch = require('node-fetch'),
  mkdirp = require('mkdirp'),
  targz = require('tar.gz');

var agent = new https.Agent({
  rejectUnauthorized: false
});

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const getInputTypeFromArgument = value => {
  return new Promise((resolve, reject) => {
    if(pathIsRemoteUrl(value)) {
      return resolve('url');
    }
    //local file or directory
    let localPath = getPathWithoutQueryString(value);
    if(localPath.indexOf('file://') === 0) {
      localPath = localPath.substr('file://'.length);
    }
    checkFileExists(localPath)
    .then(exists => {
      if(!exists) {
        throw 'file does not exist';
      }
    })
    .then(() => {
      localPath = path.resolve(localPath);
      return statPromised(localPath);
    })
    .then(stats => {
      if(stats.isDirectory()) {
        return resolve('folder');
      }
      //html file or url list?
      const extname = path.extname(localPath);
      if(extname === '.htm' || extname === '.html') {
        return resolve('file');
      }
      return resolve('list');
    })
    .catch(error => {
      resolve(false);
    });
  });
};

var getHtmlFilesFromDirectory = function(dir) {
  return new Promise(function(resolve, reject){
    walk(dir, function(err, result){
      if(err) {
        return reject(err);
      } else {
        //filter on extension
        var htmlFilePaths = [];
        result.forEach(function(filePath){
          if(path.extname(filePath) === '.html' || path.extname(filePath) === '.htm') {
            htmlFilePaths.push(filePath);
          }
        });
        htmlFilePaths.sort();
        resolve(htmlFilePaths);
      }
    });
  });
};

var getUrlsFromList = function(path) {
  return loadResource(path, 'utf-8')
    .then(contents => {
      return contents.split("\n");
    })
    .then(splitted => {
      return splitted.filter(url => url.length > 0);
    })
};

//load a resource, local or over http
var loadResource = function(path, encoding) {
  return new Promise(function(resolve, reject){
    if(pathIsRemoteUrl(path)) {
      var fetchOptions = {};
      if(path.indexOf('https://') === 0) {
        fetchOptions.agent = agent;
      }
      fetch(path, fetchOptions)
        .then(function(response){
          if(response.status > 400) {
            return reject('file not found');
          }
          if(encoding) {
            return resolve(response.text());
          }
          resolve(response);
        }).catch(function(err){
          reject('file not found');
        });
    } else {
      var localPath = getPathWithoutQueryString(path);
      if(localPath.indexOf('file://') === 0) {
        localPath = localPath.substr('file://'.length);
      }
      checkFileExists(localPath).then(function(exists){
        if(!exists) {
          return reject('file not found');
        }
        fs.readFile(localPath, function(error, result){
          if(error) {
            return reject('file not found');
          }
          if(encoding) {
            return resolve(result.toString(encoding));
          }
          resolve(result);
        });
      });
    }
  });
};

var pathIsRemoteUrl = function(path) {
  var parsed = require('url').parse(path);
  return (parsed.protocol !== null && parsed.protocol !== 'file:');
};

var pathHasProtocol = function(path) {
  var parsed = require('url').parse(path);
  return (parsed.protocol !== null);
};

var getPathWithoutProtocol = function(path) {
  return path.replace(/.*?:\/\//g, "");
};

var getPathWithoutQueryString = function(path){
  return path.split("?")[0];
};

var checkFileExists = function(filePath) {
  return statPromised(filePath)
    .then(() => true)
    .catch(() => false);
};

const statPromised = filePath => {
  if(filePath.indexOf('file://') === 0) {
    filePath = filePath.substr('file://'.length);
  }
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, result) => {
      if(err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

var writeFile = function(file, data, options) {
  return new Promise(function(resolve, reject){
    var folderName = path.resolve(file, '..');
    mkdirpPromised(folderName)
    .then(folderName => {
      fs.writeFile(file, data, options, function(error, result){
        if(error) {
          return reject(error);
        }
        resolve(file);
      });
    });
  });
};

const mkdirpPromised = folderPath => {
  return new Promise((resolve, reject) => {
    mkdirp(folderPath, function(error, result){
      if(error) {
        return reject(error);
      }
      resolve(folderPath);
    });
  });
};

var createArrayWithExistingFilePaths = function(filePaths) {
  var existingFilePaths = [];
  var seq = Promise.resolve();
  filePaths.forEach(function(filePath){
    seq = seq
      .then(function(){
        return checkFileExists(filePath);
      })
      .then(function(exists){
        if(exists) {
          existingFilePaths.push(filePath);
        }
      });
  });
  seq = seq.then(function(){
    return existingFilePaths;
  });
  return seq;
};

const downloadPromised = (remoteUrl, localPath) => {
  return new Promise((resolve, reject) => {
    //create containing folder
    const folderName = path.resolve(localPath, '..');
    mkdirpPromised(folderName)
    .then(folderName => {
      let httpLib = http;
      if(remoteUrl.indexOf('https://') === 0) {
        httpLib = https;
      }
      const request = httpLib.get(remoteUrl, response => {
        if (response.statusCode == 200) {
          const file = fs.createWriteStream(localPath);
          file.on('finish', () => {
            resolve(localPath)
          });
          return response.pipe(file);
        }
        if (response.headers.location) {
          resolve(downloadPromised(response.headers.location, localPath));
        } else {
          reject(response.statusCode);
        }
      }).on('error', e => {
        fs.unlink(localPath);
        reject(e);
      });
    });
  });
};

const unlinkPromised = filePath => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, error => {
      if(error) {
        return reject(error);
      }
      return resolve(filePath);
    });
  });
};

const extractPromised = (archivePath, targetPath) => {
  return new Promise((resolve, reject) => {
    targz().extract(archivePath, targetPath, error => {
      if(error) {
        return reject(error);
      }
      resolve(targetPath);
    });
  });
};

module.exports = {
  getInputTypeFromArgument: getInputTypeFromArgument,
  getHtmlFilesFromDirectory: getHtmlFilesFromDirectory,
  getUrlsFromList: getUrlsFromList,
  checkFileExists: checkFileExists,
  loadResource: loadResource,
  pathIsRemoteUrl: pathIsRemoteUrl,
  pathHasProtocol: pathHasProtocol,
  getPathWithoutProtocol: getPathWithoutProtocol,
  getPathWithoutQueryString: getPathWithoutQueryString,
  createArrayWithExistingFilePaths: createArrayWithExistingFilePaths,
  writeFile: writeFile,
  mkdirpPromised: mkdirpPromised,
  downloadPromised: downloadPromised,
  unlinkPromised: unlinkPromised,
  extractPromised: extractPromised
};
