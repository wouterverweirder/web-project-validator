var fs = require('fs'),
  url = require('url'),
  path = require('path'),
  fetch = require('node-fetch');

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
        resolve(htmlFilePaths);
      }
    });
  });
};

//load a resource, local or over http
var loadResource = function(path, encoding) {
  return new Promise(function(resolve, reject){
    if(pathIsHttp(path)) {
      fetch(path, { "rejectUnauthorized": false })
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
      var localPath = path.split("?")[0]; //remove querystring
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
            resolve(result.toString(encoding));
          }
          resolve(result);
        });
      });
    }
  });
};

var pathIsHttp = function(path) {
  return (path.indexOf('http://') === 0 || path.indexOf('https://') === 0);
};

var checkFileExists = function(filePath) {
  if(filePath.indexOf('file://') === 0) {
    filePath = filePath.substr('file://'.length);
  }
  return new Promise(function(resolve, reject){
    fs.stat(filePath, function(err, result){
      if(err) {
        return resolve(false);
      }
      resolve(true);
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

module.exports = {
  getHtmlFilesFromDirectory: getHtmlFilesFromDirectory,
  checkFileExists: checkFileExists,
  loadResource: loadResource,
  pathIsHttp: pathIsHttp,
  createArrayWithExistingFilePaths: createArrayWithExistingFilePaths
};
