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
    //outputs.source = `<textarea style="width: 100%; height: 600px;" data-mode="css" data-file="${resource.url}">${fileContent}</textarea>`;
    outputs.source = `<div style="width: 100%; height: 600px;" data-mode="css" data-file="${resource.url}">${fileContent.toString(`base64`)}</div>`;
  }, () => {
    outputs.source = `<p>css file could not be loaded</p>`;
  })
  .then(() => fsUtils.loadFile(path.resolve(__dirname, `templates`, `stylelint.hbs`), `utf-8`))
  .then(templateContent => {
    const template = handlebars.compile(templateContent);
    try {
      return template(Object.assign({}, resource.styleLint, {
        url: resource.url,
        indentLevel: 1,
        indentLevel2: 2,
        indentLevel3: 3
      }));
    } catch (e) {
      console.error(`css report on ${resource.url} could not be rendered`);
      console.error(e);
      return ``;
    }
  })
  .then(lintOutput => outputs.lint = lintOutput)
  .then(() => {
    output = `${output}
      <div class="source-report-container split-container">
        <div class="source-report-code split split-horizontal" data-split-size="50">
          ${outputs.source}
        </div>
        <div class="source-report-validator-reports split split-horizontal" data-split-size="50">
          ${outputs.lint}
        </div>
      </div>`;
  })
  .then(() => output);
};

module.exports = {
  getHtmlOutputAsString
};
