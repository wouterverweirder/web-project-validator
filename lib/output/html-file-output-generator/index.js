'use strict';

const path = require('path');

const
  fsUtils = require('../../fs_utils'),
  getResourceReportForResource = require('../../utils').getResourceReportForResource,
  validateHtmlReporter = require('../../reporter/validate-html'),
  outlineHtmlReporter = require('../../reporter/outline-html')

/**
 * report is the full report, including sub-reports
 */
const generateOutput = (report, htmlFilePath, options) => {
  let output = '';
  let seq = Promise.resolve();
  {
    const resourceReport = getResourceReportForResource(report, htmlFilePath);
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
    .then(() => validateHtmlReporter.convertReportToHtml(report.validator, Object.assign({}, options, { indentLevel: options.indentLevel + 1 })))
    .then(validateHtmlReporterOutput => outputs.validator = validateHtmlReporterOutput)
    .then(() => outlineHtmlReporter.convertReportToHtml(report.outline, Object.assign({}, options, { indentLevel: options.indentLevel + 1 })))
    .then(outlineHtmlReporterOutput => outputs.outline = outlineHtmlReporterOutput)
    .then(() => {
      output += `
      <div class="source-report-container split-container">
        <div class="source-report-code split split-horizontal" data-split-size="50">
          ${outputs.source}
        </div>
        <div class="source-report-validator-reports split split-horizontal" data-split-size="50">
          ${outputs.outline}
          ${outputs.validator}
        </div>
      </div>`;
    })
  }
  return seq.then(() => output);
};

module.exports = {
  generateOutput
};
