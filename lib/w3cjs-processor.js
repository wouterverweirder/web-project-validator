var path = require('path'),
  fsUtils = require('./fs_utils');

var validateHtmlReporter = require('./reporter/validate-html');

var buildReport = function(report) {
  var _htmlValidator;
  return _startHtmlValidator()
    .then(function(htmlValidator){
      _htmlValidator = htmlValidator;
    })
    .then(function(){
      return _buildReportWithHtmlValidator(report, _htmlValidator);
    })
    .then(function(){
      return _stopHtmlValidator(_htmlValidator);
    })
    .then(function(){
      return report;
    });
};

var _buildReportWithHtmlValidator = function(report, htmlValidator) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        return _processHtmlPathWithHtmlValidator(report.reportsByFile[htmlFilePath], htmlValidator);
      });
    });
    seq = seq.then(function(){
      resolve(report);
    });
  });
};

var _processHtmlPathWithHtmlValidator = function(fileReport, htmlValidator) {
  return new Promise(function(resolve, reject){
    console.log('processing ' + fileReport.context + ' with w3cjs');
    fsUtils.loadResource(fileReport.context, 'utf-8')
      .then(function(fileContents){
        return validateHtmlReporter.generateReport(fileReport.validator, htmlValidator, fileContents);
      })
      .catch(function(error){
        console.log('htmlValidator-processor error');
        console.log(error);
      })
      .then(function(){
        resolve(fileReport);
      });
  });
};

var _startHtmlValidator = function() {
  return new Promise(function(resolve, reject){
    var w3cjs = require('w3cjs');
    var htmlValidator = {
      open: function(){},
      close: function(){},
      validate: function(fileContents) {
        return new Promise(function(resolve2, reject2){
          w3cjs.validate({
            input: fileContents,
            output: 'json',
            callback: function (res) {
              resolve2(res.messages);
            }
          });
        });
      }
    };
    resolve(htmlValidator);
  });
};

var _stopHtmlValidator = function(htmlValidator) {
  return new Promise(function(resolve, reject){
    htmlValidator.close();
    resolve();
  });
};

module.exports = {
  buildReport: buildReport
};
