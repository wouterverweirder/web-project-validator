'use strict';

const path = require(`path`),
  htmlValidator = require(`../lib/html_validator`),
  fsUtils = require(`../lib/fs_utils`);

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

describe(`html_validator`, () => {
  const htmlValidatorTestFolder = path.resolve(testsAssetsFolder, `html_validator`);
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  beforeAll(() => {
    it(`start / stop validator`, () => {
      return require(`../lib/html_validator`).start()
      .then(() => {
        expect(require(`../lib/html_validator`).isRunning()).toBe(true);
      })
      .then(() => {
        return require(`../lib/html_validator`).stop();
      })
      .then(() => {
        expect(require(`../lib/html_validator`).isRunning()).toBe(false);
      });
    });
  });
  afterAll(() => {
    return require(`../lib/html_validator`).stop();
  });
  describe(`validateHtmlSource`, () => {
    describe(`valid html content`, () => {
      let fileContent = false;
      beforeAll(() => {
        return fsUtils.loadFile(path.resolve(htmlValidatorTestFolder, `valid-html.html`), `utf-8`)
        .then(result => fileContent = result);
      });
      it(`validates a valid html file`, () => {
        return htmlValidator.validateHtmlSource(fileContent)
        .then(validatorReport => {
          expect(validatorReport.numErrors).toBe(0);
          expect(validatorReport.numWarnings).toBe(0);
          expect(validatorReport.errors).toHaveLength(0);
          expect(validatorReport.warnings).toHaveLength(0);
        });
      });
    });
    describe(`invalid html content`, () => {
      let fileContent = false;
      beforeAll(() => {
        return fsUtils.loadFile(path.resolve(htmlValidatorTestFolder, `invalid-html.html`), `utf-8`)
        .then(result => fileContent = result);
      });
      it(`validates an invalid html file`, () => {
        return htmlValidator.validateHtmlSource(fileContent)
        .then(validatorReport => {
          expect(validatorReport.numErrors).toBe(2);
          expect(validatorReport.numWarnings).toBe(1);
          expect(validatorReport.errors).toHaveLength(2);
          expect(validatorReport.warnings).toHaveLength(1);
        });
      });
    });
  });
});
