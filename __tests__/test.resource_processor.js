'use strict';

const path = require(`path`),
  lib = require(`../lib/index`),
  resourceProcessor = require(`../lib/resource_processor`),
  fsUtils = require(`../lib/fs_utils`);

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

const setupReport = (inputUrl, localFolderPath, resources = []) => {
  inputUrl = fsUtils.getPathWithProtocol(inputUrl);
  const report = {
    urls: [inputUrl],
    localReportPath: {
      folder: localFolderPath
    }
  };
  lib.setReportPropertiesBasedOnReportUrls(report);
  const reportForInputUrl = report.reportsByUrl[inputUrl];
  resources.forEach(inputResource => {
    const basicResourceObject = lib.createBasicResourceObject(inputResource.url);
    for (const key in basicResourceObject) {
      if (!inputResource[key]) {
        inputResource[key] = basicResourceObject[key];
      }
    }
    reportForInputUrl.resources.push(inputResource);
  });
  lib.updateResourcesListAndMap(report, inputUrl);
  return report;
};

describe(`resource_processor`, () => {
  const resourceProcessorTestFolder = path.resolve(testsAssetsFolder, `resource_processor`);
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line

  beforeEach(() => {
    jest.mock(`../lib/html_validator`, () => {
      return {
        validateHtmlFile: jest.fn(() => {
          return Promise.resolve();
        })
      };
    });
    jest.mock(`../lib/style_linter`, () => {
      return {
        lintStyleSource: jest.fn(() => {
          return Promise.resolve()
          .then(() => {
            return {
              styleLint: {},
              backgroundImagePaths: [`../pattern.png`]
            };
          });
        })
      };
    });
  });
  afterEach(() => {
    jest.resetModules();
  });

  describe(`processRequestedResource`, () => {
    const tmpFolder = path.resolve(resourceProcessorTestFolder, `tmp`);
    beforeEach(() => {
      return fsUtils.mkdirpPromised(tmpFolder);
    });
    afterEach(() => {
      return fsUtils.rimrafPromised(tmpFolder);
    });
    describe(`local projects`, () => {
      describe(`only html file`, () => {
        describe(`local normal project`, () => {
          const inputUrl = fsUtils.getPathWithProtocol(path.resolve(resourceProcessorTestFolder, `normal`, `index.html`));
          const inputResource = {
            url: inputUrl,
            type: `html`
          };
          const input = setupReport(inputUrl, tmpFolder, [inputResource]);
          it(`sets the localReportPath.folder`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const expectedLocalFolderPath = fsUtils.getLocalFolderPathForResource(inputResource, input.localReportPath.folder);
              expect(inputResource.localReportPath.folder).toBe(expectedLocalFolderPath);
            });
          });
          it(`sets the localReportPath.file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const expectedLocalFilePath = path.resolve(fsUtils.getLocalFolderPathForResource(inputResource, input.localReportPath.folder), `content`);
              expect(inputResource.localReportPath.file).toBe(expectedLocalFilePath);
            });
          });
          it(`adds a validator report for the html file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const htmlValidator = require(`../lib/html_validator`);
              expect(htmlValidator.validateHtmlFile.mock.calls.length).toBe(1);
            });
          });
          it(`does not at a style report when the file isnt a css file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const styleLinter = require(`../lib/style_linter`);
              expect(styleLinter.lintStyleSource.mock.calls.length).toBe(0);
            });
          });
        });
        describe(`local file not found`, () => {
          const inputUrl = fsUtils.getPathWithProtocol(path.resolve(resourceProcessorTestFolder, `file-not-found.html`));
          const inputResource = {
            url: inputUrl,
            type: `html`
          };
          const input = setupReport(inputUrl, tmpFolder, [inputResource]);
          it(`sets the localReportPath.folder`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const expectedLocalFolderPath = fsUtils.getLocalFolderPathForResource(inputResource, input.localReportPath.folder);
              expect(inputResource.localReportPath.folder).toBe(expectedLocalFolderPath);
            });
          });
          it(`sets the localFilePath`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const expectedLocalFilePath = path.resolve(fsUtils.getLocalFolderPathForResource(inputResource, input.localReportPath.folder), `content`);
              expect(inputResource.localReportPath.file).toBe(expectedLocalFilePath);
            });
          });
          it(`sets error boolean to true`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              expect(inputResource.error).toBe(true);
            });
          });
          it(`does not add a validator report for the html file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const htmlValidator = require(`../lib/html_validator`);
              expect(htmlValidator.validateHtmlFile.mock.calls.length).toBe(0);
            });
          });
          it(`does not at a style report when the file isnt a css file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputResource)
            .then(() => {
              const styleLinter = require(`../lib/style_linter`);
              expect(styleLinter.lintStyleSource.mock.calls.length).toBe(0);
            });
          });
        });
      });
      describe(`one css file`, () => {
        describe(`local normal project`, () => {
          const inputUrl = fsUtils.getPathWithProtocol(path.resolve(resourceProcessorTestFolder, `normal`, `index.html`));
          const inputStyleUrl = fsUtils.getPathWithProtocol(path.resolve(resourceProcessorTestFolder, `normal`, `css`, `style.css`));
          const inputStyleResource = {
            url: inputStyleUrl,
            type: `style`
          };
          const inputResources = [
            {
              url: inputUrl,
              type: `html`
            },
            inputStyleResource
          ];
          const input = setupReport(inputUrl, tmpFolder, inputResources);
          it(`sets the localFolderPath`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const expectedLocalFolderPath = fsUtils.getLocalFolderPathForResource(inputStyleResource, input.localReportPath.folder);
              expect(inputStyleResource.localReportPath.folder).toBe(expectedLocalFolderPath);
            });
          });
          it(`sets the localFilePath`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const expectedLocalFilePath = path.resolve(fsUtils.getLocalFolderPathForResource(inputStyleResource, input.localReportPath.folder), `content`);
              expect(inputStyleResource.localReportPath.file).toBe(expectedLocalFilePath);
            });
          });
          it(`does not add a html validator report for the css file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const htmlValidator = require(`../lib/html_validator`);
              expect(htmlValidator.validateHtmlFile.mock.calls.length).toBe(0);
            });
          });
          it(`adds a style report when the file is a css file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const styleLinter = require(`../lib/style_linter`);
              expect(styleLinter.lintStyleSource.mock.calls.length).toBe(1);
            });
          });
        });
        describe(`local file not found`, () => {
          const inputUrl = fsUtils.getPathWithProtocol(path.resolve(resourceProcessorTestFolder, `normal`, `index.html`));
          const inputStyleUrl = fsUtils.getPathWithProtocol(path.resolve(resourceProcessorTestFolder, `normal`, `file-not-found.css`));
          const inputStyleResource = {
            url: inputStyleUrl,
            type: `style`
          };
          const inputResources = [
            {
              url: inputUrl,
              type: `html`
            },
            inputStyleResource
          ];
          const input = setupReport(inputUrl, tmpFolder, inputResources);
          it(`sets the localReportPath.folder`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const expectedLocalFolderPath = fsUtils.getLocalFolderPathForResource(inputStyleResource, input.localReportPath.folder);
              expect(inputStyleResource.localReportPath.folder).toBe(expectedLocalFolderPath);
            });
          });
          it(`sets the localReportPath.file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const expectedLocalFilePath = path.resolve(fsUtils.getLocalFolderPathForResource(inputStyleResource, input.localReportPath.folder), `content`);
              expect(inputStyleResource.localReportPath.file).toBe(expectedLocalFilePath);
            });
          });
          it(`sets error boolean to true`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              expect(inputStyleResource.error).toBe(true);
            });
          });
          it(`does not add a validator report for the html file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const htmlValidator = require(`../lib/html_validator`);
              expect(htmlValidator.validateHtmlFile.mock.calls.length).toBe(0);
            });
          });
          it(`does not at a style report for the css file`, () => {
            return resourceProcessor.processRequestedResource(input, inputUrl, inputStyleResource)
            .then(() => {
              const styleLinter = require(`../lib/style_linter`);
              expect(styleLinter.lintStyleSource.mock.calls.length).toBe(0);
            });
          });
        });
      });
    });
  });
});
