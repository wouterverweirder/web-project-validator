var jsdom = require('jsdom'),
  path = require('path'),
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
    jsdom.env({
      file: fileReport.context,
      scripts: [],
      done: function (error, window) {
        if(error) {
          return reject(error);
        }
        Promise.resolve()
          .then(function(){
            return outlineHtmlReporter.generateReport(fileReport.outline, window);
          })
          .then(function(){
            return _addStyleSheetPaths(fileReport, window);
          })
          .then(function(){
            window.close();
          })
          .then(function(){
            resolve(fileReport);
          });
      }
    });
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
        href = 'file://' + path.resolve(fileReport.context, '..', href);
      }
      fileReport.styleSheetPaths.push(href);
    }
    resolve(fileReport);
  });
};

module.exports = {
  buildReport: buildReport
};
