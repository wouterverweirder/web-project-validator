var argv = require('minimist')(process.argv.slice(2)),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp');

var lintLinkedCssFilesReporter = require('./lib/reporter/lint-linked-css-files');
var outlineHtmlReporter = require('./lib/reporter/outline-html');
var validateHtmlReporter = require('./lib/reporter/validate-html');
var validateLinkedResourcePathsReporter = require('./lib/reporter/validate-linked-resource-paths');

var generateIndent = require('./lib/indent_utils').generateIndent;
var getHtmlFilesFromDirectory = require('./lib/fs_utils').getHtmlFilesFromDirectory;

var phantomBridge = require('./lib/phantom_bridge');

var outputFolder = './output';
var outputStyle = 'html';
var inputFolder;

var init = function() {
  if(argv['output-folder']) {
    outputFolder = argv['output-folder'];
  }
  if(argv['output-style']) {
    outputStyle = argv['output-style'];
  }
  run()
    .catch(function(error){
      console.log('error');
      console.log(error);
    })
    .then(function(){
      //stop the phantomjs bridge & the vnu bridge
      phantomBridge.stop();
      validateHtmlReporter.exit();
      console.log('all done');
    });
};

var run = function() {
  if(argv['input-file']) {
    return processInputFile(argv['input-file']);
  } else if(argv['input-folder']) {
    return processInputFolder(argv['input-folder']);
  }
};

var processInputFile = function(filePath) {
  inputFolder = path.resolve(filePath, '..');
  return new Promise(function(resolve, reject){
    var outputFolderForThisFile = path.resolve(outputFolder, path.relative(inputFolder, filePath), '..');
    generateReportForFile(filePath, { outputFolderForThisFile: outputFolderForThisFile })
      .then(function(report){
        return generateReportOutput(report, { outputFolderForThisFile: outputFolderForThisFile });
      })
      .catch(function(error){
        throw(error);
      })
      .then(function(){
        resolve();
      });
  });
};

var processInputFolder = function(folderPath) {
  inputFolder = folderPath;
  return new Promise(function(resolve, reject){
    console.log('reading folder ' + folderPath + ' recursively');
    var reportsByFile = {};
    getHtmlFilesFromDirectory(folderPath)
      .then(function(htmlFilePaths){
        htmlFilePaths.sort();
        return htmlFilePaths;
      })
      .then(function(htmlFilePaths){
        var sequence = Promise.resolve();
        htmlFilePaths.forEach(function(filePath){
          var outputFolderForThisFile = path.resolve(outputFolder, path.relative(inputFolder, filePath));
          sequence = sequence
            .then(function(){
              return generateReportForFile(filePath, { outputFolderForThisFile: outputFolderForThisFile});
            })
            .then(function(report){
              return generateReportOutput(report, { outputFolderForThisFile: outputFolderForThisFile});
            })
            .catch(function(error) {
              console.log('error');
              console.log(filePath);
              console.log(error);
            });
        });
        return sequence;
      })
      .catch(function(error){
        throw(error);
      })
      .then(function(){
        resolve();
      });
  });
};

var generateReportForFile = function(filePath, options) {
  var report = {
    filePath: filePath,
    validator: false,
    outliner: false
  };
  return validateHtmlReporter.generateReport(filePath, options)
    .then(function(validatorResult){
      report.validator = validatorResult;
    })
    .then(function(){
      return outlineHtmlReporter.generateReport(filePath, options)
    })
    .then(function(outlinerResult){
      report.outliner = outlinerResult
    })
    .then(function(){
      return lintLinkedCssFilesReporter.generateReport(filePath, options)
    })
    .then(function(cssLinterReportsForHtmlFile){
      report.csslinter = cssLinterReportsForHtmlFile
    })
    .then(function(){
      return validateLinkedResourcePathsReporter.generateReport(filePath, options);
    })
    .then(function(loadedResourcesReport){
      report.assets = loadedResourcesReport;
    })
    .then(function(){
      return report;
    });
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
    var output = indent + report.filePath + "\n";

    var sequence = Promise.resolve()
      .then(function(){
        return validateHtmlReporter.convertReportToPlainText(report.validator, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return outlineHtmlReporter.convertReportToPlainText(report.outliner, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return lintLinkedCssFilesReporter.convertReportToPlainText(report.csslinter, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return validateLinkedResourcePathsReporter.convertReportToPlainText(report.assets, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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
    output += '<p>' + report.filePath + '</p>';

    var sequence = Promise.resolve()
      .then(function(){
        return validateHtmlReporter.convertReportToHtml(report.validator, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return outlineHtmlReporter.convertReportToHtml(report.outliner, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return lintLinkedCssFilesReporter.convertReportToHtml(report.csslinter, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return validateLinkedResourcePathsReporter.convertReportToHtml(report.assets, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
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
