'use strict';

var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  fsUtilsLib = require('../../fs_utils'),
  fetch = require('node-fetch');

var validateResourcePathReporter = require('../validate-resource-path');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(resourcesReport) {
  return new Promise((resolve, reject) => {
    //most of the heavy lifting has been done in the resource-processor for each file
    resourcesReport.numErrors = 0;
    resourcesReport.numWarnings = 0;
    resourcesReport.numResources = resourcesReport.results.length;
    resourcesReport.results.forEach(resourcePathReport => {
      resourcesReport.numErrors += resourcePathReport.dangerMessages.length;
      resourcesReport.numWarnings += resourcePathReport.warningMessages.length;
    });
    resourcesReport.messages = [];
    const dangerMessagesByRule = getGroupedByRule(resourcesReport.results, 'dangerMessages');
    for(let ruleName in dangerMessagesByRule) {
      const message = {
        rule: ruleName,
        message: ruleName,
        outputType: 'danger',
        evidence: '',
        numMessages: 0
      };
      dangerMessagesByRule[ruleName].forEach(o => {
        message.evidence += o.message + "\n";
        message.numMessages++;
      });
      resourcesReport.messages.push(message);
    }
    const warningMessagesByRule = getGroupedByRule(resourcesReport.results, 'warningMessages');
    for(let ruleName in warningMessagesByRule) {
      const message = {
        rule: ruleName,
        message: ruleName,
        outputType: 'warning',
        evidence: '',
        numMessages: 0
      };
      warningMessagesByRule[ruleName].forEach(o => {
        message.evidence += o.message + "\n";
        message.numMessages++;
      });
      resourcesReport.messages.push(message);
    }
    resolve(resourcesReport);
  });
};

const getGroupedByRule = (resourceReports, errorTypeName = 'dangerMessages') => {
  const groupedByRule = {};
  resourceReports.forEach(resourceReport => {
    resourceReport[errorTypeName].forEach(message => {
      if(!groupedByRule[message.rule]) {
        groupedByRule[message.rule] = [];
      }
      groupedByRule[message.rule].push(message);
    });
  });
  return groupedByRule;
};

var convertReportToHtml = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }

    fs.readFile(path.resolve(__dirname, 'template.hbs'), 'utf-8', function(error, source){
      if(error) {
        return reject(error);
      }
      var template = handlebars.compile(source);
      var output = template(Object.assign({}, report, {
        indentLevel: options.indentLevel+1,
        indentLevel2: options.indentLevel+2,
        indentLevel3: options.indentLevel+3
      }));
      resolve(output);
    });

    //
    // var output = '<section>';
    // output += '<header><h1 class="h' + (options.indentLevel + 1) + '">';
    // output += 'Validate Resource Paths';
    // output += '<span class="small"> ' + report.numResources + ' resources (' + report.numErrors + ' errors / ' + report.numWarnings + ' warnings)</span>';
    // output += '</h1></header>';
    //
    // var sequence = Promise.resolve();
    // report.results.forEach(function(resourcePathReport){
    //   sequence = sequence.then(function(){
    //     return validateResourcePathReporter.convertReportToHtml(resourcePathReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
    //   })
    //   .then(function(reportOutput){
    //     output += reportOutput;
    //   });
    // });
    // sequence = sequence.then(function(){
    //   output += '</section>';
    //   resolve(output);
    // })
    // .catch(function(error){
    //   reject(error);
    // });
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
  convertReportToHtml: convertReportToHtml,
};
