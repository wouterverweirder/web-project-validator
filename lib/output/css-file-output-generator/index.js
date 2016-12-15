'use strict';

const path = require('path');

const
  fsUtils = require('../../fs_utils'),
  getResourceReportForResource = require('../../utils').getResourceReportForResource,
  getStylelintReportForResource = require('../../utils').getStylelintReportForResource,
  lintCssReporter = require('../../reporter/lint-css')

/**
 * report is the full report, including sub-reports
 */
const generateOutput = (report, cssFilePath, options) => {
  let output = '';
  let seq = Promise.resolve();
  {
    const resourceReport = getResourceReportForResource(report, cssFilePath);
    const stylelintReport = getStylelintReportForResource(report, cssFilePath);
    const name = path.basename(resourceReport.source);
    let outputs = {};
    seq = seq
    .then(() => fsUtils.loadResource(resourceReport.source, 'utf-8'))
    .then(contents => {
      const templateSource = '<textarea style="width: 100%; height: 600px;" data-mode="{{mode}}">{{code}}</textarea>';
      const template = require('handlebars').compile(templateSource);
      return template({code: contents, mode: resourceReport.mode});
    })
    .then(templateOutput => outputs.source = templateOutput)
    .then(() => lintCssReporter.convertReportToHtml(stylelintReport, Object.assign({}, options, { indentLevel: options.indentLevel + 1 })))
    .then(lintCssReporterOutput => outputs.lint = lintCssReporterOutput)
    .then(() => {
      output += `
      <div class="source-report-container split-container">
        <div class="source-report-code split split-horizontal" data-split-size="50">
          ${outputs.source}
        </div>
        <div class="source-report-validator-reports split split-horizontal" data-split-size="50">
          ${outputs.lint}
        </div>
      </div>`;
    })
  }
  return seq.then(() => output);
};

module.exports = {
  generateOutput
};
