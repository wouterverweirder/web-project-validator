var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  jsdom = require('jsdom'),
  HTML5Outline = require('h5o');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(filePath) {
  return new Promise(function(resolve, reject){
    jsdom.env({
      file: filePath,
      scripts: [],
      done: function (error, window) {
        if(error) {
          return reject(error);
        }
        var outlineResult = HTML5Outline(window.document.body);
        var result = {
          context: filePath,
          outline: _generateOutlinerSectionReport(outlineResult)
        };
        return resolve(result);
      }
    });
  });
};

var convertReportToPlainText = function(outlinerReport, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + "OUTLINER\n";
    output += _generateOutlinerSectionTextOutput(outlinerReport.outline, options.indentLevel);
    resolve(output);
  });
};

var convertReportToHtml = function(report, options) {
  return new Promise(function(resolve, reject){
    fs.readFile(path.resolve(__dirname, 'template.hbs'), 'utf-8', function(error, source){
      if(error) {
        return reject(error);
      }
      var template = handlebars.compile(source);
      //register the list partial
      fs.readFile(path.resolve(__dirname, 'template.list.hbs'), 'utf-8', function(error, source){
        if(error) {
          return reject(error);
        }
        handlebars.registerPartial('list', source);
        var output = template(Object.assign({}, report, {
          indentLevel: options.indentLevel+1,
          indentLevel2: options.indentLevel+2,
          indentLevel3: options.indentLevel+3
        }));
        resolve(output);
      });
    });
  });
};

var _generateOutlinerSectionReport = function(section) {
  var report = {
    section: section
  };
  if(section.heading) {
    report.title = '';
    var nodeIdentification = section.startingNode.localName;
    if(section.startingNode.getAttribute('id')) {
      nodeIdentification += " (" + section.startingNode.getAttribute('id') + ")";
    } else if(section.startingNode.getAttribute('class')) {
      nodeIdentification += " (" + section.startingNode.getAttribute('class') + ")";
    }
    report.title += nodeIdentification + " ";
    if(section.heading.innerHTML) {
      report.title += section.heading.innerHTML.trim();
    } else {
      report.title += section.heading.innerHTML;
    }
  }
  if(section.sections) {
    report.children = [];
    section.sections.forEach(function(subsection){
      report.children.push(_generateOutlinerSectionReport(subsection));
    });
  }
  return report;
};

var _generateOutlinerSectionTextOutput = function(sectionOutline, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = "";
  if(sectionOutline.title) {
    output += indent + sectionOutline.title + "\n";
  }
  if(sectionOutline.children) {
    sectionOutline.children.forEach(function(subsectionOutline){
      output += _generateOutlinerSectionTextOutput(subsectionOutline, indentLevel+1);
    });
  }
  return output;
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
