var argv = require('yargs')
  .usage('Usage: $0 <input> [options]')
  .example('$0 http://www.bump-festival.be', 'create a report for the given url')
  .help('h')
  .alias('h', 'help')
  .demand(1)
  .default('input-type', 'url')
  .describe('input-type', 'What type is the input (url, file, folder or list)')
  .default('output-folder', './output')
  .describe('output-folder', 'Where do you want to save the generated report?')
  .default('output-style', 'html')
  .describe('output-style', 'The style of the output report (html or text)')
  .default('html-validator', 'online')
  .describe('html-validator', 'Which html validator to use (online or offline)')
  .argv;

var fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  fsUtils = require('./lib/fs_utils');

var lintLinkedCssFilesReporter = require('./lib/reporter/lint-linked-css-files');
var outlineHtmlReporter = require('./lib/reporter/outline-html');
var validateHtmlReporter = require('./lib/reporter/validate-html');
var validateLinkedResourcePathsReporter = require('./lib/reporter/validate-linked-resource-paths');
var screenshotsReporter = require('./lib/reporter/screenshots');

var generateIndent = require('./lib/indent_utils').generateIndent;
var getHtmlFilesFromDirectory = require('./lib/fs_utils').getHtmlFilesFromDirectory;

var outputStyle = argv['output-style'];

var init = function() {
  processInput(argv)
    .then(function(report){
      return generateOutput(report);
    })
    .then(function(){
      console.log('ALL DONE');
    });
};

var processInput = function(argv) {
  return new Promise(function(resolve, reject){
    var report = {
      outputStyle: outputStyle,
      context: argv._[0],
      htmlValidator: argv['html-validator']
    };
    var options = {
      type: argv['input-type'],
      outputFolder: argv['output-folder']
    };
    var WebProjectValidator = require('./lib');
    webProjectValidator = new WebProjectValidator();
    Promise.resolve()
      .then(function(){
        return webProjectValidator.initReport(report, options);
      })
      .then(function(){
        return webProjectValidator.createOutputFoldersForReport(report);
      })
      .then(function(){
        return buildReport(report);
      })
      .then(function(){
        resolve(report);
      });
  });
};

var generateOutput = function(report) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    var reportFilePaths = [];
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        var fileReport = report.reportsByFile[htmlFilePath];
        return generateReportOutput(fileReport, { outputFolderForThisFile: fileReport.outputFolder });
      })
      .then(function(reportFilePath){
        console.log('wrote report: ' + reportFilePath);
        reportFilePaths.push(reportFilePath);
      })
      .catch(function(error){
        console.log(error);
      });
    });
    seq.then(function(){
      return generateReportIndex(report, reportFilePaths);
    })
    seq.then(function(){
      resolve();
    });
  });
};

var buildReport = function(report) {
  return new Promise(function(resolve, reject){
    return Promise.resolve()
      .then(function(){
        return require('./lib/phantom-processor').buildReport(report);
      })
      .then(function(){
        return require('./lib/jsdom-processor').buildReport(report);
      })
      .then(function(){
        if(report.htmlValidator === 'offline') {
          return require('./lib/vnu-processor').buildReport(report);
        } else {
          return require('./lib/w3cjs-processor').buildReport(report);
        }
      })
      .then(function(){
        return require('./lib/resource-processor').buildReport(report);
      })
      .then(function(){
        return require('./lib/firefox-processor').buildReport(report);
      })
      .catch(function(error){
        console.log(error);
      })
      .then(function(report){
        resolve(report);
      });
  });
};

var generateReportOutput = function(report, options) {
  var seq = Promise.resolve();
  var reportFileName;
  if(outputStyle === 'text') {
    reportFileName = 'report.txt';
    seq = seq.then(function() { return generateTextReport(report, options); });
  } else {
    reportFileName = 'report.html';
    seq = seq.then(function() { return generateHtmlReport(report, options); });
  }
  seq = seq.then(function(output){
    if(options.outputFolderForThisFile) {
      return new Promise(function(resolve, reject){
        mkdirp(options.outputFolderForThisFile, function(error){
          if(error) {
            return reject(error);
          }
          var reportFilePath = path.resolve(options.outputFolderForThisFile, reportFileName);
          fs.writeFile(reportFilePath, output, function(error){
            if(error) {
              return reject(error);
            }
            resolve(reportFilePath);
          });
        });
      });
    }
  });
  return seq;
};

var generateReportIndex = function(report, reportFilePaths) {
  return new Promise(function(resolve, reject){
    var output = '';
    Promise.resolve()
      .then(function(){
        output += '<html>';
        output += '<head>';
        output += '<meta charset="UTF-8" />';
        output += '<meta name="viewport" content="width=device-width, initial-scale=1">';
        output += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">';
        output += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">';
        output += '<script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>';
        output += '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>';
        output += '</head>';
        output += '<body>';
        output += '<main class="container-fluid">';
        output += '<header><h1>Reports</h1></header>';
        output += '<ol>';
      })
      .then(function(){
        reportFilePaths.forEach(function(reportFilePath){
          output += '<li><a href="' + reportFilePath + '">' + reportFilePath + '</a></li>';
        });
      })
      .then(function(){
        output += '</ol>';
        output += '</main></body></html>';
      })
      .then(function(){
        return fsUtils.writeFile(path.resolve(report.outputFolder, 'reports.html'), output);
      })
      .then(function(){
        resolve();
      });
  });
};

