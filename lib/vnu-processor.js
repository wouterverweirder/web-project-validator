var path = require('path'),
  fsUtils = require('./fs_utils');

var validateHtmlReporter = require('./reporter/validate-html');

var buildReport = function(report) {
  var _vnu;
  return _startVnu()
    .then(function(vnu){
      _vnu = vnu;
    })
    .then(function(){
      return _buildReportWithVnu(report, _vnu);
    })
    .then(function(){
      return _stopVnu(_vnu);
    })
    .then(function(){
      return report;
    });
};

var _buildReportWithVnu = function(report, vnu) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        return _processHtmlPathWithVnu(report.reportsByFile[htmlFilePath], vnu);
      });
    });
    seq = seq.then(function(){
      resolve(report);
    });
  });
};

var _processHtmlPathWithVnu = function(fileReport, vnu) {
  return new Promise(function(resolve, reject){
    console.log('processing ' + fileReport.context + ' with validator.nu');
    fsUtils.loadResource(fileReport.context, 'utf-8')
      .then(function(fileContents){
        return validateHtmlReporter.generateReport(fileReport.validator, vnu, fileContents);
      })
      .catch(function(error){
        console.log('vnu-processor error');
        console.log(error);
      })
      .then(function(){
        resolve(fileReport);
      });
  });
};

var _startVnu = function() {
  return new Promise(function(resolve, reject){
    var VnuClass = require("validator-nu").Vnu;
    var vnu = new VnuClass();
    vnu.open()
      .then(function(){
        resolve(vnu);
      });
  });
};

var _stopVnu = function(vnu) {
  return new Promise(function(resolve, reject){
    vnu.close();
    resolve();
  });
};

module.exports = {
  buildReport: buildReport
};
