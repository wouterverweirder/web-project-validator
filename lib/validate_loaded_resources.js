var phantomBridge = require('./phantom_bridge.js'),
  path = require('path'),
  fsUtilsLib = require('./fs_utils.js'),
  fetch = require('node-fetch');

var generateIndent = require('./indent_utils.js').generateIndent;

var getResourcePathsLoadedByPage = function(htmlFilePath) {
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

var checkIfResourceLoads = function(path) {
  return new Promise(function(resolve, reject){
    //path can be http or local filesystem
    if(pathIsHttp(path)) {
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

var pathIsHttp = function(path) {
  return (path.indexOf('http://') === 0 || path.indexOf('https://') === 0);
};

var validateLoadedResourcesFromHtml = function(htmlFilePath) {
  var htmlFolderPath = path.resolve(htmlFilePath, '..');
  var report = {
    context: htmlFilePath,
    results: []
  };
  return getResourcePathsLoadedByPage(htmlFilePath)
    .then(function(resourcePaths){
      var seq = Promise.resolve();
      resourcePaths.forEach(function(resourcePath){
        var result = {
          context: resourcePath,
          messages: []
        };
        report.results.push(result);

        seq = seq.then(function(){
          return checkIfResourceLoads(resourcePath);
        }).then(function(exists){
          if(!exists) {
            result.messages.push({
              type: 'error',
              message: 'file not found'
            });
          }
        }).then(function(){
          //only validate files relative to the html
          var index = resourcePath.indexOf(htmlFolderPath);
          //ignore external filenames over http
          if(index === -1) {
            return;
          }
          //filenames can only contain lowercase characters, numbers, underscores, dashes and dots
          var fileName = resourcePath.split("?")[0]; //remove querystring
          //get the relative path
          fileName = fileName.substr(htmlFolderPath.length + index);
          var sanitized = fileName.replace(/[^\w.:\/-]+/g, "").toLowerCase();
          if(fileName !== sanitized) {
            result.messages.push({
              type: 'error',
              message: fileName + ' should be named ' + sanitized
            });
          }
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

var generateHtmlLoadedResourceReportsOutput = function(loadedResourcesReportForHtml, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = indent + "ASSETS\n";
  loadedResourcesReportForHtml.results.forEach(function(loadedResourceReport){
    output += generateLoadedResourceReportOutput(loadedResourceReport, indentLevel + 1);
  });
  return output;
};

var generateLoadedResourceReportOutput = function(loadedResourceReport, indentLevel) {
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
  return output;
};

module.exports = {
  validateLoadedResourcesFromHtml: validateLoadedResourcesFromHtml,
  generateLoadedResourceReportOutput: generateLoadedResourceReportOutput,
  generateHtmlLoadedResourceReportsOutput: generateHtmlLoadedResourceReportsOutput
};
