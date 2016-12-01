var path = require('path'),
  fs = require('fs'),
  selenium = require('./selenium'),
  webdriverio = require('webdriverio');

var buildReport = function(report) {
  return new Promise(function(resolve, reject){
    var webDriverClient = false;
    selenium.start()
      .then(() => {
        return _startWebdriver().then(function(){
          webDriverClient = this;
        });
      })
      .then(function(){
        console.log('webdriver started');
      })
      .catch(function(error){
        console.log('firefox-processor error 1 - ' + error);
      })
      .then(function(){
        return _buildReportWithWebdriver(report, webDriverClient);
      })
      .then(function(){
        return _stopWebdriver(webDriverClient);
      })
      .catch(function(error){
        console.log('firefox-processor error 2 - ' + error);
      })
      .then(function(){
        console.log('webdriver stopped');
        resolve(report);
      })
      .then(() => selenium.stop())
      .catch(function(error){
        console.log('firefox-processor error 3 - ' + error);
        reject(report);
      })
  });
};

var _buildReportWithWebdriver = function(report, client) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        return _processHtmlFileWithWebdriver(report.reportsByFile[htmlFilePath], client);
      })
      .catch(function(error){
        console.log(error);
      });
    });
    seq = seq.then(function(){
      resolve(report);
    });
  });
};

var _processHtmlFileWithWebdriver = function(fileReport, client) {
  return new Promise(function(resolve, reject){
    console.log('processing ' + fileReport.context + ' with firefox');
    client
      .url(fileReport.context)
      .setViewportSize({ width: 1366, height: 600 })
      .catch(function(error){
        console.log('firefox-processor _processHtmlFileWithWebdriver error 1 - ' + error);
      })
      .saveScreenshot(path.resolve(fileReport.outputFolder, 'firefox.png'))
      .catch(function(error){
        console.log('firefox-processor _processHtmlFileWithWebdriver error 2 - ' + error);
      })
      .then(function(){
        fileReport.screenshots.screenshots.push({
          browserName: 'firefox',
          url: path.resolve(fileReport.outputFolder, 'firefox.png')
        });
      })
      .then(function(){
        resolve(fileReport);
      });
  });
};

var _startWebdriver = function() {
  return webdriverio.remote({
      desiredCapabilities: {
        browserName: 'firefox'
      }
    })
  .init()
  .timeouts('page load', 10000);
};

var _stopWebdriver = function(client) {
  return new Promise(function(resolve, reject){
    client.end().then(function(){
      resolve();
    });
  });
};

module.exports = {
  buildReport: buildReport
};
