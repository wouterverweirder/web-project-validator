'use strict';

const path = require(`path`),
  styleLinter = require(`../lib/style_linter`),
  fsUtils = require(`../lib/fs_utils`);

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

describe(`style_linter`, () => {
  const styleLinterTestFolder = path.resolve(testsAssetsFolder, `style_linter`);
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  describe(`lintStyleSource`, () => {
    describe(`valid style content`, () => {
      let styleLintReport;
      beforeAll(() => {
        return fsUtils.loadFile(path.resolve(styleLinterTestFolder, `no-errors.css`), `utf-8`)
        .then(fileContent => styleLinter.lintStyleSource(fileContent))
        .then(r => styleLintReport = r);
      });
      it(`valid css file has no errors or warnings`, () => {
        expect(styleLintReport.styleLint.numErrors).toBe(0);
        expect(styleLintReport.styleLint.numWarnings).toBe(0);
        expect(styleLintReport.styleLint.errors).toHaveLength(0);
        expect(styleLintReport.styleLint.warnings).toHaveLength(0);
      });
      it(`backgroundImagePaths is array with relative background image urls`, () => {
        expect(styleLintReport.backgroundImagePaths).toEqual([`../images/pattern.png`]);
      });
    });
    describe(`invalid style content`, () => {
      it(`reports no-box-sizing-border-box as an error`, () => {
        return fsUtils.loadFile(path.resolve(styleLinterTestFolder, `no-box-sizing-border-box.css`), `utf-8`)
        .then(fileContent => styleLinter.lintStyleSource(fileContent))
        .then(styleLintReport => {
          expect(styleLintReport.styleLint.numErrors).toBe(1);
          expect(styleLintReport.styleLint.numWarnings).toBe(0);
          expect(styleLintReport.styleLint.errors).toHaveLength(1);
          expect(styleLintReport.styleLint.warnings).toHaveLength(0);
          expect(styleLintReport.styleLint.errors[0].message).toBe(`devinehowest/box-sizing-border-box`);
          expect(styleLintReport.styleLint.errors[0].evidence).toHaveLength(1);
          expect(styleLintReport.styleLint.errors[0].evidence[0].text).toBe(`set box-sizing to border-box on html selector`);
        });
      });
      it(`reports no-box-sizing-inherit as an error`, () => {
        return fsUtils.loadFile(path.resolve(styleLinterTestFolder, `no-box-sizing-inherit.css`), `utf-8`)
        .then(fileContent => styleLinter.lintStyleSource(fileContent))
        .then(styleLintReport => {
          expect(styleLintReport.styleLint.numErrors).toBe(1);
          expect(styleLintReport.styleLint.numWarnings).toBe(0);
          expect(styleLintReport.styleLint.errors).toHaveLength(1);
          expect(styleLintReport.styleLint.warnings).toHaveLength(0);
          expect(styleLintReport.styleLint.errors[0].message).toBe(`devinehowest/box-sizing-border-box`);
          expect(styleLintReport.styleLint.errors[0].evidence).toHaveLength(3);
          expect(styleLintReport.styleLint.errors[0].evidence[0].text).toBe(`set box-sizing to inherit on * selector`);
        });
      });
      it(`reports no use of flexbox`, () => {
        return fsUtils.loadFile(path.resolve(styleLinterTestFolder, `no-display-flex.css`), `utf-8`)
        .then(fileContent => styleLinter.lintStyleSource(fileContent))
        .then(styleLintReport => {
          expect(styleLintReport.styleLint.numErrors).toBe(1);
          expect(styleLintReport.styleLint.numWarnings).toBe(0);
          expect(styleLintReport.styleLint.errors).toHaveLength(1);
          expect(styleLintReport.styleLint.warnings).toHaveLength(0);
          expect(styleLintReport.styleLint.errors[0].message).toBe(`devinehowest/has-flexbox`);
          expect(styleLintReport.styleLint.errors[0].evidence).toHaveLength(1);
        });
      });
      it(`reports no font-size reset`, () => {
        return fsUtils.loadFile(path.resolve(styleLinterTestFolder, `no-font-size-reset.css`), `utf-8`)
        .then(fileContent => styleLinter.lintStyleSource(fileContent))
        .then(styleLintReport => {
          expect(styleLintReport.styleLint.numErrors).toBe(1);
          expect(styleLintReport.styleLint.numWarnings).toBe(0);
          expect(styleLintReport.styleLint.errors).toHaveLength(1);
          expect(styleLintReport.styleLint.warnings).toHaveLength(0);
          expect(styleLintReport.styleLint.errors[0].message).toBe(`devinehowest/font-size-reset`);
          expect(styleLintReport.styleLint.errors[0].evidence).toHaveLength(1);
        });
      });
    });
  });
});
