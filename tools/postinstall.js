'use strict';

const parseString = require('xml2js').parseString,
  loadResource = require('../lib/fs_utils').loadResource,
  checkFileExists = require('../lib/fs_utils').checkFileExists,
  http = require('http'),
  fs = require('fs'),
  path = require('path');

const SELENIUM_INDEX = 'http://selenium-release.storage.googleapis.com/';

const init = () => {
  console.log('Checking if there\'s a newer version of selenium...');
  let latestSeleniumUrl,
    latestSeleniumFilePath;
  loadResource(SELENIUM_INDEX, 'utf-8')
    .then(parseStringPromised)
    .then(parsed => {
      const latestVersionNr = getLatestSeleniumVersionFromTree(parsed);
      if(!latestVersionNr) {
        throw 'Could not get latest selenium version number';
      }
      latestSeleniumUrl = getSeleniumStandaloneUrlFromTreeAndVersion(parsed, latestVersionNr);
      if(!latestSeleniumUrl) {
        throw 'Could not get latest selenium download url';
      }
      const latestSeleniumFileName = path.basename(latestSeleniumUrl);
      latestSeleniumFilePath = path.resolve(__dirname, '..', latestSeleniumFileName);
      //check if that file already exists
      return checkFileExists(latestSeleniumFilePath);
    })
    .then(localFileExists => {
      if(localFileExists) {
        console.log('you\'ve already got the latest selenium version');
        return latestSeleniumFilePath;
      }
      console.log('downloading selenium to ' + latestSeleniumFilePath);
      return downloadPromised(latestSeleniumUrl, latestSeleniumFilePath);
    })
    .then(o => {
      console.log('done');
    })
    .catch(e => {
      console.error(e);
    });
};

const downloadPromised = (remoteUrl, localPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    file.on('finish', () => resolve(localPath));
    var request = http.get(remoteUrl, response => {
      response.pipe(file);
    }).on('error', e => {
      fs.unlink(localPath);
      reject(e);
    });
  });
};

const getLatestSeleniumVersionFromTree = xml2jsResult => {
  let latestVersionNr = -1;
  xml2jsResult.ListBucketResult.Contents.forEach(contentsTag => {
    if(!contentsTag.Key[0] || contentsTag.Key[0].indexOf('2.') !== 0) {
      return;
    }
    const contentsTagSplit = contentsTag.Key[0].split('/');
    const versionNr = parseFloat(contentsTagSplit[0]);
    if(versionNr > latestVersionNr) {
      latestVersionNr = versionNr;
    }
  });
  return latestVersionNr;
};

const getSeleniumStandaloneUrlFromTreeAndVersion = (xml2jsResult, versionNr) => {
  const contentsTags = getContentsTagsForSeleniumVersion(xml2jsResult, versionNr);
  let seleniumStandaloneUrl = false;
  contentsTags.forEach(contentsTag => {
    if(contentsTag.Key[0].indexOf('standalone') === -1 || contentsTag.Key[0].indexOf('.jar') === -1) {
      return;
    }
    seleniumStandaloneUrl = SELENIUM_INDEX + contentsTag.Key[0];
  });
  return seleniumStandaloneUrl;
};

const getContentsTagsForSeleniumVersion = (xml2jsResult, versionNr) => {
  const contentsTags = [];
  xml2jsResult.ListBucketResult.Contents.forEach(contentsTag => {
    if(!contentsTag.Key[0] || contentsTag.Key[0].indexOf('2.') !== 0) {
      return;
    }
    const contentsTagSplit = contentsTag.Key[0].split('/');
    if(parseFloat(contentsTagSplit[0]) === versionNr) {
      contentsTags.push(contentsTag);
    }
  });
  return contentsTags;
};

const parseStringPromised = s => {
  return new Promise((resolve, reject) => {
    parseString(s, (error, result) => {
      if(error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

init();
