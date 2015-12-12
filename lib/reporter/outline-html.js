var jsdom = require('jsdom'),
  HTML5Outline = require('h5o');

var generateIndent = require('../indent_utils.js').generateIndent;

var generateReport = function(filePath) {
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

var convertReportToPlainText = function(outlinerReport, indentLevel) {
  return new Promise(function(resolve, reject){
    if(!indentLevel) {
      indentLevel = 0;
    }
    var indent = generateIndent(indentLevel);
    var output = indent + "OUTLINER\n";
    output += _generateOutlinerSectionOutput(outlinerReport.outline, indentLevel);
    resolve(output);
  });
};

var _generateOutlinerSectionOutput = function(section, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = "";
  if(section.heading) {
    var nodeIdentification = section.startingNode.localName;
    if(section.startingNode.getAttribute('id')) {
      nodeIdentification += " (" + section.startingNode.getAttribute('id') + ")";
    } else if(section.startingNode.getAttribute('class')) {
      nodeIdentification += " (" + section.startingNode.getAttribute('class') + ")";
    }
    output += indent + nodeIdentification + " ";
    if(section.heading.innerHTML) {
      output += section.heading.innerHTML.trim();
    } else {
      output += section.heading.innerHTML;
    }
    output += "\n";
  }
  if(section.sections) {
    section.sections.forEach(function(subsection){
      output += _generateOutlinerSectionOutput(subsection, indentLevel+1);
    });
  }
  return output;
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText
};
