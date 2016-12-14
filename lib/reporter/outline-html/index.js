var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  HTML5Outline = require('h5o');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(outlineReport, jsdomWindow) {
  return new Promise(function(resolve, reject){
    var outlineResult = HTML5Outline(jsdomWindow.document.body);
    outlineReport.numErrors = 0;
    outlineReport.numWarnings = 0; //we dont set warnings, but need this property for convenience
    Object.assign(outlineReport, _generateOutlinerSectionReport(outlineReport, outlineResult));
    return resolve(outlineReport);
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

var _generateOutlinerSectionReport = function(outlineReport, section) {
  var report = {
  };
  if(section.heading) {
    report.title = false;
    report.tagName = section.startingNode.localName;
    report.identification = false;
    if(section.startingNode.getAttribute('id')) {
      report.identification = '#' + section.startingNode.getAttribute('id');
    } else if(section.startingNode.getAttribute('class')) {
      report.identification = '.' + section.startingNode.getAttribute('class');
    }
    if(section.heading.innerHTML) {
      report.title = section.heading.innerHTML.trim();
    }
    if(!report.title) {
      outlineReport.numErrors++;
    }
  }
  if(section.sections) {
    report.children = [];
    section.sections.forEach(function(subsection){
      report.children.push(_generateOutlinerSectionReport(outlineReport, subsection));
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
  convertReportToHtml: convertReportToHtml,
};
