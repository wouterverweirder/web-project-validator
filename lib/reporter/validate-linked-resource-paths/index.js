var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  fsUtilsLib = require('../../fs_utils'),
  fetch = require('node-fetch');

var validateResourcePathReporter = require('../validate-resource-path');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(resourcesReport) {
  //most of the heavy lifting is done in the resource-processor for each file
  resourcesReport.numErrors = 0;
  resourcesReport.numWarnings = 0;
  resourcesReport.numResources = resourcesReport.results.length;
  resourcesReport.results.forEach(resourcePathReport => {
    resourcesReport.numErrors += resourcePathReport.dangerMessages.length;
    resourcesReport.numWarnings += resourcePathReport.warningMessages.length;
  });
};

var convertReportToPlainText = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + "ASSETS\n";
    output += generateIndent(options.indentLevel + 1) + report.numResources + ' resources (' + report.numErrors + ' errors / ' + report.numWarnings + ' warnings)' + "\n";
    var sequence = Promise.resolve();
    report.results.forEach(function(resourcePathReport){
      sequence = sequence.then(function(){
        return validateResourcePathReporter.convertReportToPlainText(resourcePathReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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

var convertReportToHtml = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var output = '<section>';
    output += '<header><h1 class="h' + (options.indentLevel + 1) + '">';
    output += 'Validate Resource Paths';
    output += '<span class="small"> ' + report.numResources + ' resources (' + report.numErrors + ' errors / ' + report.numWarnings + ' warnings)</span>';
    output += '</h1></header>';

    var sequence = Promise.resolve();
    report.results.forEach(function(resourcePathReport){
      sequence = sequence.then(function(){
        return validateResourcePathReporter.convertReportToHtml(resourcePathReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput){
        output += reportOutput;
      });
    });
    sequence = sequence.then(function(){
      output += '</section>';
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
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
