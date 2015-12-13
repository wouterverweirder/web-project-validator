var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  fsUtilsLib = require('../../fs_utils'),
  fetch = require('node-fetch');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(resourceReport, options) {
  return new Promise(function(resolve, reject){
    Promise.resolve()
      .then(function(){
        if(!_pathIsHttp(resourceReport.context)) {
          var webRoot = options.webRoot || false;
          var relativePath = resourceReport.context.split("?")[0]; //remove querystring
          if(webRoot) {
            var index = relativePath.indexOf(options.webRoot);
            if(index > -1) {
              relativePath = relativePath.substr(options.webRoot.length + index);
            }
          }
          return _validateResourcePath(resourceReport, relativePath);
        }
      })
      .then(function(){
        resourceReport.dangerMessages = [];
        resourceReport.warningMessages = [];
        resourceReport.messages.forEach(function(message){
          if(message.type === 'error') {
            message.outputType = 'danger';
            resourceReport.dangerMessages.push(message);
          } else {
            message.outputType = 'warning';
            resourceReport.warningMessages.push(message);
          }
        });
      })
      .then(function(){
        resolve(resourceReport);
      })
      .catch(function(error){
        reject(error);
      });
  });
};

var convertReportToPlainText = function(loadedResourceReport, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + "ASSET: " + loadedResourceReport.context + "\n";
    output += generateIndent(options.indentLevel + 1) + "errors: " + loadedResourceReport.dangerMessages.length + "\n";
    loadedResourceReport.dangerMessages.forEach(function(error){
      output += generateIndent(options.indentLevel + 2) + error.message + "\n";
    });
    output += generateIndent(options.indentLevel + 1) + "warnings: " + loadedResourceReport.warningMessages.length + "\n";
    loadedResourceReport.warningMessages.forEach(function(warning){
      output += generateIndent(options.indentLevel + 2) + warning.message + "\n";
    });
    resolve(output);
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
  });
};

var _validateResourcePath = function(resourceReport, relativePath) {
  return new Promise(function(resolve, reject){
    var sanitized = relativePath.replace(/[^\w.:\/-]+/g, "").toLowerCase();
    if(relativePath !== sanitized) {
      resourceReport.messages.push({
        type: 'warning',
        message: relativePath + ' should be named ' + sanitized
      });
    }
    resolve(resourceReport);
  });
};

var _pathIsHttp = function(path) {
  return (path.indexOf('http://') === 0 || path.indexOf('https://') === 0);
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
