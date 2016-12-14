var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(imagesReport, jsdomWindow) {
  return new Promise(function(resolve, reject){
    return resolve(imagesReport);
  });
};

var convertReportToHtml = function(report, options) {
  return new Promise(function(resolve, reject){
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

module.exports = {
  generateReport: generateReport,
  convertReportToHtml: convertReportToHtml,
};
