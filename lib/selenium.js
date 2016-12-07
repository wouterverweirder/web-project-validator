'use strict';

const glob = require('glob'),
  path = require('path'),
  spawn = require('child_process').spawn,
  mkdirp = require('mkdirp'),
  parseString = require('xml2js').parseString,
  loadResource = require('./fs_utils').loadResource,
  downloadPromised = require('./fs_utils').downloadPromised,
  projectRoot = path.resolve(__dirname, '..'),
  projectBinFolder = path.resolve(projectRoot, 'bin'),
  SELENIUM_INDEX = 'http://selenium-release.storage.googleapis.com/',
  GECKODRIVER_REPO = 'mozilla/geckodriver',
  GECKODRIVER_REPO_LATEST_RELEASE_API_URL = 'https://api.github.com/repos/' + GECKODRIVER_REPO + '/releases/latest';

class Selenium {
  constructor() {
    this._seleniumProcess = false;
  }
  start() {
    return new Promise((resolve, reject) => {
      if(this._seleniumProcess) {
        return reject('Selenium is already running');
      }
      return resolveLocalJar()
      .then(localJarPath => {
        const webdriverArg = '-Dwebdriver.gecko.driver=geckodriver';
        this._seleniumProcess = spawn('java', ['-jar', webdriverArg, localJarPath], { cwd: path.resolve(localJarPath, '..') });
        this._seleniumProcess.stdout.on('data', (data) => {
          console.log(data.toString().trim());
        });
        this._seleniumProcess.stderr.on('data', (data) => {
          console.log(data.toString().trim());
        });
        this._seleniumProcess.on('close', (code) => {
          console.log('child process exited with code ' + code);
          reject('Selenium could not be launched');
        });
        setTimeout(() => {
          resolve(true);
        }, 1500);
      })
      .catch(e => reject(e));
    });
  }
  stop() {
    return new Promise((resolve, reject) => {
      if(!this._seleniumProcess) {
        return reject('Selenium is not running');
      }
      this._seleniumProcess.on('close', (code) => {
        console.log('child process exited with code ' + code);
        resolve(true);
      });
      this._seleniumProcess.kill();
      this._seleniumProcess = false;
    });
  }
};

const resolveLocalJar = () => {
  return new Promise((resolve, reject) => {
    glob(projectBinFolder + '/selenium**.jar', (err, files) => {
      if(err) {
        return reject(err);
      }
      if(files.length === 0) {
        return reject('no local selenium found');
      }
      resolve(files[files.length - 1]);
    });
  });
};

const getLatestSeleniumVersionFromRemote = () => {
  return loadResource(SELENIUM_INDEX, 'utf-8')
    .then(parseStringPromised)
    .then(getLatestSeleniumVersionFromTree);
};

const getLatestSeleniumStandaloneUrl = () => {
  return new Promise((resolve, reject) => {
    let parsed;
    loadResource(SELENIUM_INDEX, 'utf-8')
      .then(parseStringPromised)
      .then(result => {
        parsed = result;
        return getLatestSeleniumVersionFromTree(parsed);
      })
      .then(latestVersionNr => getSeleniumStandaloneUrlFromTreeAndVersion(parsed, latestVersionNr))
      .then(resolve);
  });
};

const downloadSeleniumWhenNeeded = () => {
  return new Promise((resolve, reject) => {
    resolveLocalJar()
      .then(localJarPath => localJarPath, error => {
        return getLatestSeleniumStandaloneUrl()
        .then(latestSeleniumStandaloneUrl => {
          var seleniumPath = path.resolve(projectBinFolder, path.basename(latestSeleniumStandaloneUrl));
          return downloadPromised(latestSeleniumStandaloneUrl, seleniumPath);
        });
      })
      .then(resolve);
  });
};

const getLatestSeleniumVersionFromTree = xml2jsResult => {
  let latestVersionNr = -1;
  xml2jsResult.ListBucketResult.Contents.forEach(contentsTag => {
    if(!contentsTag.Key[0] || contentsTag.Key[0].indexOf('3.') !== 0) {
      return;
    }
    const contentsTagSplit = contentsTag.Key[0].split('/');
    const versionNr = parseFloat(contentsTagSplit[0]);
    if(!isNaN(versionNr) && versionNr > latestVersionNr) {
      latestVersionNr = versionNr;
    }
  });
  if(latestVersionNr === -1) {
    throw 'Could not get latest selenium version number';
  }
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
  if(!seleniumStandaloneUrl) {
    throw 'Could not get selenium standalone url';
  }
  return seleniumStandaloneUrl;
};

const getContentsTagsForSeleniumVersion = (xml2jsResult, versionNr) => {
  const contentsTags = [];
  xml2jsResult.ListBucketResult.Contents.forEach(contentsTag => {
    if(!contentsTag.Key[0] || contentsTag.Key[0].indexOf('3.') !== 0) {
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

const getLatestGeckoDriverUrl = () => {
  return new Promise((resolve, reject) => {
    loadResource(GECKODRIVER_REPO_LATEST_RELEASE_API_URL, 'utf-8')
    .then(JSON.parse)
    .then(o => {
      var geckoDriverAsset = false;
      o.assets.forEach(asset => {
        if(asset.name.indexOf('macos') !== -1) {
          geckoDriverAsset = asset;
        }
      });
      if(!geckoDriverAsset) {
        return reject('Could not get latest geckodriver info');
      }
      resolve(geckoDriverAsset.browser_download_url);
    })
  });
};

const seleniumInstance = new Selenium();

module.exports = {
  start: seleniumInstance.start,
  stop: seleniumInstance.stop,
  resolveLocalJar: resolveLocalJar,
  getLatestSeleniumVersionFromRemote: getLatestSeleniumVersionFromRemote,
  getLatestSeleniumStandaloneUrl: getLatestSeleniumStandaloneUrl,
  downloadSeleniumWhenNeeded: downloadSeleniumWhenNeeded,
  getLatestGeckoDriverUrl: getLatestGeckoDriverUrl
};
