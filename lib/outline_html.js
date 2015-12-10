var jsdom = require('jsdom'),
  HTML5Outline = require('h5o');

var generateIndent = require('./indent_utils.js').generateIndent;

var outlineHtml = function(filePath) {
  return new Promise(function(resolve, reject){
    jsdom.env({
      file: filePath,
      scripts: [],
      done: function (error, window) {
        if(error) {
          return reject(error);
        }
        var result = {
          context: filePath,
          outline: HTML5Outline(window.document.body)
        };
        return resolve(result);
      }
    });
  });
};

var generateOutlinerSectionOutput = function(section, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = "";
  if(section.heading) {
    output += indent + section.heading.innerHTML + "\n";
  }
  if(section.sections) {
    section.sections.forEach(function(subsection){
      output += generateOutlinerSectionOutput(subsection, indentLevel+1);
    });
  }
  return output;
};

var generateOutlinerReportOutput = function(outlinerReport, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = indent + "OUTLINER\n";
  output += generateOutlinerSectionOutput(outlinerReport.outline, indentLevel);
  return output;
};

module.exports = {
  outlineHtml: outlineHtml,
  generateOutlinerReportOutput: generateOutlinerReportOutput
};
