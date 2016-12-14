'use strict';

var argv = require('yargs')
  .usage('Usage: $0 <input> [options]')
  .example('$0 http://www.bump-festival.be', 'create a report for the given url')
  .example('$0 ./my-project/index.html', 'create a report for the html file')
  .example('$0 ./project/', 'create a report for each file in the directory')
  .example('$0 urls.txt', 'create a report for each url listed in the file')
  .example('$0 http://www.bump-festival.be --html-validator=online', 'use the w3c online validator')
  .help('h')
  .alias('h', 'help')
  .demand(1)
  .default('output-folder', './output')
  .describe('output-folder', 'Where do you want to save the generated report?')
  .default('output-style', 'html')
  .describe('output-style', 'The style of the output report (html or text)')
  .default('html-validator', 'offline')
  .describe('html-validator', 'Which html validator to use (online or offline)')
  .argv;

const fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  fsUtils = require('./lib/fs_utils');

const WebProjectValidator = require('./lib'),
  lintLinkedCssFilesReporter = require('./lib/reporter/lint-linked-css-files'),
  outlineHtmlReporter = require('./lib/reporter/outline-html'),
  validateHtmlReporter = require('./lib/reporter/validate-html'),
  validateLinkedResourcePathsReporter = require('./lib/reporter/validate-linked-resource-paths'),
  screenshotsReporter = require('./lib/reporter/screenshots'),
  imagesReporter = require('./lib/reporter/images');

const generateIndent = require('./lib/indent_utils').generateIndent,
  getHtmlFilesFromDirectory = require('./lib/fs_utils').getHtmlFilesFromDirectory;

const init = () => {
  processInput(argv)
    .then(report => generateOutput(report))
    .then(() => {
      console.log('ALL DONE');
    });
};

const processInput = argv => {
  return new Promise((resolve, reject) => {
    const report = {
      context: argv._[0],
      htmlValidator: argv['html-validator']
    };
    const options = {
      type: false,
      outputFolder: argv['output-folder']
    };
    const webProjectValidator = new WebProjectValidator();
    Promise.resolve()
      .then(() => fsUtils.getInputTypeFromArgument(argv._[0]))
      .then(inputType => options.type = inputType)
      .then(() => webProjectValidator.initReport(report, options))
      .then(() => webProjectValidator.createOutputFoldersForReport(report))
      .then(() => {
        const reporters = [
          require('./lib/phantom-processor'),
          require('./lib/jsdom-processor'),
          (report.htmlValidator === 'offline') ? require('./lib/vnu-processor') : require('./lib/w3cjs-processor'),
          require('./lib/resource-processor'),
          require('./lib/firefox-processor')
        ];
        return webProjectValidator.buildReport(report, options, reporters);
      })
      .then(() => {
        resolve(report);
      });
  });
};

const generateOutput = report => {
  return new Promise((resolve, reject) => {
    let seq = Promise.resolve();
    const reportFilePaths = [];
    report.htmlFilePaths.forEach(htmlFilePath => {
      seq = seq.then(() => {
        const fileReport = report.reportsByFile[htmlFilePath];
        return generateReportOutput(fileReport, { outputFolderForThisFile: fileReport.outputFolder });
      })
      .then(reportFilePath => {
        console.log('wrote report: ' + reportFilePath);
        reportFilePaths.push(reportFilePath);
      })
      .catch(error => {
        console.log(error);
      });
    });
    seq = seq.then(() => generateReportIndex(report, reportFilePaths))
    .then(() => resolve());
  });
};

