var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(screenshotsReport) {
  //is done inside the browser-processors
  return screenshotsReport;
};

var convertReportToPlainText = function(screenshotsReport, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + "SCREENSHOTS\n";
    screenshotsReport.screenshots.forEach(function(screenshot){
      output += generateIndent(options.indentLevel+1) + screenshot.browserName + ': ' + screenshot.url;
    });
    resolve(output);
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

var exit = function() {
  vnu.close();
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
  exit: exit
};
