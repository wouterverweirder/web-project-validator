var jsdom = require('jsdom'),
  path = require('path'),
  url = require('url'),
  fsUtils = require('./fs_utils');

var outlineHtmlReporter = require('./reporter/outline-html');

var buildReport = function(report) {
  var _ph;
  return Promise.resolve()
    .then(function(){
      return _buildReportWithJsdom(report);
    })
    .then(function(){
      return report;
    });
};

var _buildReportWithJsdom = function(report) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        return _processHtmlFileWithJsdom(report.reportsByFile[htmlFilePath]);
      });
    });
    seq = seq.then(function(){
      resolve(report);
    });
  });
};

var _processHtmlFileWithJsdom = function(fileReport) {
  return new Promise(function(resolve, reject){
    console.log('processing ' + fileReport.context + ' with jsdom');
    var env = {
      scripts: [],
      done: function (error, window) {
        if(error) {
          console.log(error);
          return reject(error);
        }
        Promise.resolve()
          .then(function(){
            return outlineHtmlReporter.generateReport(fileReport.outline, window);
          })
          .catch(function(error) {
            console.log('jsdom-processor _processHtmlFileWithJsdom error 1: ' + error);
          })
          .then(function(){
            return _addStyleSheetPaths(fileReport, window);
          })
          .catch(function(error) {
            console.log('jsdom-processor _processHtmlFileWithJsdom error 2: ' + error);
          })
          .then(function(){
            window.close();
          })
          .catch(function(error) {
            console.log('jsdom-processor _processHtmlFileWithJsdom error 2: ' + error);
          })
          .then(function(){
            resolve(fileReport);
          });
      }
    };
    if(fsUtils.pathIsHttp(fileReport.context)) {
      env.url = fileReport.context;
    } else {
      env.file = fileReport.context;
    }
    jsdom.env(env);
  });
};


var _addStyleSheetPaths = function(fileReport, jsdomWindow) {
  return new Promise(function(resolve, reject){
    //get the linked stylesheets
    var doc = jsdomWindow.document;
    var cssFiles = doc.querySelectorAll('[rel="stylesheet"]');
    for(var i = 0; i < cssFiles.length; i++) {
      var href = cssFiles[i].getAttribute('href');
      if(!href) {
        continue;
      }
      if(!fsUtils.pathIsHttp(href)) {
        if(!fsUtils.pathIsHttp(fileReport.context)) {
          href = 'file://' + path.resolve(fileReport.context, '..', href);
        } else {
          href = url.resolve(fileReport.context, href);
        }
      }
      fileReport.styleSheetPaths.push(href);
    }
    resolve(fileReport);
  });
};

module.exports = {
  buildReport: buildReport
};
