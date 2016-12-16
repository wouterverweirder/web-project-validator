var path = require('path'),
  url = require('url'),
  fsUtils = require('./fs_utils'),
  postcss = require('postcss');

var lintCssReporter = require('./reporter/lint-css');
var lintLinkedCssFilesReporter = require('./reporter/lint-linked-css-files');
var validateResourcePathReporter = require('./reporter/validate-resource-path');
var validateLinkedResourcePathsReporter = require('./reporter/validate-linked-resource-paths');
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
    //loop through paths and styleSheetPaths
    let allPaths = [].concat(fileReport.resources.paths, fileReport.resources.styleSheetPaths);
    const pathsMap = {}; //make unique list
    allPaths.forEach(resourcePath => pathsMap[resourcePath] = resourcePath);
    allPaths = Object.keys(pathsMap);
    allPaths.forEach(function(resourcePath){
      seq = seq.then(function(){
        return _doesResourceNeedTextHandling(fileReport, resourcePath);
      }).then(function(resourceNeedsTextHandling){
        console.log("loadResource", resourceNeedsTextHandling, resourcePath);
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
        console.error(error);
      })
    });

    //done
    seq = seq.then(function(){
      return validateLinkedResourcePathsReporter.generateReport(fileReport.resources).catch(e => {
        console.log('###############################################################');
        console.log('###############################################################');
        console.log(fileReport.resources);
        console.log('###############################################################');
        console.error(e)
        console.log('###############################################################');
        console.log('###############################################################');
      });
    })
    .then(function(){
      return lintLinkedCssFilesReporter.generateReport(fileReport.stylelint);
    })
    .then(function(){
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
      return _isResourceHtml(fileReport, resourcePath);
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
      var stylelintReport = { context: resourcePath };
      fileReport.stylelint.results.push(stylelintReport);
      return lintCssReporter.generateReport(stylelintReport, fileContents)
    })
    .then(function(){
      //get the background images from the css file
      return postcss().process(fileContents, {parser: require('postcss-safe-parser')})
      .then(result => {
        const backgroundImagePaths = [];
        result.root.walkDecls(node => {
          if(node.prop === 'background' || node.prop === 'background-image') {
            const matches = node.value.match(/url\((.*?)\)/);
            if(!matches) {
              return;
            }
            const url = matches[1].replace(/('|")/g,'');
            //url is relative to the css file!
            backgroundImagePaths.push(url);
          }
        });
        return backgroundImagePaths;
      })
      .then(function(backgroundImagePaths){
        backgroundImagePaths.forEach(backgroundImagePath => {
          let cleanedUpCssPath = fsUtils.getPathWithoutQueryString(resourcePath);
          if(cleanedUpCssPath.indexOf('file://') === 0) {
            cleanedUpCssPath = cleanedUpCssPath.substr('file://'.length);
          }
          if(!fsUtils.pathIsRemoteUrl(backgroundImagePath)) {
            if(!fsUtils.pathIsRemoteUrl(cleanedUpCssPath)) {
              backgroundImagePath = 'file://' + path.resolve(cleanedUpCssPath, '..', backgroundImagePath);
            } else {
              backgroundImagePath = url.resolve(cleanedUpCssPath, backgroundImagePath);
            }
          }
          if(fileReport.images.backgroundImagePaths.indexOf(backgroundImagePath) > -1) {
            return;
          }
          fileReport.images.backgroundImagePaths.push(backgroundImagePath);
        });
      });
    })
    .then(function(){
      return _saveResourceToOutput(fileReport, resourcePath, fileContents, resourceReport);
    });
};

var _saveResourceToOutput = function(fileReport, resourcePath, fileContents, resourceReport) {
  let targetPath = path.resolve(fileReport.outputFolder, 'src', resourceReport.relativePath);
  //add .html suffix for file context
  if(_isResourceHtml(fileReport, resourcePath)) {
    if(path.extname(targetPath) !== '.htm' && path.extname(targetPath) !== '.html') {
      targetPath += '.html';
    }
  }
  return Promise.resolve()
    .then(function(){
      return fsUtils.writeFile(targetPath, fileContents);
    })
    .then(function(savedResourcePath){
      resourceReport.source = savedResourcePath;
    })
    .catch(function(error){
      console.log('save resource error: ' + error);
    });
};

var _doesResourceNeedTextHandling = function(fileReport, resourcePath) {
  return _isResourceStyleSheet(fileReport, resourcePath) || _isResourceHtml(fileReport, resourcePath);
};

var _isResourceStyleSheet = function(fileReport, resourcePath) {
  if(fileReport.resources.styleSheetPaths.indexOf(resourcePath) > -1) {
    return true;
  }
  return false;
};

var _isResourceHtml = function(fileReport, resourcePath) {
  if(
    resourcePath === fileReport.context ||
    resourcePath === 'file://' + fileReport.context
  ) {
    return true;
  }
  return false;
};

var _addFileNotFoundMessageIfNeeded = function(resourcePath, resourcesNotFoundMap, resourceReport) {
  if(!resourcesNotFoundMap[resourcePath]) {
    resourcesNotFoundMap[resourcePath] = {
      context: resourcePath,
      type: 'error',
      rule: 'file-not-found',
      message: resourcePath + ' not found'
    };
    resourceReport.messages.push(resourcesNotFoundMap[resourcePath]);
  }
};

var _generateBasicResourceReports = function(fileReport, resourceReportsByResourceName){
  let allPaths = [].concat(fileReport.resources.paths, fileReport.resources.styleSheetPaths);
  const pathsMap = {}; //make unique list
  allPaths.forEach(resourcePath => pathsMap[resourcePath] = resourcePath);
  allPaths = Object.keys(pathsMap);
  allPaths.forEach(function(resourcePath){
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
  // fileReport.resources.styleSheetPaths.forEach(function(resourcePath){
  //   if(!resourceReportsByResourceName[resourcePath]) {
  //     resourceReportsByResourceName[resourcePath] = {
  //       context: resourcePath,
  //       messages: []
  //     };
  //     fileReport.resources.results.push(resourceReportsByResourceName[resourcePath]);
  //   }
  // });
};

module.exports = {
  buildReport: buildReport
};
