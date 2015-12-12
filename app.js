var argv = require('minimist')(process.argv.slice(2));

var lintLinkedCssFilesReporter = require('./lib/reporter/lint-linked-css-files.js');
var outlineHtmlReporter = require('./lib/reporter/outline-html.js');
var validateHtmlReporter = require('./lib/reporter/validate-html.js');
var validateLinkedResourcePathsReporter = require('./lib/reporter/validate-linked-resource-paths.js');

var generateIndent = require('./lib/indent_utils.js').generateIndent;
var getHtmlFilesFromDirectory = require('./lib/fs_utils.js').getHtmlFilesFromDirectory;

var phantomBridge = require('./lib/phantom_bridge.js');

var init = function() {
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
  return new Promise(function(resolve, reject){
    generateReportForFile(filePath)
      .then(function(report){
        return generateReportOutput(report);
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
        htmlFilePaths.forEach(function(htmlFilePath){
          sequence = sequence
            .then(function(){
              return generateReportForFile(htmlFilePath);
            })
            .then(function(report){
              return generateReportOutput(report);
            })
            .catch(function(error) {
              console.log('error');
              console.log(htmlFilePath);
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

var generateReportForFile = function(filePath) {
  var report = {
    filePath: filePath,
    validator: false,
    outliner: false
  };
  return validateHtmlReporter.generateReport(filePath)
    .then(function(validatorResult){
      report.validator = validatorResult;
    })
    .then(function(){
      return outlineHtmlReporter.generateReport(filePath)
    })
    .then(function(outlinerResult){
      report.outliner = outlinerResult
    })
    .then(function(){
      return lintLinkedCssFilesReporter.generateReport(filePath)
    })
    .then(function(cssLinterReportsForHtmlFile){
      report.csslinter = cssLinterReportsForHtmlFile
    })
    .then(function(){
      return validateLinkedResourcePathsReporter.generateReport(filePath);
    })
    .then(function(loadedResourcesReport){
      report.assets = loadedResourcesReport;
    })
    .then(function(){
      return report;
    });
};

var generateReportOutput = function(report, indentLevel) {
  return generateTextReport(report, indentLevel).then(console.log);
};

var generateTextReport = function(report, indentLevel) {
  return new Promise(function(resolve, reject){
    if(!indentLevel) {
      indentLevel = 0;
    }
    var indent = generateIndent(indentLevel);
    var output = indent + report.filePath + "\n";

    var sequence = Promise.resolve()
      .then(function(){
        return validateHtmlReporter.convertReportToPlainText(report.validator, indentLevel + 1);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return outlineHtmlReporter.convertReportToPlainText(report.outliner, indentLevel + 1);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return lintLinkedCssFilesReporter.convertReportToPlainText(report.csslinter, indentLevel + 1);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return validateLinkedResourcePathsReporter.convertReportToPlainText(report.assets, indentLevel + 1);
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

init();
