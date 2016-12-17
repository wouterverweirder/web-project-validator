'use strict';

const path = require(`path`),
  handlebars = require(`handlebars`),
  fsUtils = require(`../fs_utils`);

const renderReport = report => {
  return Promise.resolve()
  .then(() => {
    // tmp: dump report as a json file
    // return require(`../fs_utils`).writeFile(`./examples/tests/reports/bump-festival.json`, JSON.stringify(report), `utf-8`);
  })
  .then(() => require(`../fs_utils`).mkdirpPromised(report.localReportPath.folder))
  .then(() => report.localReportPath.report = path.resolve(report.localReportPath.folder, `__reports__.html`))
  .then(() => renderReportsForReportUrls(report))
  .then(() => renderReportIndex(report))
  .then(() => {
    return report;
  });
};

const renderReportsForReportUrls = report => {
  let seq = Promise.resolve();
  report.urls.forEach(reportUrl => {
    seq = seq.then(() => require(`./report_for_url`).renderReportForUrl(report, reportUrl));
  });
  return seq;
};

const renderReportIndex = report => {
  const reports = [];
  report.urls.forEach(reportUrl => {
    const pageReport = report.reportsByUrl[reportUrl];
    reports.push({
      reportUrl: pageReport.localReportPath.report,
      url: pageReport.url
    });
  });
  return Promise.resolve()
  .then(() => fsUtils.loadFile(path.resolve(__dirname, `templates`, `report.index.hbs`), `utf-8`))
  .then(templateContent => {
    const template = handlebars.compile(templateContent);
    try {
      return template({reports});
    } catch (e) {
      console.error(`report index could not be rendered`);
      console.error(e);
      return ``;
    }
  })
  .then(templateOutput => fsUtils.writeFile(report.localReportPath.report, templateOutput));
};

module.exports = {
  renderReport
};
