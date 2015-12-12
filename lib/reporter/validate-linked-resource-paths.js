var phantomBridge = require('../phantom_bridge.js'),
  path = require('path'),
  fsUtilsLib = require('../fs_utils.js'),
  fetch = require('node-fetch');

var validateResourcePathReporter = require('./validate-resource-path.js');

var generateIndent = require('../indent_utils.js').generateIndent;

var generateReport = function(htmlFilePath) {
  var htmlFolderPath = path.resolve(htmlFilePath, '..');
  var report = {
    context: htmlFilePath,
    results: []
  };
  return _getResourcePathsLoadedByPage(htmlFilePath)
    .then(function(resourcePaths){
      var seq = Promise.resolve();
      resourcePaths.forEach(function(resourcePath){
        seq = seq.then(function(){
          return validateResourcePathReporter.generateReport(resourcePath, { webRoot: htmlFolderPath })
        })
        .then(function(resourceReport){
          report.results.push(resourceReport);
        })
        .catch(function(err){
          throw err;
        });
      });
      return seq;
    }).then(function(result, err){
      if(err) {
        throw err;
        return;
      }
      return report;
    });
};

var convertReportToPlainText = function(report, indentLevel) {
  return new Promise(function(resolve, reject){
    if(!indentLevel) {
      indentLevel = 0;
    }
    var indent = generateIndent(indentLevel);
    var output = indent + "ASSETST\n";
    var sequence = Promise.resolve();
    report.results.forEach(function(resourcePathReport){
      sequence = sequence.then(function(){
        return validateResourcePathReporter.convertReportToPlainText(resourcePathReport, indentLevel + 1);
      })
      .then(function(reportOutput){
        output += reportOutput;
      });
    });
    sequence = sequence.then(function(){
      resolve(output);
    })
    .catch(function(error){
      reject(error);
    });
  });
};

var _getResourcePathsLoadedByPage = function(htmlFilePath) {
  var _page;
  return phantomBridge.start()
    .then(function(ph){
      return new Promise(function(resolve, reject){
        ph.createPage(function(page) {
          _page = page;
          var fileNames = [];
          page.set('onResourceRequested', function (resource) {
            fileNames.push(resource.url);
          });
          page.set('onLoadFinished', function (status) {
            resolve(fileNames);
          });
          page.open(htmlFilePath, function (status) {
          });
        });
      });
    })
    .then(function(fileNames, error){
      if(_page) {
        _page.close();
      }
      if(error) {
        throw error;
        return;
      }
      return fileNames;
    });
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText
};
