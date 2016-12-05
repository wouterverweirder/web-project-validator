var fs = require('fs'),
  path = require('path'),
  handlbars = require('handlebars');

var lintCssReporter = require('../lint-css');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(stylelintReport) {
  //is done in the resource-processor
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
    output += '<header><h1 class="h' + (options.indentLevel + 1) + '">Lint linked css files</h1></header>';
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
