var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars');
var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(csslintReport, fileContents) {
  return new Promise(function(resolve, reject){
    var csslint = require('csslint').CSSLint;
    Object.assign(csslintReport, csslint.verify(fileContents, getRules()));
    csslintReport.warningMessages = [];
    csslintReport.dangerMessages = [];
    csslintReport.messages.forEach(function(message){
      if(message.type === 'error') {
        message.outputType = 'danger';
        csslintReport.dangerMessages.push(message);
      } else {
        message.outputType = 'warning';
        csslintReport.warningMessages.push(message);
      }
    });
    resolve(csslintReport);
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
    output += generateIndent(options.indentLevel + 1) + "errors: " + report.dangerMessages.length + "\n";
    report.dangerMessages.forEach(function(error){
      output += generateIndent(options.indentLevel + 2) + error.message + ":\n";
      output += generateIndent(options.indentLevel + 3) + error.evidence + "\n";
    });
    output += generateIndent(options.indentLevel + 1) + "warnings: " + report.warningMessages.length + "\n";
    report.warningMessages.forEach(function(warning){
      output += generateIndent(options.indentLevel + 2) + warning.message + ":\n";
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
      var output = template(Object.assign({}, report, {
        indentLevel: options.indentLevel+1,
        indentLevel2: options.indentLevel+2,
        indentLevel3: options.indentLevel+3
      }));
      resolve(output);
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
