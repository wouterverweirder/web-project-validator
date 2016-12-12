'use strict';

const fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  stylelint = require('stylelint'),
  libPath = path.resolve(__dirname, '..', '..'),
  stylelintErrorsConfigPath = path.resolve(libPath, '..', 'conf', 'stylelint.errors.json'),
  stylelintWarningsConfigPath = path.resolve(libPath, '..', 'conf', 'stylelint.warnings.json'),
  generateIndent = require('../../indent_utils').generateIndent;

//parameters are 1-based!
const selectSourceCode = (source, startLine, startColumn, endLine, endColumn) => {
  let lines = source.split(/\r?\n/);
  let start = Math.max(0, startLine - 1);
  let end   = endLine || startLine;
  return lines.slice(start, end).map((line, index) => {
    let number = start + 1 + index;
    if(number === endLine && endColumn) {
      line = line.substr(0, endColumn);
    }
    if(number === startLine) {
      line = line.substr(startColumn - 1);
    }
    return line;
  }).join("\n");
};

var generateReport = function(stylelintReport, fileContents) {
  //lookup object to keep track of rule, line & column to avoid duplicates between errors & warnings
  const stylelintErrorsMap = {};
  const stylelintErrors = [];
  const stylelintWarnings = [];
  return Promise.resolve()
  .then(() => {
    stylelintReport.numErrors = 0;
    stylelintReport.numWarnings = 0;
    stylelintReport.messages = [];
    stylelintReport.warningMessages = [];
    stylelintReport.dangerMessages = [];
  })
  .then(() => stylelint.lint({
    code: fileContents,
    configFile: stylelintErrorsConfigPath
  }))
  .then(stylelintResult => {
    stylelintResult.results.forEach(stylelintResultObject => {
      stylelintResultObject.warnings.forEach(o => {
        if(!stylelintErrorsMap[o.rule]) {
          stylelintErrorsMap[o.rule] = {};
        }
        if(!stylelintErrorsMap[o.rule][o.line]) {
          stylelintErrorsMap[o.rule][o.line] = {};
        }
        if(!stylelintErrorsMap[o.rule][o.line][o.column]) {
          stylelintErrorsMap[o.rule][o.line][o.column] = true;
        }
        stylelintErrors.push(o);
      });
    });
  })
  .then(() => stylelint.lint({
    code: fileContents,
    configFile: stylelintWarningsConfigPath
  }))
  .then(stylelintResult => {
    stylelintResult.results.forEach(stylelintResultObject => {
      stylelintResultObject.warnings.forEach(o => {
        //check if this object is also an error - avoid duplicates!
        if(stylelintErrorsMap[o.rule] && stylelintErrorsMap[o.rule][o.line] && stylelintErrorsMap[o.rule][o.line][o.column]) {
          //already exists, skip
        } else {
          stylelintWarnings.push(o);
        }
      });
    });
  })
  .then(() => {
    //loop through the errors and create messages
    const brokenRulesMap = {};
    stylelintErrors.forEach(messageObject => {
      if(!brokenRulesMap[messageObject.rule]) {
        brokenRulesMap[messageObject.rule] = {
          message: messageObject.rule,
          outputType: 'danger',
          evidence: '',
          numMessages: 0
        };
      }

      //brokenRulesMap[messageObject.rule].evidence += selectSourceCode(fileContents, messageObject.line) + "\n";
      brokenRulesMap[messageObject.rule].evidence += messageObject.text + ' line ' + messageObject.line + ', column ' + messageObject.column + "\n\n";

      brokenRulesMap[messageObject.rule].numMessages++;
    });
    for(let key in brokenRulesMap) {
      const message = brokenRulesMap[key];
      stylelintReport.messages.push(message);
      stylelintReport.dangerMessages.push(message);
    }
  })
  .then(() => {
    //loop through the warnings and create messages
    const brokenRulesMap = {};
    stylelintWarnings.forEach(messageObject => {
      if(!brokenRulesMap[messageObject.rule]) {
        brokenRulesMap[messageObject.rule] = {
          message: messageObject.rule,
          outputType: 'warning',
          evidence: '',
          numMessages: 0
        };
      }
      //brokenRulesMap[messageObject.rule].evidence += selectSourceCode(fileContents, messageObject.line) + "\n";
      brokenRulesMap[messageObject.rule].evidence += messageObject.text + ' line ' + messageObject.line + ', column ' + messageObject.column + "\n\n";

      brokenRulesMap[messageObject.rule].numMessages++;
    });
    for(let key in brokenRulesMap) {
      const message = brokenRulesMap[key];
      stylelintReport.messages.push(message);
      stylelintReport.warningMessages.push(message);
    }
  })
  .then(() => {
    stylelintReport.numErrors = stylelintReport.dangerMessages.length;
    stylelintReport.numWarnings = stylelintReport.warningMessages.length;
  })
  .then(() => {
    return stylelintReport;
  });
};

