var argv = require('minimist')(process.argv.slice(2));
var lib = require('./lib/index.js');

var generateIndent = lib.generateIndent;

var getHtmlFilesFromDirectory = lib.getHtmlFilesFromDirectory;

var validateHtml = lib.validateHtml;
var generateValidatorReportOutput = lib.generateValidatorReportOutput;

var outlineHtml = lib.outlineHtml;
var generateOutlinerReportOutput = lib.generateOutlinerReportOutput;

var lintCssFilesForHtmlFile = lib.lintCssFilesForHtmlFile;
var generateHtmlCssLintReportsOutput = lib.generateHtmlCssLintReportsOutput;

var validateLoadedResourcesFromHtml = lib.validateLoadedResourcesFromHtml;
var generateHtmlLoadedResourceReportsOutput = lib.generateHtmlLoadedResourceReportsOutput;

var init = function() {
  run()
    .catch(function(error){
      console.log('error');
      console.log(error);
    })
    .then(function(){
      //stop the phantomjs bridge & the vnu bridge
      lib.phantom.stop();
      lib.vnu.close();
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
        console.log(generateReportOutput(report));
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
            .then(console.log)
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
  return validateHtml(filePath)
    .then(function(validatorResult){
      report.validator = validatorResult;
    })
    .then(function(){
      return outlineHtml(filePath)
    })
    .then(function(outlinerResult){
      report.outliner = outlinerResult
    })
    .then(function(){
      return lintCssFilesForHtmlFile(filePath)
    })
    .then(function(cssLinterReportsForHtmlFile){
      report.csslinter = cssLinterReportsForHtmlFile
    })
    .then(function(){
      return validateLoadedResourcesFromHtml(filePath);
    })
    .then(function(loadedResourcesReport){
      report.assets = loadedResourcesReport;
    })
    .then(function(){
      return report;
    });
};

var generateReportOutput = function(report, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = indent + report.filePath + "\n";
  output += generateValidatorReportOutput(report.validator, indentLevel + 1);
  output += generateOutlinerReportOutput(report.outliner, indentLevel + 1);
  output += generateHtmlCssLintReportsOutput(report.csslinter, indentLevel + 1);
  output += generateHtmlLoadedResourceReportsOutput(report.assets, indentLevel + 1);
  return output;
};

init();
