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

var processInputFile = function(filePath) {
  generateReportForFile(filePath)
    .then(function(report){
      console.log(generateReportOutput(report));
    })
    .catch(function(error){
      console.log('error');
      console.log(error);
    })
    .then(function(){
      //stop the phantomjs bridge
      lib.phantom.stop();
    });
};

var processInputFolder = function(folderPath) {
  console.log('reading folder ' + argv['input-folder'] + ' recursively');
  var reportsByFile = {};
  getHtmlFilesFromDirectory(folderPath)
    .then(function(htmlFilePaths){
      var generateReportCalls = [];
      htmlFilePaths.forEach(function(htmlFilePath){
        var seq = generateReportForFile(htmlFilePath);
        seq.then(function(report){
          console.log(generateReportOutput(report));
        });
        generateReportCalls.push(seq);
      });
      var sequence = Promise.all(generateReportCalls);
      return sequence;
    })
    .catch(function(error){
      console.log('error');
      console.log(error);
    })
    .then(function(){
      //stop the phantomjs bridge
      lib.phantom.stop();
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

if(argv['input-file']) {
  processInputFile(argv['input-file']);
} else if(argv['input-folder']) {
  processInputFolder(argv['input-folder']);
}
