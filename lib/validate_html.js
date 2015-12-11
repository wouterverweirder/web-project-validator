var w3cjs = require('w3cjs');

var generateIndent = require('./indent_utils.js').generateIndent;

var validateHtml = function(filePath) {
  return new Promise(function(resolve, reject){
    w3cjs.validate({
      file: filePath, // file can either be a local file or a remote file
      output: 'json', // Defaults to 'json', other option includes html
      callback: function (res) {
        resolve(res);
      }
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
  generateValidatorReportOutput: generateValidatorReportOutput
};
