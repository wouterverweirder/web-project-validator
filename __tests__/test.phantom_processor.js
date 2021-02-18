'use strict';

const path = require(`path`);
const phantomProcessor = require(`../lib/phantom_processor`);
const fsUtils = require(`../lib/fs_utils`);

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

const httpServerPort = 3003,
  createServer = require(`../lib/http_server`).createServer;

describe(`phantom_processor`, () => {
  const phantomProcessorTestFolder = path.resolve(testsAssetsFolder, `phantom_processor`);
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  let ph;
  beforeAll(() => {
    return Promise.resolve()
    .then(() => phantomProcessor.startPhantom())
    .then(o => ph = o);
  });
  afterAll(() => {
    return Promise.resolve()
    .then(() => phantomProcessor.stopPhantom(ph));
  });
  describe(`buildReportWithPhantom`, () => {
    it(`throws an error when report has no urls property`, () => {
      return phantomProcessor.buildReportWithPhantom(ph, {})
      .catch(e => {
        expect(e).toBe(`no urls set to process with phantomjs`);
      });
    });
    it(`throws an error when report has no local folder path property`, () => {
      return phantomProcessor.buildReportWithPhantom(ph, {urls: [`https://github.com/wouterverweirder/`]})
      .catch(e => {
        expect(e).toBe(`no local folder path set for resource output`);
      });
    });
    describe(`local projects`, () => {
      describe(`local normal project`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `index.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `index.html`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `css`, `style.css`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `photo.jpg`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `pattern.png`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `js`, `script.js`))
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the relativeUrl correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `index.html`)),
              relativeUrl: `index.html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `css`, `style.css`)),
              relativeUrl: `css/style.css`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `photo.jpg`)),
              relativeUrl: `images/photo.jpg`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `pattern.png`)),
              relativeUrl: `images/pattern.png`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `js`, `script.js`)),
              relativeUrl: `js/script.js`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.relativeUrl).toBe(outputResource.relativeUrl);
          });
        });
        it(`sets the types correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `index.html`)),
              type: `html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `css`, `style.css`)),
              type: `style`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `photo.jpg`)),
              type: `image`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `pattern.png`)),
              type: `image`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `js`, `script.js`)),
              type: `javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.type).toBe(outputResource.type);
          });
        });
        it(`sets the includedFrom values`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `index.html`)),
              includedFrom: []
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `css`, `style.css`)),
              includedFrom: [
                {
                  url: inputUrl,
                  includeUrl: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `css`, `style.css`)),
                  tagName: `link`
                }
              ]
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `photo.jpg`)),
              includedFrom: [
                {
                  url: inputUrl,
                  includeUrl: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `photo.jpg`)),
                  tagName: `img`,
                  width: 10,
                  height: 10,
                  naturalWidth: 100,
                  naturalHeight: 100
                }
              ]
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `pattern.png`)),
              includedFrom: [
                {
                  url: inputUrl,
                  includeUrl: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `pattern.png`)),
                  tagName: `img`,
                  width: 256,
                  height: 256,
                  naturalWidth: 256,
                  naturalHeight: 256
                }
              ]
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `js`, `script.js`)),
              includedFrom: [
              ]
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.includedFrom).toHaveLength(outputResource.includedFrom.length);
            outputResource.includedFrom.forEach(outputInclude => {
              expect(resource.includedFrom).toContainEqual(outputInclude);
            });
          });
        });
        it(`sets the mimeTypes correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `index.html`)),
              mimeType: `text/html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `css`, `style.css`)),
              mimeType: `text/css`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `photo.jpg`)),
              mimeType: `image/jpeg`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `images`, `pattern.png`)),
              mimeType: `image/png`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `normal`, `js`, `script.js`)),
              mimeType: `application/javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.mimeType).toBe(outputResource.mimeType);
          });
        });
        it(`calls the resource processor for all requested resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });

      describe(`local project with one img and one background-image`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `index.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `index.html`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `css`, `style.css`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `photo.jpg`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `pattern.png`))
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the relativeUrl correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `index.html`)),
              relativeUrl: `index.html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `css`, `style.css`)),
              relativeUrl: `css/style.css`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `photo.jpg`)),
              relativeUrl: `images/photo.jpg`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `pattern.png`)),
              relativeUrl: `images/pattern.png`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.relativeUrl).toBe(outputResource.relativeUrl);
          });
        });
        it(`sets the types correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `index.html`)),
              type: `html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `css`, `style.css`)),
              type: `style`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `photo.jpg`)),
              type: `image`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `pattern.png`)),
              type: `image`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.type).toBe(outputResource.type);
          });
        });
        it(`sets the includedFrom values`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `index.html`)),
              includedFrom: []
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `css`, `style.css`)),
              includedFrom: [
                {
                  url: inputUrl,
                  includeUrl: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `css`, `style.css`)),
                  tagName: `link`
                }
              ]
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `photo.jpg`)),
              includedFrom: [
                {
                  url: inputUrl,
                  includeUrl: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `photo.jpg`)),
                  tagName: `img`,
                  width: 10,
                  height: 10,
                  naturalWidth: 100,
                  naturalHeight: 100
                }
              ]
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `pattern.png`)),
              includedFrom: [
              ]
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.includedFrom).toHaveLength(outputResource.includedFrom.length);
            outputResource.includedFrom.forEach(outputInclude => {
              expect(resource.includedFrom).toContainEqual(outputInclude);
            });
          });
        });
        it(`sets the mimeTypes correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `index.html`)),
              mimeType: `text/html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `css`, `style.css`)),
              mimeType: `text/css`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `photo.jpg`)),
              mimeType: `image/jpeg`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `img-and-background-img`, `images`, `pattern.png`)),
              mimeType: `image/png`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.mimeType).toBe(outputResource.mimeType);
          });
        });
        it(`calls the resource processor for all requested resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });

      describe(`local project with missing images`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `index.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `index.html`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `css`, `style.css`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `images`, `photo.jpg`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `images`, `pattern.png`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `js`, `script.js`))
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the error booleans correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `index.html`)),
              error: false
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `css`, `style.css`)),
              error: false
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `images`, `photo.jpg`)),
              error: true
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `images`, `pattern.png`)),
              error: true
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `js`, `script.js`)),
              error: false
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.error).toBe(outputResource.error);
          });
        });
        it(`sets the mimeTypes correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `index.html`)),
              mimeType: `text/html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `css`, `style.css`)),
              mimeType: `text/css`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `images`, `photo.jpg`)),
              mimeType: `image/jpeg`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `images`, `pattern.png`)),
              mimeType: `image/png`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `files-not-found`, `js`, `script.js`)),
              mimeType: `application/javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.mimeType).toBe(outputResource.mimeType);
          });
        });
        it(`calls the resource processor for all requested resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });
      describe(`local project with spaces in paths`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `index.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `index.html`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `css files`, `style.css`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a photo.jpg`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a pattern.png`))
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `javascript files`, `script.js`))
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the error booleans correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `index.html`)),
              error: false
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `css files`, `style.css`)),
              error: false
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a photo.jpg`)),
              error: false
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a pattern.png`)),
              error: false
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `javascript files`, `script.js`)),
              error: false
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.error).toBe(outputResource.error);
          });
        });
        it(`sets the types correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `index.html`)),
              type: `html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `css files`, `style.css`)),
              type: `style`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a photo.jpg`)),
              type: `image`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a pattern.png`)),
              type: `image`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `javascript files`, `script.js`)),
              type: `javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.type).toBe(outputResource.type);
          });
        });
        it(`sets the mimeTypes correctly`, () => {
          const outputResources = [
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `index.html`)),
              mimeType: `text/html`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `css files`, `style.css`)),
              mimeType: `text/css`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a photo.jpg`)),
              mimeType: `image/jpeg`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `images`, `a pattern.png`)),
              mimeType: `image/png`
            },
            {
              url: fsUtils.getPathWithProtocol(path.resolve(phantomProcessorTestFolder, `paths with spaces`, `javascript files`, `script.js`)),
              mimeType: `application/javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.mimeType).toBe(outputResource.mimeType);
          });
        });
        it(`calls the resource processor for all loaded resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });
    });
    describe(`local http projects`, () => {
      //start a local http server
      const httpServer = createServer({
        root: phantomProcessorTestFolder
      });
      beforeAll(() => {
        return httpServer.listen(httpServerPort);
      });
      afterAll(() => {
        return httpServer.close();
      });
      describe(`local http normal project, with querystring`, () => {
        const inputUrl = `http://localhost:${httpServerPort}/normal/index.html?page=home&action=view`;
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/normal/index.html?page=home&action=view`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/css/style.css`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/photo.jpg`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/pattern.png`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/js/script.js`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the types correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/normal/index.html?page=home&action=view`,
              type: `html`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/css/style.css`,
              type: `style`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/photo.jpg`,
              type: `image`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/pattern.png`,
              type: `image`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/js/script.js`,
              type: `javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.type).toBe(outputResource.type);
          });
        });
        it(`sets the relativeUrl correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/normal/index.html?page=home&action=view`,
              relativeUrl: `index.html`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/css/style.css`,
              relativeUrl: `css/style.css`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/photo.jpg`,
              relativeUrl: `images/photo.jpg`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/pattern.png`,
              relativeUrl: `images/pattern.png`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/js/script.js`,
              relativeUrl: `js/script.js`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.relativeUrl).toBe(outputResource.relativeUrl);
          });
        });
        it(`sets the mimeTypes correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/normal/index.html?page=home&action=view`,
              mimeType: `text/html`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/css/style.css`,
              mimeType: `text/css`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/photo.jpg`,
              mimeType: `image/jpeg`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/images/pattern.png`,
              mimeType: `image/png`
            },
            {
              url: `http://localhost:${httpServerPort}/normal/js/script.js`,
              mimeType: `application/javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.mimeType).toBe(outputResource.mimeType);
          });
        });
        it(`calls the resource processor for all loaded resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });
      describe(`local http project with missing images`, () => {
        const inputUrl = `http://localhost:${httpServerPort}/files-not-found/index.html`;
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/files-not-found/index.html`
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/css/style.css`
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/images/photo.jpg`
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/images/pattern.png`
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/js/script.js`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the error booleans correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/files-not-found/index.html`,
              error: false
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/css/style.css`,
              error: false
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/images/photo.jpg`,
              error: true
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/images/pattern.png`,
              error: true
            },
            {
              url: `http://localhost:${httpServerPort}/files-not-found/js/script.js`,
              error: false
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.error).toBe(outputResource.error);
          });
        });
        it(`calls the resource processor for all loaded resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });
      describe(`local http project with spaces in paths`, () => {
        const inputUrl = `http://localhost:${httpServerPort}/paths%20with%20spaces/index.html`;
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          jest.mock(`../lib/resource_processor`, () => {
            return {
              processRequestedResources: jest.fn(() => {
                return Promise.resolve();
              }),
              createResourcesReport: jest.fn(() => {
                return Promise.resolve();
              })
            };
          });
          return phantomProcessor.buildReportWithPhantom(ph, input).then(r => report = r);
        });
        afterAll(() => {
          jest.resetModules();
        });
        it(`sets the urls correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/index.html`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/css%20files/style.css`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/images/a%20photo.jpg`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/images/a%20pattern.png`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/javascript%20files/script.js`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource).toBeTruthy();
            expect(resource.url).toBe(outputResource.url);
          });
        });
        it(`sets the error booleans correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/index.html`,
              error: false
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/css%20files/style.css`,
              error: false
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/images/a%20photo.jpg`,
              error: false
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/images/a%20pattern.png`,
              error: false
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/javascript%20files/script.js`,
              error: false
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.error).toBe(outputResource.error);
          });
        });
        it(`sets the types correctly`, () => {
          const outputResources = [
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/index.html`,
              type: `html`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/css%20files/style.css`,
              type: `style`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/images/a%20photo.jpg`,
              type: `image`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/images/a%20pattern.png`,
              type: `image`
            },
            {
              url: `http://localhost:${httpServerPort}/paths%20with%20spaces/javascript%20files/script.js`,
              type: `javascript`
            }
          ];
          expect(report.reportsByUrl).toBeTruthy();
          expect(report.reportsByUrl[inputUrl]).toBeTruthy();
          expect(report.reportsByUrl[inputUrl].resources).toHaveLength(outputResources.length);
          expect(report.reportsByUrl[inputUrl].resourcesByUrl).toBeTruthy();
          outputResources.forEach(outputResource => {
            const resource = report.reportsByUrl[inputUrl].resourcesByUrl[outputResource.url];
            expect(resource.type).toBe(outputResource.type);
          });
        });
        it(`calls the resource processor for all loaded resources`, () => {
          const resourceProcessor = require(`../lib/resource_processor`);
          expect(resourceProcessor.processRequestedResources.mock.calls.length).toBe(1);
        });
      });
    });
  });
});
