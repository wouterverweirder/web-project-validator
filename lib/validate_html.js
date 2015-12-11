var fs = require('fs'),
  path = require('path');

var VnuClass = require("validator-nu").Vnu;
var vnu = new VnuClass();
var vnuPromise = vnu.open();

var generateIndent = require('./indent_utils.js').generateIndent;

var validateHtml = function(filePath) {
  return new Promise(function(resolve, reject){
    fs.readFile(filePath, 'utf-8', function(err, fileContents){
      if(err) {
        return reject(err);
      }
      vnuPromise = vnuPromise.then(function(){
        return vnu.validate(fileContents);
      }).then(function(messages){
        resolve({
          context: filePath,
          messages: messages
        });
      }).catch(function(err){
        reject(err);
      });
    });
  });
};

var generateValidatorReportOutput = function(validatorReport, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = indent + "VALIDATOR\n";
  var errors = [];
  var warnings = [];
  if(!validatorReport.messages) {
    output += generateIndent(indentLevel + 1) + "validator did not return :-(";
    return output;
  }
  validatorReport.messages.forEach(function(message){
    if(message.type === 'error') {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  });
  output += generateIndent(indentLevel + 1) + "errors: " + errors.length + "\n";
  errors.forEach(function(error){
    output += generateIndent(indentLevel + 2) + error.message + "\n";
  });
  output += generateIndent(indentLevel + 1) + "warnings: " + warnings.length + "\n";
  warnings.forEach(function(warning){
    output += generateIndent(indentLevel + 2) + warning.message + "\n";
  });
  return output;
};

module.exports = {
  validateHtml: validateHtml,
  generateValidatorReportOutput: generateValidatorReportOutput,
  vnu: vnu
};
