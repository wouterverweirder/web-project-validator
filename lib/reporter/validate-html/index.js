var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(validatorReport, htmlValidator, fileContents) {
  return new Promise(function(resolve, reject){
    htmlValidator.validate(fileContents)
      .then(function(messages){
        var dangerMessages = [];
        var warningMessages = [];
        var infoMessages = [];
        messages.forEach(function(message){
          if(message.type === 'error') {
            message.outputType = 'danger';
            dangerMessages.push(message);
          } else {
            if(message.subType && message.subType === 'warning') {
              message.outputType = 'warning';
              warningMessages.push(message);
            } else {
              message.outputType = 'info';
              infoMessages.push(message);
            }
          }
        });
        Object.assign(validatorReport, {
          messages: messages,
          dangerMessages: dangerMessages,
          warningMessages: warningMessages,
          infoMessages: infoMessages
        });
        resolve(validatorReport);
      });
  });
};

var convertReportToPlainText = function(validatorReport, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + "VALIDATOR\n";
    if(!validatorReport.messages) {
      output += generateIndent(options.indentLevel + 1) + "validator did not return :-(";
      return output;
    }
    output += generateIndent(options.indentLevel + 1) + "errors: " + validatorReport.dangerMessages.length + "\n";
    validatorReport.dangerMessages.forEach(function(error){
      output += generateIndent(options.indentLevel + 2) + error.message + "\n";
    });
    output += generateIndent(options.indentLevel + 1) + "warnings: " + validatorReport.warningMessages.length + "\n";
    validatorReport.warningMessages.forEach(function(warning){
      output += generateIndent(options.indentLevel + 2) + warning.message + "\n";
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
  htmlValidator.close();
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
  exit: exit
};
