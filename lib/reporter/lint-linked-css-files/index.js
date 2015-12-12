var fs = require('fs'),
  path = require('path'),
  handlbars = require('handlebars'),
  jsdom = require('jsdom');

var lintCssReporter = require('../lint-css');

var createArrayWithExistingFilePaths = require('../../fs_utils').createArrayWithExistingFilePaths;
var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(htmlFilePath) {
  var report = {
    context: htmlFilePath,
    results: []
  };
  return _getCssFilePathsFromHtmlFile(htmlFilePath)
    .then(function(cssFilePaths){
      return createArrayWithExistingFilePaths(cssFilePaths);
    })
    .then(function(cssFilePaths){
      var cssLinters = [];
      cssFilePaths.forEach(function(cssFilePath){
        cssLinters.push(lintCssReporter.generateReport(cssFilePath));
      });
      return Promise.all(cssLinters);
    })
    .then(function(cssLintersResults){
      report.results = cssLintersResults;
    })
    .then(function(){
      return report;
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
    report.results.forEach(function(cssLintReport){
      sequence = sequence.then(function(){
        return lintCssReporter.convertReportToPlainText(cssLintReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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
    report.results.forEach(function(cssLintReport){
      sequence = sequence.then(function(){
        return lintCssReporter.convertReportToHtml(cssLintReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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

var _getCssFilePathsFromHtmlFile = function(htmlFilePath) {
  return new Promise(function(resolve, reject){
    jsdom.env({
      file: htmlFilePath,
      scripts: [],
      done: function (error, window) {
        if(error) {
          return reject(error);
        }
        //get the linked stylesheets
        var doc = window.document;
        var cssFiles = doc.querySelectorAll('[rel="stylesheet"]');
        var cssFilePaths = [];
        for(var i = 0; i < cssFiles.length; i++) {
          var href = cssFiles[i].getAttribute('href');
          if(!href) {
            continue;
          }
          if(href.indexOf('http://') > -1 || href.indexOf('https://') > -1) {
            continue;
          }
          var cssFilePath = path.resolve(htmlFilePath, '..', href);
          //remove querystring parameters from uri
          cssFilePaths.push(cssFilePath.split("?")[0]);
        }
        resolve(cssFilePaths);
      }
    });
  });
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
