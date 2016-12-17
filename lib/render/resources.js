'use strict';

const
  path = require(`path`),
  handlebars = require(`handlebars`),
  fsUtils = require(`../fs_utils`);

const getHtmlOutputAsString = pageReport => {
  let output = ``;
  return Promise.resolve()
  .then(() => fsUtils.loadFile(path.resolve(__dirname, `templates`, `resources.hbs`), `utf-8`))
  .then(templateContent => {
    const template = handlebars.compile(templateContent);
    try {
      return template(Object.assign({}, {
        indentLevel: 1,
        indentLevel2: 2,
        indentLevel3: 3
      }, pageReport.resourcesReport));
    } catch (e) {
      console.error(`image report on ${pageReport.url} could not be rendered`);
      console.error(e);
      return ``;
    }
  })
  .then(templateOutput => output = `${output}${templateOutput}`)
  .then(() => output);
};

module.exports = {
  getHtmlOutputAsString
};