const generateReportOutput = (report, options) => {
  let seq = Promise.resolve();
  const reportFileName = 'report.html';
  seq = seq.then(() => generateHtmlReport(report, options));
  seq = seq.then(output => {
    if(options.outputFolderForThisFile) {
      return new Promise((resolve, reject) => {
        mkdirp(options.outputFolderForThisFile, error => {
          if(error) {
            return reject(error);
          }
          const reportFilePath = path.resolve(options.outputFolderForThisFile, reportFileName);
          fs.writeFile(reportFilePath, output, error => {
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

const generateReportIndex = (report, reportFilePaths) => {
  return new Promise((resolve, reject) => {
    let output = '';
    Promise.resolve()
      .then(() => {
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
      .then(() => {
        reportFilePaths.forEach(function(reportFilePath){
          output += '<li><a href="' + reportFilePath + '">' + reportFilePath + '</a></li>';
        });
      })
      .then(() => {
        output += '</ol>';
        output += '</main></body></html>';
      })
      .then(() => fsUtils.writeFile(path.resolve(report.outputFolder, 'reports.html'), output))
      .then(() => {
        resolve();
      });
  });
};

const generateHtmlReport = (report, options) => {
  return new Promise((resolve, reject) => {
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    const indent = generateIndent(options.indentLevel);

    const reporters = [
      { title: 'Screenshots', name: 'screenshots', method: screenshotsReporter.convertReportToHtml, report: report.screenshots },
      { title: 'HTML Validation', name: 'validate-html', method: validateHtmlReporter.convertReportToHtml, report: report.validator },
      { title: 'Outline', name: 'outline-html', method: outlineHtmlReporter.convertReportToHtml, report: report.outline },
      { title: 'CSS Lint', name: 'lint-css', method: lintLinkedCssFilesReporter.convertReportToHtml, report: report.stylelint },
      { title: 'Resources', name: 'validate-linked-resource-paths', method: validateLinkedResourcePathsReporter.convertReportToHtml, report: report.resources },
      { title: 'Images', name: 'images', method: imagesReporter.convertReportToHtml, report: report.images }
    ];

    let output = '';

    let sequence = Promise.resolve();
    sequence = sequence
      .then(() => output += '<html>')
      .then(() => fsUtils.loadResource(path.resolve(__dirname, 'lib/reporter/html.head.hbs'), 'utf-8'))
      .then(headTagContent => output += headTagContent)
      .then(() => {
        output += '<body>';
        output += '<main class="container-fluid">';
        output += '<header><h1>Webpage Report</h1></header>';
        output += '<p>' + report.context + '</p>';
      })
      .then(() => {
        //create tabs
        output += '<ul class="nav nav-tabs" role="tablist">';
      })
      .then(() => {
        //tab with live view of website
        output += '<li role="presentation" class="active"><a href="#" aria-controls="live-view" role="tab">Live View</a></li>';
      })
      .then(() => {
        //tabs for the source files
        report.resources.results.forEach(resourceReport => {
          if(resourceReport.source) {
            const name = path.basename(resourceReport.source);
            output += '<li><a href="#view-source-' + resourceReport.nr + '" aria-controls="view-source-' + resourceReport.nr + '" role="tab">' + name + '</a></li>';
          }
        });
      })
      .then(() => {
        //tabs for the reporters
        reporters.forEach(reporterConfig => {
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
      .then(() => {
        output += '</ul>';
      })
      .then(() => {
        output += '<div class="tab-content">';
      })
      .then(() => {
        //tab for live view
        output += '<div role="tabpanel" class="tab-pane active" data-tab-id="live-view">';
        output += '<iframe id="live-view" width="100%" height="600" src="' + report.context + '"></iframe>';
        output += '</div>';
      })
      .then(() => {
        //tabs for the source files
        let resourceTabsSequence = Promise.resolve();
        report.resources.results.forEach(resourceReport => {
          if(resourceReport.source) {
            resourceTabsSequence = resourceTabsSequence.then(() => {
              const name = path.basename(resourceReport.source);
              output += '<div role="tabpanel" class="tab-pane" data-tab-id="view-source-' + resourceReport.nr + '">';
            })
            .then(() => fsUtils.loadResource(resourceReport.source, 'utf-8'))
            .then(contents => {
              //check mode
              const src = '<textarea style="width: 100%; height: 600px;" data-mode="{{mode}}">{{code}}</textarea>';
              const template = require('handlebars').compile(src);
              output += template({code: contents, mode: resourceReport.mode});
            })
            .then(() => {
              output += '</div>';
            });
          }
        });
        return resourceTabsSequence;
      })
      .then(() => {
        let reportersSequence = Promise.resolve();
        reporters.forEach(reporterConfig => {
          reportersSequence = reportersSequence.then(() => {
            return reporterConfig.method(reporterConfig.report, Object.assign({}, options, { indentLevel: options.indentLevel + 1 }));
          }).then(reportOutput => {
            output += '<div role="tabpanel" class="tab-pane" data-tab-id="' + reporterConfig.name + '">';
            output += reportOutput;
            output += '</div>';
          });
        });
        return reportersSequence;
      })
      .then(() => {
        output += '</div>';
      })
      .then(() => fsUtils.loadResource(path.resolve(__dirname, 'lib/reporter/script.bottom.hbs'), 'utf-8'))
      .then(bottomScript => {
        output += bottomScript;
      })
      .then(() => {
        output += '</main></body></html>';
        resolve(output);
      })
      .catch(error => {
        reject(error);
      });
  });
};

init();
