'use strict';

const
  path = require(`path`),
  handlebars = require(`handlebars`),
  fsUtils = require(`../fs_utils`);

const getHtmlOutputAsString = pageReport => {
  let output = ``;
  return Promise.resolve()
  .then(() => fsUtils.loadFile(path.resolve(__dirname, `templates`, `images.hbs`), `utf-8`))
  .then(templateContent => {
    const template = handlebars.compile(templateContent);
    const htmlImageResources = require(`../index`).getResourcesByTypeIncludedByType(pageReport, `image`, `html`);
    const styleImageResources = require(`../index`).getResourcesByTypeIncludedByType(pageReport, `image`, `style`);
    try {
      return template(Object.assign({}, {
        htmlImageResources,
        styleImageResources,
        indentLevel: 1,
        indentLevel2: 2,
        indentLevel3: 3
      }));
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
