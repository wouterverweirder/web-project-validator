var fsUtils = require('./fs_utils'),
  path = require('path'),
  mkdirp = require('mkdirp');

var WebProjectValidator = function(){
};

/**
 * report.context: path or url to input
 * options.type: file, folder, url
 */
WebProjectValidator.prototype.initReport = function(report, options) {
  if(!report.context) {
    throw "report is missing a context";
  }
  options = options || {};
  this._initDefaultOptions(options);
  var initalizer = this._getInitializerForInputType(options.type);
  var self = this;
  return initalizer(report, options)
    .then(function(){
      return self._fillReportWithBasicFileReports(report, options);
    });
};

WebProjectValidator.prototype.createOutputFoldersForReport = function(report) {
  var sequence = Promise.resolve();
  var self = this;
  for(var htmlFilePath in report.reportsByFile) {
    (function(htmlFilePath){
      sequence = sequence.then(function(){
      var fileReport = report.reportsByFile[htmlFilePath];
      return self._createOutputFolderForFileReport(fileReport);
    });
    })(htmlFilePath);
  }
  sequence = sequence.then(function(){
    return report;
  });
  return sequence;
};

WebProjectValidator.prototype.buildReport = function(report, options, reporters) {
  var sequence = Promise.resolve();
  reporters.forEach(function(reporter){
    sequence = sequence.then(function(){
      return reporter.buildReport(report, options);
    });
  });
  sequence = sequence.then(function(){
    return report;
  });
  return sequence;
};

WebProjectValidator.prototype._createOutputFolderForFileReport = function(fileReport) {
  return new Promise(function(resolve, reject){
    if(!fileReport.outputFolder) {
      return resolve();
    }
    mkdirp(fileReport.outputFolder, function(error){
      if(error) {
        return reject(error);
      }
      resolve();
    });
  });
};

WebProjectValidator.prototype._initDefaultOptions = function(options) {
  options.type = options.type || 'url';
  options.outputFolder = path.resolve(options.outputFolder || './output');
};

/**
 * inputType: file, folder, url
 */
WebProjectValidator.prototype._getInitializerForInputType = function(inputType) {
  if(inputType === 'file') {
    return this._initReportForInputFile;
  }
  if(inputType === 'folder') {
    return this._initReportForInputFolder;
  }
  if(inputType === 'list') {
    return this._initReportForInputList;
  }
  return this._initReportForInputUrl;
};

WebProjectValidator.prototype._initReportForInputFile = function(report, options) {
  return Promise.resolve()
    .then(function(){
      report.htmlFilePaths = [ report.context ];
    })
    .then(function(){
      return report;
    });
};

WebProjectValidator.prototype._initReportForInputFolder = function(report, options) {
  return Promise.resolve()
    .then(function(){
      return fsUtils.getHtmlFilesFromDirectory(report.context);
    })
    .then(function(htmlFilePaths){
      report.htmlFilePaths = htmlFilePaths;
    })
    .then(function(){
      return report;
    });
};

WebProjectValidator.prototype._initReportForInputUrl = function(report, options) {
  return Promise.resolve()
    .then(function(){
      report.htmlFilePaths = [ report.context ];
    })
    .then(function(){
      return report;
    });
};

WebProjectValidator.prototype._initReportForInputList = function(report, options) {
  return Promise.resolve()
    .then(function(){
      return fsUtils.getUrlsFromList(report.context);
    })
    .then(function(urls){
      report.htmlFilePaths = urls;
    })
    .then(function(){
      return report;
    });
};

WebProjectValidator.prototype._getOutputFolderForHtmlFilePath = function(report, options, htmlFilePath) {
  if(options.type === 'folder') {
    return path.resolve(options.outputFolder, path.relative(report.context, htmlFilePath));
  }
  if(options.type === 'file') {
    return path.resolve(options.outputFolder, path.relative(path.resolve(report.context, '..'), htmlFilePath));
  }
  return path.resolve(options.outputFolder, fsUtils.getPathWithoutProtocol(fsUtils.getPathWithoutQueryString(htmlFilePath)));
};

WebProjectValidator.prototype._fillReportWithBasicFileReports = function(report, options) {
  this._initDefaultOptions(options);
  report.outputFolder = options.outputFolder;
  report.reportsByFile = {};
  report.htmlFilePaths.forEach(function(htmlFilePath){
    report.reportsByFile[htmlFilePath] = {
      context: htmlFilePath,
      screenshots: {
        context: htmlFilePath,
        screenshots: []
      },
      outline: {
        context: htmlFilePath
      },
      validator: {
        context: htmlFilePath
      },
      stylelint: {
        context: htmlFilePath,
        results: []
      },
      resources: {
        context: htmlFilePath,
        paths: [],
        styleSheetPaths: [],
        results: []
      }
    };
    report.reportsByFile[htmlFilePath].outputFolder = this._getOutputFolderForHtmlFilePath(report, options, htmlFilePath);
  }, this);
  return report;
};

module.exports = WebProjectValidator;
