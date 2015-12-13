var argv = require('minimist')(process.argv.slice(2)),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  fsUtils = require('./lib/fs_utils');

var lintLinkedCssFilesReporter = require('./lib/reporter/lint-linked-css-files');
var outlineHtmlReporter = require('./lib/reporter/outline-html');
var validateHtmlReporter = require('./lib/reporter/validate-html');
var validateLinkedResourcePathsReporter = require('./lib/reporter/validate-linked-resource-paths');

var generateIndent = require('./lib/indent_utils').generateIndent;
var getHtmlFilesFromDirectory = require('./lib/fs_utils').getHtmlFilesFromDirectory;

var outputFolder = './output';
var outputStyle = 'html';
// var inputFolder;

var init = function() {
  if(argv['output-folder']) {
    outputFolder = argv['output-folder'];
  }
  if(argv['output-style']) {
    outputStyle = argv['output-style'];
  }
  processInput(argv)
    .then(function(report){
      return generateOutput(report);
    })
    .then(function(){
      console.log('ALL DONE');
    });
};

var processInput = function(argv) {
  if(argv['input-file']) {
    return processInputFile(argv['input-file']);
  } else if(argv['input-folder']) {
    return processInputFolder(argv['input-folder']);
  }
};

var generateOutput = function(report) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        var fileReport = report.reportsByFile[htmlFilePath];
        return generateReportOutput(fileReport, { outputFolderForThisFile: fileReport.outputFolder });
      }).catch(function(error){
        console.log(error);
      });
    });
    seq.then(function(){
      resolve();
    });
  });
};

var processInputFile = function(filePath) {
  return new Promise(function(resolve, reject){
    var report = {
      context: filePath,
      inputType: 'file',
      inputFolder: path.resolve(filePath, '..'),
      outputFolder: outputFolder,
      outputStyle: outputStyle,
      htmlFilePaths: [filePath]
    };
    Promise.resolve()
      .then(function(){
        return buildReport(report);
      })
      .then(function(){
        resolve(report);
      });
  });
};

var processInputFolder = function(folderPath) {
  return new Promise(function(resolve, reject){
    var report = {
      context: folderPath,
      inputType: 'folder',
      inputFolder: path.resolve(folderPath, '.'),
      outputFolder: outputFolder,
      outputStyle: outputStyle,
      htmlFilePaths: []
    };
    getHtmlFilesFromDirectory(folderPath)
      .then(function(htmlFilePaths){
        report.htmlFilePaths = htmlFilePaths;
      })
      .then(function(){
        return buildReport(report);
      })
      .then(function(){
        resolve(report);
      });
  });
};

var buildReport = function(report) {
  return new Promise(function(resolve, reject){
    return Promise.resolve()
      .then(function(){
        return fillReportWithBasicFileReports(report);
      })
      .then(function(){
        return require('./lib/phantom-processor').buildReport(report);
      })
      .then(function(){
        return require('./lib/jsdom-processor').buildReport(report);
      })
      .then(function(){
        return require('./lib/vnu-processor').buildReport(report);
      })
      .then(function(){
        return require('./lib/resource-processor').buildReport(report);
      })
      .catch(function(error){
        console.log(error);
      })
      .then(function(report){
        resolve(report);
      });
  });
};

var fillReportWithBasicFileReports = function(report) {
  report.reportsByFile = {};
  report.htmlFilePaths.forEach(function(htmlFilePath){
    report.reportsByFile[htmlFilePath] = {
      context: htmlFilePath,
      outputFolder: path.resolve(outputFolder, path.relative(report.inputFolder, htmlFilePath)),
      screenshots: {},
      styleSheetPaths: [],
      resourcePaths: [],
      outline: {
        context: htmlFilePath
      },
      validator: {
        context: htmlFilePath
      },
      csslint: {
        context: htmlFilePath,
        results: []
      },
      resources: {
        context: htmlFilePath,
        results: []
      }
    };
  });
  return report;
};

var generateReportOutput = function(report, options) {
  var seq = Promise.resolve();
  var reportFileName;
  if(outputStyle === 'text') {
    reportFileName = 'report.txt';
    seq = seq.then(function() { return generateTextReport(report, options); });
  } else {
    reportFileName = 'index.html';
    seq = seq.then(function() { return generateHtmlReport(report, options); });
  }
  seq = seq.then(function(output){
    if(options.outputFolderForThisFile) {
      return new Promise(function(resolve, reject){
        mkdirp(options.outputFolderForThisFile, function(error){
          if(error) {
            return reject(error);
          }
          var reportFilePath = path.resolve(options.outputFolderForThisFile, reportFileName);
          fs.writeFile(reportFilePath, output, function(error){
            if(error) {
              return reject(error);
            }
            console.log('wrote report: ' + reportFilePath);
            resolve();
          });
        });
      });
    }
  });
  return seq;
};

var generateTextReport = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + report.context + "\n";

    var sequence = Promise.resolve()
      .then(function(){
        return validateHtmlReporter.convertReportToPlainText(report.validator, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('validateHtmlReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return outlineHtmlReporter.convertReportToPlainText(report.outline, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('outlineHtmlReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return lintLinkedCssFilesReporter.convertReportToPlainText(report.csslint, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('lintLinkedCssFilesReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return validateLinkedResourcePathsReporter.convertReportToPlainText(report.resources, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('validateLinkedResourcePathsReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        resolve(output);
      })
      .catch(function(error){
        reject(error);
      });
  });
};

var generateHtmlReport = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = '<html>';
    output += '<head>';
    output += '<meta charset="UTF-8" />';
    output += '<meta name="viewport" content="width=device-width, initial-scale=1">';
    output += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">';
    output += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">';
    output += '<script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>';
    output += '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>';
    output += '</head>';
    output += '<body>';
    output += '<main class="container-fluid">';
    output += '<header><h1>Webpage Report</h1></header>';
    output += '<p>' + report.context + '</p>';

    var sequence = Promise.resolve()
      .then(function(){
        return validateHtmlReporter.convertReportToHtml(report.validator, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return outlineHtmlReporter.convertReportToHtml(report.outline, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return lintLinkedCssFilesReporter.convertReportToHtml(report.csslint, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return validateLinkedResourcePathsReporter.convertReportToHtml(report.resources, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        output += '</main></body></html>';
        resolve(output);
      })
      .catch(function(error){
        reject(error);
      });
  });
};

init();
