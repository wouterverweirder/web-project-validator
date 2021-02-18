'use strict';

const
  path = require(`path`),
  handlebars = require(`handlebars`),
  fsUtils = require(`../fs_utils`);

const getHtmlOutputAsString = resource => {
  let output = ``;
  const outputs = {
    source: ``,
    lint: ``
  };
  return Promise.resolve()
  .then(() => fsUtils.loadFile(resource.localReportPath.file))
  .then(fileContent => {
    outputs.source = `<div style="width: 100%; height: 600px;" data-mode="javascript" data-file="${resource.url}">${fileContent.toString(`base64`)}</div>`;
  }, () => {
    outputs.source = `<p>javascript file could not be loaded</p>`;
  })
  .then(() => {
    output = `${output}
      <div class="source-report-container split-container">
        <div class="source-report-code split split-horizontal" data-split-size="50">
          ${outputs.source}
        </div>
        <div class="source-report-validator-reports split split-horizontal" data-split-size="50">
        </div>
      </div>`;
  })
  .then(() => output);
};

module.exports = {
  getHtmlOutputAsString
};