var generateTextReport = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);
    var output = indent + report.context + "\n";

    var sequence = Promise.resolve()
      .then(function(){
        return validateHtmlReporter.convertReportToPlainText(report.validator, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('validateHtmlReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return outlineHtmlReporter.convertReportToPlainText(report.outline, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('outlineHtmlReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return lintLinkedCssFilesReporter.convertReportToPlainText(report.stylelint, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('lintLinkedCssFilesReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return validateLinkedResourcePathsReporter.convertReportToPlainText(report.resources, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('validateLinkedResourcePathsReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        return screenshotsReporter.convertReportToPlainText(report.screenshots, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
      })
      .catch(function(error){
        console.log('screenshotsReporter error: ' + error);
      })
      .then(function(reportOutput) {
        output += reportOutput;
      })
      .then(function(){
        resolve(output);
      })
      .catch(function(error){
        reject(error);
      });
  });
};

var generateHtmlReport = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    var indent = generateIndent(options.indentLevel);

    var reporters = [
      { title: 'Screenshots', name: 'screenshots', method: screenshotsReporter.convertReportToHtml, report: report.screenshots },
      { title: 'HTML Validation', name: 'validate-html', method: validateHtmlReporter.convertReportToHtml, report: report.validator },
      { title: 'Outline', name: 'outline-html', method: outlineHtmlReporter.convertReportToHtml, report: report.outline },
      { title: 'CSS Lint', name: 'lint-css', method: lintLinkedCssFilesReporter.convertReportToHtml, report: report.stylelint },
      { title: 'Resources', name: 'validate-linked-resource-paths', method: validateLinkedResourcePathsReporter.convertReportToHtml, report: report.resources }
    ];

    var output = '';

    var sequence = Promise.resolve();
    sequence = sequence
      .then(function(){
        output += '<html>';
        output += '<head>';
        output += '<meta charset="UTF-8" />';
        output += '<meta name="viewport" content="width=device-width, initial-scale=1">';
        output += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">';
        output += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">';
        output += '<script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>';
        output += '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>';
        output += '<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.22/require.min.js"></script>';
        output += '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.9.0/codemirror.min.css" />';
        output += '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.9.0/addon/dialog/dialog.css" />';
        output += "<style>\n";
        output += "   .CodeMirror {\n";
        output += "        height: 600px;\n";
        output += "        background: white;\n";
        output += "    }\n";
        output += "</style>\n";
        output += '</head>';
        output += '<body>';
        output += '<main class="container-fluid">';
        output += '<header><h1>Webpage Report</h1></header>';
        output += '<p>' + report.context + '</p>';
      })
      .then(function(){
        //create tabs
        output += '<ul class="nav nav-tabs" role="tablist">';
      })
      .then(function(){
        //tab with live view of website
        output += '<li role="presentation" class="active"><a href="#" aria-controls="live-view" role="tab">Live View</a></li>';
      })
      .then(function(){
        //tabs for the source files
        report.resources.results.forEach(function(resourceReport){
          if(resourceReport.source) {
            var name = path.basename(resourceReport.source);
            output += '<li><a href="#view-source-' + resourceReport.nr + '" aria-controls="view-source-' + resourceReport.nr + '" role="tab">' + name + '</a></li>';
          }
        });
      })
      .then(function(){
        //tabs for the reporters
        reporters.forEach(function(reporterConfig){
          output += '<li><a href="#' + reporterConfig.name + '" aria-controls="' + reporterConfig.name + '" role="tab">';
          output += reporterConfig.title;
          if(reporterConfig.report.numErrors) {
            output += ' <span class="badge" style="background: red">' + reporterConfig.report.numErrors + '</span>';
          }
          if(reporterConfig.report.numWarnings) {
            output += ' <span class="badge" style="background: orange">' + reporterConfig.report.numWarnings + '</span>';
          }
          output += '</a></li>';
        });
      })
      .then(function(){
        output += '</ul>';
      })
      .then(function(){
        output += '<div class="tab-content">';
      })
      .then(function(){
        //tab for live view
        output += '<div role="tabpanel" class="tab-pane active" data-tab-id="live-view">';
        output += '<iframe width="100%" height="600" src="' + report.context + '"></iframe>';
        output += '</div>';
      })
      .then(function(){
        //tabs for the source files
        var resourceTabsSequence = Promise.resolve();
        report.resources.results.forEach(function(resourceReport){
          if(resourceReport.source) {
            resourceTabsSequence = resourceTabsSequence.then(function(){
              var name = path.basename(resourceReport.source);
              output += '<div role="tabpanel" class="tab-pane" data-tab-id="view-source-' + resourceReport.nr + '">';
            })
            .then(function(){
              //read the file contents and echo it here
              return fsUtils.loadResource(resourceReport.source, 'utf-8');
            })
            .then(function(contents){
              //check mode
              var src = '<textarea style="width: 100%; height: 600px;" data-mode="{{mode}}">{{code}}</textarea>';
              var template = require('handlebars').compile(src);
              output += template({code: contents, mode: resourceReport.mode});
            })
            .then(function(){
              output += '</div>';
            });
          }
        });
        return resourceTabsSequence;
      })
      .then(function(){
        var reportersSequence = Promise.resolve();
        reporters.forEach(function(reporterConfig) {
          reportersSequence = reportersSequence.then(function(){
            return reporterConfig.method(reporterConfig.report, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
          }).then(function(reportOutput){
            output += '<div role="tabpanel" class="tab-pane" data-tab-id="' + reporterConfig.name + '">';
            output += reportOutput;
            output += '</div>';
          });
        });
        return reportersSequence;
      })
      .then(function(){
        output += '</div>';
      })
      .then(function(){
        return fsUtils.loadResource(path.resolve(__dirname, 'lib/reporter/script.bottom.hbs'), 'utf-8');
      })
      .then(function(bottomScript){
        output += bottomScript;
      })
      .then(function(){
        output += '</main></body></html>';
        resolve(output);
      })
      .catch(function(error){
        reject(error);
      });
  });
};

init();
