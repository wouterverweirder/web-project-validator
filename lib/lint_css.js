var fs = require('fs'),
  path = require('path'),
  jsdom = require('jsdom');

var libFsUtils = require('./fs_utils.js');

var createArrayWithExistingFilePaths = libFsUtils.createArrayWithExistingFilePaths;

var generateIndent = require('./indent_utils.js').generateIndent;

var lintCssFile = function(filePath) {
  var csslint = require('csslint').CSSLint;
  return new Promise(function(resolve, reject){
    // console.log(csslint);
    // resolve(filePath);
    //read the file
    fs.readFile(filePath, 'utf-8', function(err, result){
      if(err) {
        throw err;
        return;
      }
      var csslintResult = csslint.verify(result, {
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
      });
      csslintResult.context = filePath;
      resolve(csslintResult);
    });
  });
};

var getCssFilePathsFromHtmlFile = function(htmlFilePath) {
  return new Promise(function(resolve, reject){
    jsdom.env({
      file: htmlFilePath,
      scripts: [],
      done: function (error, window) {
        if(error) {
          return reject(error);
        }
        //get the linked stylesheets
        var doc = window.document;
        var cssFiles = doc.querySelectorAll('[rel="stylesheet"]');
        var cssFilePaths = [];
        for(var i = 0; i < cssFiles.length; i++) {
          var href = cssFiles[i].getAttribute('href');
          if(!href) {
            continue;
          }
          if(href.indexOf('http://') > -1 || href.indexOf('https://') > -1) {
            continue;
          }
          var cssFilePath = path.resolve(htmlFilePath, '..', href);
          //remove querystring parameters from uri
          cssFilePaths.push(cssFilePath.split("?")[0]);
        }
        resolve(cssFilePaths);
      }
    });
  });
};

var lintCssFilesForHtmlFile = function(htmlFilePath) {
  var report = {
    context: htmlFilePath,
    results: []
  };
  return getCssFilePathsFromHtmlFile(htmlFilePath)
    .then(function(cssFilePaths){
      return createArrayWithExistingFilePaths(cssFilePaths);
    })
    .then(function(cssFilePaths){
      var cssLinters = [];
      cssFilePaths.forEach(function(cssFilePath){
        cssLinters.push(lintCssFile(cssFilePath));
      });
      return Promise.all(cssLinters);
    })
    .then(function(cssLintersResults){
      report.results = cssLintersResults;
    })
    .then(function(){
      return report;
    });
};

var generateHtmlCssLintReportsOutput = function(cssLintReportForHtml, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = indent + "CSS LINT\n";
  cssLintReportForHtml.results.forEach(function(cssLintReport){
    output += generateCssLintReportOutput(cssLintReport, indentLevel + 1);
  });
  return output;
};

var generateCssLintReportOutput = function(cssLintReport, indentLevel) {
  if(!indentLevel) {
    indentLevel = 0;
  }
  var indent = generateIndent(indentLevel);
  var output = indent + "CSS FILE: " + cssLintReport.context + "\n";
  var errors = [];
  var warnings = [];
  cssLintReport.messages.forEach(function(message){
    if(message.type === 'error') {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  });
  output += generateIndent(indentLevel + 1) + "errors: " + errors.length + "\n";
  errors.forEach(function(error){
    output += generateIndent(indentLevel + 2) + error.message + ":\n";
    output += generateIndent(indentLevel + 3) + error.evidence + "\n";
  });
  output += generateIndent(indentLevel + 1) + "warnings: " + warnings.length + "\n";
  warnings.forEach(function(warning){
    output += generateIndent(indentLevel + 2) + warning.message + ":\n";
    output += generateIndent(indentLevel + 3) + warning.evidence + "\n";
  });
  return output;
};

module.exports = {
  getCssFilePathsFromHtmlFile: getCssFilePathsFromHtmlFile,
  lintCssFile: lintCssFile,
  lintCssFilesForHtmlFile: lintCssFilesForHtmlFile,
  generateHtmlCssLintReportsOutput: generateHtmlCssLintReportsOutput,
  generateCssLintReportOutput: generateCssLintReportOutput
};
