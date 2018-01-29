'use strict';

const path = require(`path`),
  htmlValidator = require(`../lib/html_validator`);

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
  describe(`validateHtmlFile`, () => {
    it(`validates a valid html file`, () => {
      return htmlValidator.validateHtmlFile(path.resolve(htmlValidatorTestFolder, `valid-html.html`))
      .then(validatorReport => {
        expect(validatorReport.numErrors).toBe(0);
        expect(validatorReport.numWarnings).toBe(0);
        expect(validatorReport.errors).toHaveLength(0);
        expect(validatorReport.warnings).toHaveLength(0);
      });
    });
    it(`validates a file with special characters`, () => {
      return htmlValidator.validateHtmlFile(path.resolve(htmlValidatorTestFolder, `special-character-html.html`))
      .then(validatorReport => {
        console.log(validatorReport);
        expect(validatorReport.numErrors).toBe(0);
        expect(validatorReport.numWarnings).toBe(0);
        expect(validatorReport.errors).toHaveLength(0);
        expect(validatorReport.warnings).toHaveLength(0);
      });
    });
    it(`validates an invalid html file`, () => {
      return htmlValidator.validateHtmlFile(path.resolve(htmlValidatorTestFolder, `invalid-html.html`))
      .then(validatorReport => {
        expect(validatorReport.numErrors).toBe(2);
        expect(validatorReport.numWarnings).toBe(1);
        expect(validatorReport.errors).toHaveLength(2);
        expect(validatorReport.warnings).toHaveLength(1);
      });
    });
  });
});
