var path = require('path'),
  fsUtils = require('./fs_utils');

var lintCssReporter = require('./reporter/lint-css');
var validateResourcePathReporter = require('./reporter/validate-resource-path');
var resourceNr = 0;

var buildReport = function(report) {
  var _ph;
  return Promise.resolve()
    .then(function(){
      return _buildReportWithResourceLoader(report);
    })
    .then(function(){
      return report;
    });
};

var _buildReportWithResourceLoader = function(report) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        return _processHtmlFileWithResourceLoader(report.reportsByFile[htmlFilePath]);
      });
    });
    seq = seq.then(function(){
      resolve(report);
    });
  });
};

var _processHtmlFileWithResourceLoader = function(fileReport) {
  return new Promise(function(resolve, reject){
    console.log('processing ' + fileReport.context + ' with resource loader');

    var resourceReportsByResourceName = {};
    _generateBasicResourceReports(fileReport, resourceReportsByResourceName);
    var resourcesNotFoundMap = {};

    var seq = Promise.resolve();
    fileReport.resourcePaths.forEach(function(resourcePath){
      seq = seq.then(function(){
        return _doesResourceNeedTextHandling(fileReport, resourcePath);
      }).then(function(resourceNeedsTextHandling){
        if(resourceNeedsTextHandling) {
          return fsUtils.loadResource(resourcePath, 'utf-8');
        } else {
          return fsUtils.loadResource(resourcePath);
        }
      })
      .then(function(result){
        return _handleResourceContent(fileReport, resourcePath, result, resourceReportsByResourceName[resourcePath]);
      }, function(error){
        return _addFileNotFoundMessageIfNeeded(resourcePath, resourcesNotFoundMap, resourceReportsByResourceName[resourcePath]);
      })
      .then(function(){
        //check the resource name - is it a valid name?
        var htmlFolderPath = path.resolve(fileReport.context, '..');
        return validateResourcePathReporter.generateReport(resourceReportsByResourceName[resourcePath], {
          webRoot: htmlFolderPath
        });
      })
      .catch(function(error){
        console.log('resource-processor error' + error);
      })
    });

    //done
    seq = seq.then(function(){
      resolve(fileReport);
    });
  });
};

var _handleResourceContent = function(fileReport, resourcePath, fileContents, resourceReport) {
  return Promise.resolve()
    .then(function(){
      return _handleStyleSheetIfNeeded(fileReport, resourcePath, fileContents, resourceReport);
    })
    .then(function(){
      return _handleHtmlIfNeeded(fileReport, resourcePath, fileContents, resourceReport);
    });
};

var _handleHtmlIfNeeded = function(fileReport, resourcePath, fileContents, resourceReport) {
  return Promise.resolve()
    .then(function(){
      return (resourcePath === 'file://' + fileReport.context);
    })
    .then(function(isHtml){
      if(isHtml) {
        resourceReport.mode = 'htmlmixed';
        return _saveResourceToOutput(fileReport, resourcePath, fileContents, resourceReport);
      }
    });
};

var _handleStyleSheetIfNeeded = function(fileReport, resourcePath, fileContents, resourceReport) {
  return Promise.resolve()
    .then(function(){
      return _isResourceStyleSheet(fileReport, resourcePath);
    })
    .then(function(isStyleSheet){
      if(isStyleSheet) {
        resourceReport.mode = 'css';
        return _handleStylesheet(fileReport, resourcePath, fileContents, resourceReport);
      }
    });
};

var _handleStylesheet = function(fileReport, resourcePath, fileContents, resourceReport) {
  return Promise.resolve()
    .then(function(){
      var csslintReport = { context: resourcePath };
      fileReport.csslint.results.push(csslintReport);
      return lintCssReporter.generateReport(csslintReport, fileContents)
    })
    .then(function(){
      return _saveResourceToOutput(fileReport, resourcePath, fileContents, resourceReport);
    });
};

var _saveResourceToOutput = function(fileReport, resourcePath, fileContents, resourceReport) {
  return Promise.resolve()
    .then(function(){
      //save the file contents to a file in the output folder
      return fsUtils.writeFile(path.resolve(fileReport.outputFolder, 'src', resourceReport.relativePath), fileContents);
    })
    .then(function(savedResourcePath){
      resourceReport.source = savedResourcePath;
    })
    .catch(function(error){
      console.log('save resource error: ' + error);
    });
};

var _doesResourceNeedTextHandling = function(fileReport, resourcePath) {
  if(fileReport.styleSheetPaths.indexOf(resourcePath) > -1) {
    return true;
  }
  return false;
};

var _isResourceStyleSheet = function(fileReport, resourcePath) {
  if(fileReport.styleSheetPaths.indexOf(resourcePath) > -1) {
    return true;
  }
  return false;
};

var _addFileNotFoundMessageIfNeeded = function(resourcePath, resourcesNotFoundMap, resourceReport) {
  if(!resourcesNotFoundMap[resourcePath]) {
    resourcesNotFoundMap[resourcePath] = {
      context: resourcePath,
      type: 'error',
      message: 'file not found'
    };
    resourceReport.messages.push(resourcesNotFoundMap[resourcePath]);
  }
};

var _generateBasicResourceReports = function(fileReport, resourceReportsByResourceName){
  fileReport.resourcePaths.forEach(function(resourcePath){
    if(!resourceReportsByResourceName[resourcePath]) {
      var htmlFolderPath = path.resolve('file://' + fileReport.context, '..');
      var relativePath = resourcePath;
      //http or fs?
      if(fsUtils.pathIsRemoteUrl(relativePath)) {
        relativePath = fsUtils.getPathWithoutProtocol(relativePath);
      } else {
        relativePath = path.relative(htmlFolderPath, resourcePath);
      }
      relativePath = fsUtils.getPathWithoutQueryString(relativePath);
      resourceReportsByResourceName[resourcePath] = {
        context: resourcePath,
        relativePath: relativePath,
        nr: ++resourceNr,
        messages: []
      };
      fileReport.resources.results.push(resourceReportsByResourceName[resourcePath]);
    }
  });
  fileReport.styleSheetPaths.forEach(function(resourcePath){
    if(!resourceReportsByResourceName[resourcePath]) {
      resourceReportsByResourceName[resourcePath] = {
        context: resourcePath,
        messages: []
      };
      fileReport.resources.results.push(resourceReportsByResourceName[resourcePath]);
    }
  });
};

module.exports = {
  buildReport: buildReport
};
