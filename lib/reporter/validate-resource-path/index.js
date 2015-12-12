var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  fsUtilsLib = require('../../fs_utils'),
  fetch = require('node-fetch');

var generateIndent = require('../../indent_utils').generateIndent;

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
        report.dangerMessages = [];
        report.warningMessages = [];
        report.messages.forEach(function(message){
          if(message.type === 'error') {
            message.outputType = 'danger';
            report.dangerMessages.push(message);
          } else {
            message.outputType = 'warning';
            report.warningMessages.push(message);
          }
        });
      })
      .then(function(){
        resolve(report);
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
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
