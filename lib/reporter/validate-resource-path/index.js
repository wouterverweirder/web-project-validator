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
        if(!fsUtilsLib.pathIsRemoteUrl(resourceReport.context)) {
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
        rule: 'wrong-filename',
        message: relativePath + ' should be named ' + sanitized
      });
    }
    resolve(resourceReport);
  });
};

module.exports = {
  generateReport: generateReport,
  convertReportToHtml: convertReportToHtml,
};
