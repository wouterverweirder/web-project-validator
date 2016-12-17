'use strict';

const
  path = require(`path`),
  handlebars = require(`handlebars`),
  fsUtils = require(`../fs_utils`);

const getHtmlOutputAsString = resource => {
  let output = ``;
  const outputs = {
    source: ``,
    outline: ``,
    validator: ``
  };
  return Promise.resolve()
  .then(() => fsUtils.loadFile(resource.localReportPath.file))
  .then(fileContent => {
    outputs.source = `<div style="width: 100%; height: 600px;" data-mode="htmlmixed" data-file="${resource.url}">${fileContent.toString(`base64`)}</div>`;
  }, () => {
    outputs.source = `<p>html file could not be loaded</p>`;
  })
  .then(() => fsUtils.loadFile(path.resolve(__dirname, `templates`, `validate_html.hbs`), `utf-8`))
  .then(templateContent => {
    const template = handlebars.compile(templateContent);
    try {
      return template(Object.assign({}, resource.validator, {
        url: resource.url,
        indentLevel: 1,
        indentLevel2: 2,
        indentLevel3: 3
      }));
    } catch (e) {
      console.error(`validation report on ${resource.url} could not be rendered`);
      console.error(e);
      return ``;
    }
  })
  .then(validatorOutput => outputs.validator = validatorOutput)
  .then(() => fsUtils.loadFile(path.resolve(__dirname, `templates`, `outline.hbs`), `utf-8`))
  .then(templateContent => {
    const template = handlebars.compile(templateContent);
    return fsUtils.loadFile(path.resolve(__dirname, `templates`, `outline.list.hbs`), `utf-8`)
    .then(templatePartialContent => {
      handlebars.registerPartial(`list`, templatePartialContent);
      try {
        return template(Object.assign({}, resource.outline, {
          url: resource.url,
          indentLevel: 1,
          indentLevel2: 2,
          indentLevel3: 3
        }));
      } catch (e) {
        console.error(`outline report on ${resource.url} could not be rendered`);
        console.error(e);
        return ``;
      }
    });
  })
  .then(outlineOutput => outputs.outline = outlineOutput)
  .then(() => {
    output = `${output}
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
  .then(() => output);
};

module.exports = {
  getHtmlOutputAsString
};
