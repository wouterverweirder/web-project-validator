'use strict';

const path = require(`path`);
const projectRoot = path.resolve(__dirname, `..`, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

const fsUtils = require(`../../lib/fs_utils`);

describe(`render.index`, () => {
  describe(`single url report`, () => {
    let report, childReport;
    beforeAll(() => {
      return fsUtils.loadFile(path.resolve(testsAssetsFolder, `reports`, `bump-festival.json`))
      .then(fileContent => report = JSON.parse(fileContent))
      .then(() => childReport = report.reportsByUrl[report.urls[0]])
      .then(() => require(`../../lib/render`).renderReport(report));
    });
    it(`output folder for the report exists`, () => {
      return fsUtils.statPromised(report.localReportPath.folder);
    });
    it(`sets the localReportPath.report`, () => {
      expect(report.localReportPath.report).toBe(path.resolve(report.localReportPath.folder, `__reports__.html`));
    });
    it(`report index exists exists`, () => {
      return fsUtils.statPromised(report.localReportPath.report);
    });
    it(`output folder for the child report exists`, () => {
      return fsUtils.statPromised(childReport.localReportPath.folder);
    });
    it(`sets the localReportPath.report for the child report`, () => {
      expect(childReport.localReportPath.report).toBe(`${childReport.localReportPath.folder}report.html`);
    });
    it(`created a report.html for the url`, () => {
      return fsUtils.statPromised(childReport.localReportPath.report);
    });
  });
});
