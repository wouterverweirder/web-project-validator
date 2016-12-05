'use strict';

const getLatestSeleniumStandaloneUrl = require('../lib/selenium.js').getLatestSeleniumStandaloneUrl,
  getLatestGeckoDriverUrl = require('../lib/selenium.js').getLatestGeckoDriverUrl,
  loadResource = require('../lib/fs_utils').loadResource,
  checkFileExists = require('../lib/fs_utils').checkFileExists,
  downloadPromised = require('../lib/fs_utils').downloadPromised,
  extractPromised = require('../lib/fs_utils').extractPromised,
  unlinkPromised = require('../lib/fs_utils').unlinkPromised,
  path = require('path');

const SELENIUM_INDEX = 'http://selenium-release.storage.googleapis.com/';

const init = () => {
  console.log('Checking if there\'s a newer version of selenium...');
  var _latestSeleniumUrl,
    _latestSeleniumFilePath,
    _geckoDriverFilePath = path.resolve(__dirname, '..', 'bin', 'geckodriver');
    Promise.resolve()
    .then(getLatestSeleniumStandaloneUrl)
    .then(latestSeleniumUrl => {
      _latestSeleniumUrl = latestSeleniumUrl;
      _latestSeleniumFilePath = path.resolve(__dirname, '..', 'bin', path.basename(_latestSeleniumUrl));
      return checkFileExists(_latestSeleniumFilePath);
    })
    .then(latestVersionExists => {
      if(latestVersionExists) {
        console.log('you\'ve already got the latest selenium version');
        return _latestSeleniumFilePath;
      }
      console.log('downloading latest selenium version to ' + _latestSeleniumFilePath);
      return downloadPromised(_latestSeleniumUrl, _latestSeleniumFilePath);
    })
    .then(() => {
      console.log('Checking if we\'ve got geckodriver to control Firefox');
      return checkFileExists(_geckoDriverFilePath);
    })
    .then(geckoDriverExists => {
      if(geckoDriverExists) {
        console.log('you\'ve already got geckodriver');
        return _geckoDriverFilePath;
      }
      console.log('you don\' have geckodriver yet');
      return getLatestGeckoDriverUrl()
        .then(geckoDriverUrl => {
          var archivePath = path.resolve(_geckoDriverFilePath, '..', path.basename(geckoDriverUrl));
          console.log('downloading geckodriver to ' + archivePath);
          return downloadPromised(geckoDriverUrl, archivePath);
        })
        .then(archivePath => {
          console.log('downloaded, extracting...');
          return extractPromised(archivePath, path.resolve(_geckoDriverFilePath, '..')).then(() => {
            return unlinkPromised(archivePath);
          });
        });
    })
    //npm run build
    .then(() => {
      console.log('compiling custom wdio-screenshot');
      console.log('wait for pull request https://github.com/zinserjan/wdio-screenshot/pull/49 to be accepted');
      console.log('until then, we rely on our custom version...');
      //note: we can remove all babel dependencies from our own repo once this is done.
      console.log('compiling...')
      require('child_process').execSync('npm run build', {cwd: path.resolve(__dirname, '..', 'node_modules', 'wdio-screenshot')});
    })
    .then(() => {
      console.log('done');
    })
    .catch(e => {
      console.error(e);
    });
};

init();
