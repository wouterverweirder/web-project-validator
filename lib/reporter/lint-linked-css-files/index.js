var fs = require('fs'),
  path = require('path'),
  handlbars = require('handlebars');

var lintCssReporter = require('../lint-css');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(stylelintReport) {
  //most of the heavy lifting is done in the resource-processor
  stylelintReport.numErrors = 0;
  stylelintReport.numWarnings = 0;
  stylelintReport.numResources = stylelintReport.results.length;
  stylelintReport.results.forEach(subReport => {
    stylelintReport.numErrors += subReport.numErrors;
    stylelintReport.numWarnings += subReport.numWarnings;
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
    var output = indent + "CSS LINT\n";
    var sequence = Promise.resolve();
    report.results.forEach(function(stylelintReport){
      sequence = sequence.then(function(){
        return lintCssReporter.convertReportToPlainText(stylelintReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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
    output += 'Lint CSS Files';
    output += '<span class="small"> ' + report.numResources + ' stylesheets (' + report.numErrors + ' errors / ' + report.numWarnings + ' warnings)</span>';
    output += '</h1></header>';
    var sequence = Promise.resolve();
    report.results.forEach(function(stylelintReport){
      sequence = sequence.then(function(){
        return lintCssReporter.convertReportToHtml(stylelintReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
