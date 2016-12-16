'use strict';

var argv = require('yargs')
  .usage('Usage: $0 <input> [options]')
  .example('$0 http://www.bump-festival.be', 'create a report for the given url')
  .example('$0 ./my-project/index.html', 'create a report for the html file')
  .example('$0 ./project/', 'create a report for each file in the directory')
  .example('$0 urls.txt', 'create a report for each url listed in the file')
  .example('$0 http://www.bump-festival.be --html-validator=online', 'use the w3c online validator')
  .example('$0 http://www.bump-festival.be --screenshots', 'include screenshots in the report')
  .help('h')
  .alias('h', 'help')
  .demand(1)
  .default('output-folder', './output')
  .describe('output-folder', 'Where do you want to save the generated report?')
  .default('html-validator', 'offline')
  .describe('html-validator', 'Which html validator to use (online or offline)')
  .default('screenshots', false)
  .describe('screenshots', 'Create screenshots of the webpage')
  .argv;

const fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  fsUtils = require('./lib/fs_utils');

const WebProjectValidator = require('./lib'),
  getResourceReportForResource = require('./lib/utils.js').getResourceReportForResource,
  getStylelintReportForResource = require('./lib/utils.js').getStylelintReportForResource,
  htmlFileOutputGenerator = require('./lib/output/html-file-output-generator'),
  cssFileOutputGenerator = require('./lib/output/css-file-output-generator'),
  lintLinkedCssFilesReporter = require('./lib/reporter/lint-linked-css-files'),
  outlineHtmlReporter = require('./lib/reporter/outline-html'),
  validateHtmlReporter = require('./lib/reporter/validate-html'),
  validateLinkedResourcePathsReporter = require('./lib/reporter/validate-linked-resource-paths'),
  screenshotsReporter = require('./lib/reporter/screenshots'),
  imagesReporter = require('./lib/reporter/images');

const generateIndent = require('./lib/indent_utils').generateIndent,
  getHtmlFilesFromDirectory = require('./lib/fs_utils').getHtmlFilesFromDirectory;

const init = () => {
  let report, options;
  processInput(argv)
    .then(o => {
      report = o.report;
      options = o.options;
    })
    .then(() => buildReport(report, options))
    .then(report => generateOutput(report, options))
    .then(() => {
      console.log('ALL DONE');
    });
};

const processInput = argv => {
  return Promise.resolve()
  .then(() => {
    return {
      report: {
        context: argv._[0],
        htmlValidator: argv['html-validator']
      },
      options: {
        type: false,
        outputFolder: argv['output-folder'],
        screenshots: argv['screenshots']
      }
    };
  });
};

const buildReport = (report, options) => {
  return new Promise((resolve, reject) => {
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
          require('./lib/resource-processor')
        ];
        if(options.screenshots) {
          reporters.push(require('./lib/firefox-processor'));
        }
        return webProjectValidator.buildReport(report, options, reporters);
      })
      .catch(e => console.error(e))
      .then(() => {
        resolve(report);
      });
  });
};

const generateOutput = (report, options) => {
  return new Promise((resolve, reject) => {
    let seq = Promise.resolve();
    const reportFilePaths = [];
    report.htmlFilePaths.forEach(htmlFilePath => {
      seq = seq.then(() => {
        const fileReport = report.reportsByFile[htmlFilePath];
        return generateReportOutput(fileReport, Object.assign({}, options, { outputFolderForThisFile: fileReport.outputFolder }));
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
      { title: 'Resources', name: 'validate-linked-resource-paths', method: validateLinkedResourcePathsReporter.convertReportToHtml, report: report.resources },
      { title: 'Images', name: 'images', method: imagesReporter.convertReportToHtml, report: report.images }
    ];

    if(options.screenshots) {
      reporters.push({ title: 'Screenshots', name: 'screenshots', method: screenshotsReporter.convertReportToHtml, report: report.screenshots });
    }

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
        //html source tab
        const resourceReport = getResourceReportForResource(report, report.context);
        console.log(resourceReport);
        const name = path.basename(resourceReport.source);
        let badges = '';
        let numErrors = 0;
        let numWarnings = 0;
        //outline
        numErrors += report.outline.numErrors;
        numWarnings += report.outline.numWarnings;
        //validator
        numErrors += report.validator.numErrors;
        numWarnings += report.validator.numWarnings;
        if(numErrors > 0) {
          badges += ' <span class="badge" style="background: red">' + numErrors + '</span>';
        }
        if(numWarnings > 0) {
          badges += ' <span class="badge" style="background: orange">' + numWarnings + '</span>';
        }
        output += `<li>
          <a href="#view-source-${resourceReport.nr}" aria-controls="view-source-${resourceReport.nr}" role="tab">
            ${name}${badges}
          </a>
        </li>`;
      })
      .then(() => {
        //css source tabs
        report.resources.styleSheetPaths.forEach(styleSheetPath => {
          const resourceReport = getResourceReportForResource(report, styleSheetPath);
          const name = path.basename(resourceReport.source);
          let badges = '';
          let numErrors = 0;
          let numWarnings = 0;
          //get the stylelint result
          const styleLintReport = getStylelintReportForResource(report, styleSheetPath);
          numErrors += styleLintReport.numErrors;
          numWarnings += styleLintReport.numWarnings;
          if(numErrors > 0) {
            badges += ' <span class="badge" style="background: red">' + numErrors + '</span>';
          }
          if(numWarnings > 0) {
            badges += ' <span class="badge" style="background: orange">' + numWarnings + '</span>';
          }
          output += `<li>
            <a href="#view-source-${resourceReport.nr}" aria-controls="view-source-${resourceReport.nr}" role="tab">
              ${name}${badges}
            </a>
          </li>`;
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
        //html source tab content
        let resourceTabsSequence = Promise.resolve();
        {
          const resourceReport = getResourceReportForResource(report, report.context);
          const name = path.basename(resourceReport.source);
          resourceTabsSequence = resourceTabsSequence
          .then(() => {
            output += '<div role="tabpanel" class="tab-pane" data-tab-id="view-source-' + resourceReport.nr + '">';
          })
          .then(() => htmlFileOutputGenerator.generateOutput(report, resourceReport.context, options))
          .then(htmlFileOutputGeneratorOutput => {
            output += htmlFileOutputGeneratorOutput;
          })
          .then(() => {
            output += '</div>';
          });
        }
        return resourceTabsSequence;
      })
      .then(() => {
        //css source tabs contents
        let resourceTabsSequence = Promise.resolve();
        report.resources.styleSheetPaths.forEach(styleSheetPath => {
          const resourceReport = getResourceReportForResource(report, styleSheetPath);
          const name = path.basename(resourceReport.source);
          resourceTabsSequence = resourceTabsSequence
          .then(() => {
            output += '<div role="tabpanel" class="tab-pane" data-tab-id="view-source-' + resourceReport.nr + '">';
          })
          .then(() => cssFileOutputGenerator.generateOutput(report, resourceReport.context, options))
          .then(htmlFileOutputGeneratorOutput => {
            output += htmlFileOutputGeneratorOutput;
          })
          .then(() => {
            output += '</div>';
          });
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