var convertReportToPlainText = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + "CSS FILE: " + report.context + "\n";
    output += generateIndent(options.indentLevel + 1) + "errors: " + report.numErrors + "\n";
    report.dangerMessages.forEach(function(error){
      output += generateIndent(options.indentLevel + 2) + error.message + ":\n";
      output += generateIndent(options.indentLevel + 3) + error.numMessages + " occurences:\n";
      output += generateIndent(options.indentLevel + 3) + error.evidence + "\n";
    });
    output += generateIndent(options.indentLevel + 1) + "warnings: " + report.numWarnings + "\n";
    report.warningMessages.forEach(function(warning){
      output += generateIndent(options.indentLevel + 2) + warning.message + ":\n";
      output += generateIndent(options.indentLevel + 3) + warning.numMessages + " occurences:\n";
      output += generateIndent(options.indentLevel + 3) + warning.evidence + "\n";
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
      var output = '';
      try {
        output = template(Object.assign({}, report, {
          indentLevel: options.indentLevel+1,
          indentLevel2: options.indentLevel+2,
          indentLevel3: options.indentLevel+3
        }));
        resolve(output);
      } catch (e) {
        console.error('css report on ' + report.context + ' could not be displayed');
        console.error(e);
      }
    });
  });
};

var getRules = function() {
  return {
    'important' : 1, //Be careful when using !important declaration
    'adjoining-classes' : 1, //Don't use adjoining classes.
    'known-properties' : 1, //Properties should be known (listed in CSS3 specification) or be a vendor-prefixed property.
    'box-sizing' : 0, //The box-sizing properties isn't supported in IE6 and IE7.
    'box-model' : 0, //Don't use width or height when using padding or border.
    'overqualified-elements' : 2, //Don't use classes or IDs with elements (a.foo or a#foo).
    'display-property-grouping' : 0, //Certain properties shouldn't be used with certain display property values.
    'bulletproof-font-face' : 0, //Use the bulletproof @font-face syntax to avoid 404's in old IE (http://www.fontspring.com/blog/the-new-bulletproof-font-face-syntax).
    'compatible-vendor-prefixes' : 0, //Include all compatible vendor prefixes to reach a wider range of users.
    'regex-selectors' : 2, //Selectors that look like regular expressions are slow and should be avoided.
    'errors' : 2, //This rule looks for recoverable syntax errors.
    'duplicate-background-images' : 0, //Every background-image should be unique. Use a common class for e.g. sprites.
    'duplicate-properties' : 1, //Duplicate properties must appear one after the other.
    'empty-rules' : 1, //Rules without any properties specified should be removed.
    'selector-max-approaching' : 0, //Will warn when selector count is >= 3800 selectors.
    'gradients' : 0, //When using a vendor-prefixed gradient, make sure to use them all.
    'fallback-colors' : 0, //For older browsers that don't support RGBA, HSL, or HSLA, provide a fallback color.
    'font-sizes' : 0, //Checks the number of font-size declarations.
    'font-faces' : 1, //Too many different web fonts in the same stylesheet.
    'floats' : 1, //This rule tests if the float property is used too many times
    'star-property-hack' : 0, //Checks for the star property hack (targets IE6/7)
    'outline-none' : 0, //Use of outline: none or outline: 0 should be limited to :focus rules.
    'import' : 0, //Don't use @import, use <link> instead.
    'ids' : 2, //Selectors should not contain IDs.
    'underscore-property-hack' : 0, //Checks for the underscore property hack (targets IE6)
    'rules-count' : 0, //Track how many rules there are.
    'qualified-headings' : 0, //Headings should not be qualified (namespaced).
    'selector-max' : 0, //Will error when selector count is > 4095.
    'shorthand' : 0, //Use shorthand properties where possible.
    'text-indent' : 0, //Checks for text indent less than -99px
    'unique-headings' : 0, //Headings should be defined only once.
    'universal-selector' : 1, //The universal selector (*) is known to be slow.
    'unqualified-attributes' : 0, //Unqualified attribute selectors are known to be slow.
    'vendor-prefix' : 1, //When using a vendor-prefixed property, make sure to include the standard one.
    'zero-units' : 0, //You don't need to specify units when a value is 0.
  };
};

module.exports = {
  generateReport: generateReport,
  convertReportToPlainText: convertReportToPlainText,
  convertReportToHtml: convertReportToHtml,
};
