var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  mkdirp = require('mkdirp'),
  webdriverio = require('webdriverio');

var generateIndent = require('../../indent_utils').generateIndent;

var webdriveriosByBrowser = {};

var browsers = ['firefox'];

var generateReport = function(filePath, options) {
  return new Promise(function(resolve, reject){
    mkdirp(options.outputFolderForThisFile, function(error){
      if(error) {
        return reject(error);
      }
      var seq = Promise.resolve();
      browsers.forEach(function(browserName){
        seq = seq.then(function(){
          return _takeScreenshot(filePath, options, browserName);
        });
      });
      seq = seq.then(function(){
        resolve({});
      });
    });
  });
};

var _takeScreenshot = function(filePath, options, browserName) {
  return new Promise(function(resolve, reject){
    _getWebdriverForBrowser(browserName)
        .setViewportSize({width: 1366, height: 720}, true)
        .url('file://' + filePath)
        //.pause(1000)
        .saveScreenshot(path.resolve(options.outputFolderForThisFile, browserName + '.png'))
        .then(function(){
          resolve(true);
        });
  });
};

var _getWebdriverForBrowser = function(browserName) {
  if(!webdriveriosByBrowser[browserName]) {
    webdriveriosByBrowser[browserName] = webdriverio
      .remote({
        desiredCapabilities: {
          browserName: browserName
        }
      })
      .init()
      .timeouts('page load', 10000);
  }
  return webdriveriosByBrowser[browserName];
};

var convertReportToPlainText = function(outlinerReport, options) {
  return new Promise(function(resolve, reject){
    resolve('');
  });
};

var convertReportToHtml = function(report, options) {
  return new Promise(function(resolve, reject){
    var output = '<section>';
    output += '<header><h1 class="h' + (options.indentLevel + 1) + '">Screenshots</h1></header>';
    browsers.forEach(function(browserName){
      output += '<article>';
      output += '<header><h1 class="h' + (options.indentLevel + 2) + '">' + browserName + '</h1></header>';
      output += '<img src="' + browserName + '.png" style="max-width: 100%;" alt="screenshot ' + browserName + '" />';
      output += '</article>';
    });
    output += '</section>';
    resolve(output);
  });
};

var exit = function() {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    for(var browserName in webdriveriosByBrowser) {
      seq = seq.then(function(){
        return webdriveriosByBrowser[browserName].end();
      });
    }
    seq.then(function(){
      resolve(true);
    });
  });
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
  exit: exit
};
