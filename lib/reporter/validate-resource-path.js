var path = require('path'),
  fsUtilsLib = require('../fs_utils.js'),
  fetch = require('node-fetch');

var generateIndent = require('../indent_utils.js').generateIndent;

var generateReport = function(filePath, options) {
  return new Promise(function(resolve, reject){
    var report = {
      context: filePath,
      messages: []
    };
    _checkIfResourceLoads(filePath)
      .then(function(exists){
        if(!exists) {
          report.messages.push({
            type: 'error',
            message: 'file not found'
          });
        }
      })
      .then(function(){
        if(!_pathIsHttp(filePath)) {
          var webRoot = options.webRoot || false;
          var relativePath = filePath.split("?")[0]; //remove querystring
          if(webRoot) {
            var index = relativePath.indexOf(options.webRoot);
            if(index > -1) {
              relativePath = relativePath.substr(options.webRoot.length + index);
            }
          }
          return _validateResourcePath(relativePath);
        }
        return [];
      })
      .then(function(resourcePathValidationMessages){
        report.messages = report.messages.concat(resourcePathValidationMessages);
      })
      .then(function(){
        resolve(report);
      })
      .catch(function(error){
        reject(error);
      });
  });
};

var convertReportToPlainText = function(loadedResourceReport, indentLevel) {
  return new Promise(function(resolve, reject){
    if(!indentLevel) {
      indentLevel = 0;
    }
    var indent = generateIndent(indentLevel);
    var output = indent + "ASSET: " + loadedResourceReport.context + "\n";
    var errors = [];
    var warnings = [];
    loadedResourceReport.messages.forEach(function(message){
      if(message.type === 'error') {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    });
    output += generateIndent(indentLevel + 1) + "errors: " + errors.length + "\n";
    errors.forEach(function(error){
      output += generateIndent(indentLevel + 2) + error.message + "\n";
    });
    output += generateIndent(indentLevel + 1) + "warnings: " + warnings.length + "\n";
    warnings.forEach(function(warning){
      output += generateIndent(indentLevel + 2) + warning.message + "\n";
    });
    resolve(output);
  });
};

var _checkIfResourceLoads = function(path) {
  return new Promise(function(resolve, reject){
    //path can be http or local filesystem
    if(_pathIsHttp(path)) {
      fetch(path, {"rejectUnauthorized": false, }).then(function(response){
        resolve(response.status <= 400);
      }).catch(function(err){
        resolve(false);
      });
    } else {
      fsUtilsLib.checkFileExists(path).then(function(exists){
        resolve(exists);
      });
    }
  });
};

var _validateResourcePath = function(path) {
  return new Promise(function(resolve, reject){
    var messages = [];
    var sanitized = path.replace(/[^\w.:\/-]+/g, "").toLowerCase();
    if(path !== sanitized) {
      messages.push({
        type: 'error',
        message: path + ' should be named ' + sanitized
      });
    }
    resolve(messages);
  });
};

var _pathIsHttp = function(path) {
  return (path.indexOf('http://') === 0 || path.indexOf('https://') === 0);
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText
};
