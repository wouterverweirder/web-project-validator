'use strict';

const path = require(`path`);
const jsdomProcessor = require(`../lib/jsdom_processor`);
const fsUtils = require(`../lib/fs_utils`);

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

const httpServerPort = 3002,
  createServer = require(`../lib/http_server`).createServer;

describe(`jsdom_processor`, () => {
  const jsdomProcessorTestFolder = path.resolve(testsAssetsFolder, `jsdom_processor`);
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  describe(`buildReport`, () => {
    it(`throws an error when report has no urls property`, () => {
      return jsdomProcessor.buildReport({})
      .catch(e => {
        expect(e).toBe(`no urls set to process with jsdom`);
      });
    });
    it(`throws an error when report has no local folder path property`, () => {
      return jsdomProcessor.buildReport({urls: [`https://github.com/wouterverweirder/`]})
      .catch(e => {
        expect(e).toBe(`no local folder path set for resource output`);
      });
    });
    describe(`local projects`, () => {
      describe(`local normal project`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(jsdomProcessorTestFolder, `normal.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          return jsdomProcessor.buildReport(input).then(r => report = r);
        });
        it(`creates a resource with the correct url in the report`, () => {
          const outputResources = [
            {
              url: inputUrl
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
        it(`creates an outline property on the resource`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource).toBeTruthy();
          expect(resource.outline).toBeTruthy();
        });
        it(`outline errors / warnings are correct`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource.outline.numErrors).toBe(0);
          expect(resource.outline.numWarnings).toBe(0);
        });
        it(`outline children are correct`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource.outline.children).toHaveLength(1);
          const outlineBody = resource.outline.children[0];
          expect(outlineBody.children).toHaveLength(5);
          const outlineNavigation = outlineBody.children[0];
          expect(outlineNavigation.children).toHaveLength(0);
          const outlineFirstSection = outlineBody.children[1];
          expect(outlineFirstSection.children).toHaveLength(2);
          const outlineSecondSection = outlineBody.children[2];
          expect(outlineSecondSection.children).toHaveLength(1);
          const outlineThirdSection = outlineBody.children[3];
          expect(outlineThirdSection.children).toHaveLength(0);
          const outlineFooter = outlineBody.children[4];
          expect(outlineFooter.children).toHaveLength(0);
        });
        it(`sets the correct title`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          const outlineFooter = outlineBody.children[4];
          expect(outlineBody.title).toBe(`This is the body title`);
          expect(outlineNavigation.title).toBe(`Navigation`);
          expect(outlineFirstSection.title).toBe(`This is the first section header`);
          expect(outlineFirstSection.children[0].title).toBe(`This is the first article header`);
          expect(outlineFirstSection.children[1].title).toBe(`This is the second article header`);
          expect(outlineSecondSection.title).toBe(`This is the second section header`);
          expect(outlineSecondSection.children[0].title).toBe(`This is the third article header`);
          expect(outlineThirdSection.title).toBe(`This is the third section header`);
          expect(outlineFooter.title).toBe(`this is the footer`);
        });
        it(`sets the correct tag names`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          const outlineFooter = outlineBody.children[4];
          expect(outlineBody.tagName).toBe(`body`);
          expect(outlineNavigation.tagName).toBe(`nav`);
          expect(outlineFirstSection.tagName).toBe(`section`);
          expect(outlineFirstSection.children[0].tagName).toBe(`article`);
          expect(outlineFirstSection.children[1].tagName).toBe(`article`);
          expect(outlineSecondSection.tagName).toBe(`section`);
          expect(outlineSecondSection.children[0].tagName).toBe(`article`);
          expect(outlineThirdSection.tagName).toBe(`section`);
          expect(outlineFooter.tagName).toBe(`h2`);
        });
        it(`sets the correct identifications`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          const outlineFooter = outlineBody.children[4];
          expect(outlineBody.identification).toBe(false);
          expect(outlineNavigation.identification).toBe(`#navigation`);
          expect(outlineFirstSection.identification).toBe(`.main-section.main-section-first`);
          expect(outlineFirstSection.children[0].identification).toBe(`.news-article`);
          expect(outlineFirstSection.children[1].identification).toBe(`.news-article`);
          expect(outlineSecondSection.identification).toBe(`#second`);
          expect(outlineSecondSection.children[0].identification).toBe(false);
          expect(outlineThirdSection.identification).toBe(false);
          expect(outlineFooter.identification).toBe(false);
        });
      });
      describe(`local normal project with spaces`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(jsdomProcessorTestFolder, `normal with spaces.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          return jsdomProcessor.buildReport(input).then(r => report = r);
        });
        it(`creates a resource with the correct url in the report`, () => {
          const outputResources = [
            {
              url: inputUrl
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
        it(`creates an outline property on the resource`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource).toBeTruthy();
          expect(resource.outline).toBeTruthy();
        });
        it(`outline errors / warnings are correct`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource.outline.numErrors).toBe(0);
          expect(resource.outline.numWarnings).toBe(0);
        });
        it(`outline children are correct`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource.outline.children).toHaveLength(1);
          const outlineBody = resource.outline.children[0];
          expect(outlineBody.children).toHaveLength(5);
          const outlineNavigation = outlineBody.children[0];
          expect(outlineNavigation.children).toHaveLength(0);
          const outlineFirstSection = outlineBody.children[1];
          expect(outlineFirstSection.children).toHaveLength(2);
          const outlineSecondSection = outlineBody.children[2];
          expect(outlineSecondSection.children).toHaveLength(1);
          const outlineThirdSection = outlineBody.children[3];
          expect(outlineThirdSection.children).toHaveLength(0);
          const outlineFooter = outlineBody.children[4];
          expect(outlineFooter.children).toHaveLength(0);
        });
        it(`sets the correct title`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          const outlineFooter = outlineBody.children[4];
          expect(outlineBody.title).toBe(`This is the body title`);
          expect(outlineNavigation.title).toBe(`Navigation`);
          expect(outlineFirstSection.title).toBe(`This is the first section header`);
          expect(outlineFirstSection.children[0].title).toBe(`This is the first article header`);
          expect(outlineFirstSection.children[1].title).toBe(`This is the second article header`);
          expect(outlineSecondSection.title).toBe(`This is the second section header`);
          expect(outlineSecondSection.children[0].title).toBe(`This is the third article header`);
          expect(outlineThirdSection.title).toBe(`This is the third section header`);
          expect(outlineFooter.title).toBe(`this is the footer`);
        });
        it(`sets the correct tag names`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          const outlineFooter = outlineBody.children[4];
          expect(outlineBody.tagName).toBe(`body`);
          expect(outlineNavigation.tagName).toBe(`nav`);
          expect(outlineFirstSection.tagName).toBe(`section`);
          expect(outlineFirstSection.children[0].tagName).toBe(`article`);
          expect(outlineFirstSection.children[1].tagName).toBe(`article`);
          expect(outlineSecondSection.tagName).toBe(`section`);
          expect(outlineSecondSection.children[0].tagName).toBe(`article`);
          expect(outlineThirdSection.tagName).toBe(`section`);
          expect(outlineFooter.tagName).toBe(`h2`);
        });
        it(`sets the correct identifications`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          const outlineFooter = outlineBody.children[4];
          expect(outlineBody.identification).toBe(false);
          expect(outlineNavigation.identification).toBe(`#navigation`);
          expect(outlineFirstSection.identification).toBe(`.main-section.main-section-first`);
          expect(outlineFirstSection.children[0].identification).toBe(`.news-article`);
          expect(outlineFirstSection.children[1].identification).toBe(`.news-article`);
          expect(outlineSecondSection.identification).toBe(`#second`);
          expect(outlineSecondSection.children[0].identification).toBe(false);
          expect(outlineThirdSection.identification).toBe(false);
          expect(outlineFooter.identification).toBe(false);
        });
      });
      describe(`local untitled elements project`, () => {
        const inputUrl = fsUtils.getPathWithProtocol(path.resolve(jsdomProcessorTestFolder, `untitled-elements.html`));
        const input = {
          urls: [inputUrl],
          localReportPath: {
            folder: path.resolve(projectRoot, `output`)
          }
        };
        let report = false;
        beforeAll(() => {
          return jsdomProcessor.buildReport(input).then(r => report = r);
        });
        it(`creates an outline property on the resource`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource).toBeTruthy();
          expect(resource.outline).toBeTruthy();
        });
        it(`outline errors / warnings are correct`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource.outline.numErrors).toBe(4);
          expect(resource.outline.numWarnings).toBe(0);
        });
        it(`outline children are correct`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          expect(resource.outline.children).toHaveLength(1);
          const outlineBody = resource.outline.children[0];
          expect(outlineBody.children).toHaveLength(4);
          const outlineNavigation = outlineBody.children[0];
          expect(outlineNavigation.children).toHaveLength(0);
          const outlineFirstSection = outlineBody.children[1];
          expect(outlineFirstSection.children).toHaveLength(2);
          const outlineSecondSection = outlineBody.children[2];
          expect(outlineSecondSection.children).toHaveLength(1);
          const outlineThirdSection = outlineBody.children[3];
          expect(outlineThirdSection.children).toHaveLength(0);
        });
        it(`sets the correct title`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          expect(outlineBody.title).toBe(`This is the body title`);
          expect(outlineNavigation.title).toBe(false);
          expect(outlineFirstSection.title).toBe(`This is the first section header`);
          expect(outlineFirstSection.children[0].title).toBe(false);
          expect(outlineFirstSection.children[1].title).toBe(`This is the second article header`);
          expect(outlineSecondSection.title).toBe(false);
          expect(outlineSecondSection.children[0].title).toBe(`This is the third article header`);
          expect(outlineThirdSection.title).toBe(false);
        });
        it(`sets the correct tag names`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          expect(outlineBody.tagName).toBe(`body`);
          expect(outlineNavigation.tagName).toBe(`nav`);
          expect(outlineFirstSection.tagName).toBe(`section`);
          expect(outlineFirstSection.children[0].tagName).toBe(`article`);
          expect(outlineFirstSection.children[1].tagName).toBe(`article`);
          expect(outlineSecondSection.tagName).toBe(`section`);
          expect(outlineSecondSection.children[0].tagName).toBe(`article`);
          expect(outlineThirdSection.tagName).toBe(`section`);
        });
        it(`sets the correct identifications`, () => {
          const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
          const outlineBody = resource.outline.children[0];
          const outlineNavigation = outlineBody.children[0];
          const outlineFirstSection = outlineBody.children[1];
          const outlineSecondSection = outlineBody.children[2];
          const outlineThirdSection = outlineBody.children[3];
          expect(outlineBody.identification).toBe(false);
          expect(outlineNavigation.identification).toBe(`#navigation`);
          expect(outlineFirstSection.identification).toBe(`.main-section.main-section-first`);
          expect(outlineFirstSection.children[0].identification).toBe(`.news-article`);
          expect(outlineFirstSection.children[1].identification).toBe(`.news-article`);
          expect(outlineSecondSection.identification).toBe(`#second`);
          expect(outlineSecondSection.children[0].identification).toBe(false);
          expect(outlineThirdSection.identification).toBe(false);
        });
      });
    });
  });
  describe(`local http projects`, () => {
    //start a local http server
    const httpServer = createServer({
      root: jsdomProcessorTestFolder
    });
    beforeAll(() => {
      return httpServer.listen(httpServerPort);
    });
    afterAll(() => {
      return httpServer.close();
    });
    describe(`http normal project`, () => {
      const inputUrl = `http://localhost:${httpServerPort}/normal.html`;
      const input = {
        urls: [inputUrl],
        localReportPath: {
          folder: path.resolve(projectRoot, `output`)
        }
      };
      let report = false;
      beforeAll(() => {
        return jsdomProcessor.buildReport(input).then(r => report = r);
      });
      it(`creates a resource with the correct url in the report`, () => {
        const outputResources = [
          {
            url: inputUrl
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
      it(`creates an outline property on the resource`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        expect(resource).toBeTruthy();
        expect(resource.outline).toBeTruthy();
      });
      it(`outline errors / warnings are correct`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        expect(resource.outline.numErrors).toBe(0);
        expect(resource.outline.numWarnings).toBe(0);
      });
      it(`outline children are correct`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        expect(resource.outline.children).toHaveLength(1);
        const outlineBody = resource.outline.children[0];
        expect(outlineBody.children).toHaveLength(5);
        const outlineNavigation = outlineBody.children[0];
        expect(outlineNavigation.children).toHaveLength(0);
        const outlineFirstSection = outlineBody.children[1];
        expect(outlineFirstSection.children).toHaveLength(2);
        const outlineSecondSection = outlineBody.children[2];
        expect(outlineSecondSection.children).toHaveLength(1);
        const outlineThirdSection = outlineBody.children[3];
        expect(outlineThirdSection.children).toHaveLength(0);
        const outlineFooter = outlineBody.children[4];
        expect(outlineFooter.children).toHaveLength(0);
      });
      it(`sets the correct title`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        const outlineBody = resource.outline.children[0];
        const outlineNavigation = outlineBody.children[0];
        const outlineFirstSection = outlineBody.children[1];
        const outlineSecondSection = outlineBody.children[2];
        const outlineThirdSection = outlineBody.children[3];
        const outlineFooter = outlineBody.children[4];
        expect(outlineBody.title).toBe(`This is the body title`);
        expect(outlineNavigation.title).toBe(`Navigation`);
        expect(outlineFirstSection.title).toBe(`This is the first section header`);
        expect(outlineFirstSection.children[0].title).toBe(`This is the first article header`);
        expect(outlineFirstSection.children[1].title).toBe(`This is the second article header`);
        expect(outlineSecondSection.title).toBe(`This is the second section header`);
        expect(outlineSecondSection.children[0].title).toBe(`This is the third article header`);
        expect(outlineThirdSection.title).toBe(`This is the third section header`);
        expect(outlineFooter.title).toBe(`this is the footer`);
      });
      it(`sets the correct tag names`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        const outlineBody = resource.outline.children[0];
        const outlineNavigation = outlineBody.children[0];
        const outlineFirstSection = outlineBody.children[1];
        const outlineSecondSection = outlineBody.children[2];
        const outlineThirdSection = outlineBody.children[3];
        const outlineFooter = outlineBody.children[4];
        expect(outlineBody.tagName).toBe(`body`);
        expect(outlineNavigation.tagName).toBe(`nav`);
        expect(outlineFirstSection.tagName).toBe(`section`);
        expect(outlineFirstSection.children[0].tagName).toBe(`article`);
        expect(outlineFirstSection.children[1].tagName).toBe(`article`);
        expect(outlineSecondSection.tagName).toBe(`section`);
        expect(outlineSecondSection.children[0].tagName).toBe(`article`);
        expect(outlineThirdSection.tagName).toBe(`section`);
        expect(outlineFooter.tagName).toBe(`h2`);
      });
      it(`sets the correct identifications`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        const outlineBody = resource.outline.children[0];
        const outlineNavigation = outlineBody.children[0];
        const outlineFirstSection = outlineBody.children[1];
        const outlineSecondSection = outlineBody.children[2];
        const outlineThirdSection = outlineBody.children[3];
        const outlineFooter = outlineBody.children[4];
        expect(outlineBody.identification).toBe(false);
        expect(outlineNavigation.identification).toBe(`#navigation`);
        expect(outlineFirstSection.identification).toBe(`.main-section.main-section-first`);
        expect(outlineFirstSection.children[0].identification).toBe(`.news-article`);
        expect(outlineFirstSection.children[1].identification).toBe(`.news-article`);
        expect(outlineSecondSection.identification).toBe(`#second`);
        expect(outlineSecondSection.children[0].identification).toBe(false);
        expect(outlineThirdSection.identification).toBe(false);
        expect(outlineFooter.identification).toBe(false);
      });
    });
    describe(`http normal project with spaces`, () => {
      const inputUrl = `http://localhost:${httpServerPort}/normal%20with%20spaces.html`;
      const input = {
        urls: [inputUrl],
        localReportPath: {
          folder: path.resolve(projectRoot, `output`)
        }
      };
      let report = false;
      beforeAll(() => {
        return jsdomProcessor.buildReport(input).then(r => report = r);
      });
      it(`creates a resource with the correct url in the report`, () => {
        const outputResources = [
          {
            url: inputUrl
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
      it(`creates an outline property on the resource`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        expect(resource).toBeTruthy();
        expect(resource.outline).toBeTruthy();
      });
      it(`outline errors / warnings are correct`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        expect(resource.outline.numErrors).toBe(0);
        expect(resource.outline.numWarnings).toBe(0);
      });
      it(`outline children are correct`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        expect(resource.outline.children).toHaveLength(1);
        const outlineBody = resource.outline.children[0];
        expect(outlineBody.children).toHaveLength(5);
        const outlineNavigation = outlineBody.children[0];
        expect(outlineNavigation.children).toHaveLength(0);
        const outlineFirstSection = outlineBody.children[1];
        expect(outlineFirstSection.children).toHaveLength(2);
        const outlineSecondSection = outlineBody.children[2];
        expect(outlineSecondSection.children).toHaveLength(1);
        const outlineThirdSection = outlineBody.children[3];
        expect(outlineThirdSection.children).toHaveLength(0);
        const outlineFooter = outlineBody.children[4];
        expect(outlineFooter.children).toHaveLength(0);
      });
      it(`sets the correct title`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        const outlineBody = resource.outline.children[0];
        const outlineNavigation = outlineBody.children[0];
        const outlineFirstSection = outlineBody.children[1];
        const outlineSecondSection = outlineBody.children[2];
        const outlineThirdSection = outlineBody.children[3];
        const outlineFooter = outlineBody.children[4];
        expect(outlineBody.title).toBe(`This is the body title`);
        expect(outlineNavigation.title).toBe(`Navigation`);
        expect(outlineFirstSection.title).toBe(`This is the first section header`);
        expect(outlineFirstSection.children[0].title).toBe(`This is the first article header`);
        expect(outlineFirstSection.children[1].title).toBe(`This is the second article header`);
        expect(outlineSecondSection.title).toBe(`This is the second section header`);
        expect(outlineSecondSection.children[0].title).toBe(`This is the third article header`);
        expect(outlineThirdSection.title).toBe(`This is the third section header`);
        expect(outlineFooter.title).toBe(`this is the footer`);
      });
      it(`sets the correct tag names`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        const outlineBody = resource.outline.children[0];
        const outlineNavigation = outlineBody.children[0];
        const outlineFirstSection = outlineBody.children[1];
        const outlineSecondSection = outlineBody.children[2];
        const outlineThirdSection = outlineBody.children[3];
        const outlineFooter = outlineBody.children[4];
        expect(outlineBody.tagName).toBe(`body`);
        expect(outlineNavigation.tagName).toBe(`nav`);
        expect(outlineFirstSection.tagName).toBe(`section`);
        expect(outlineFirstSection.children[0].tagName).toBe(`article`);
        expect(outlineFirstSection.children[1].tagName).toBe(`article`);
        expect(outlineSecondSection.tagName).toBe(`section`);
        expect(outlineSecondSection.children[0].tagName).toBe(`article`);
        expect(outlineThirdSection.tagName).toBe(`section`);
        expect(outlineFooter.tagName).toBe(`h2`);
      });
      it(`sets the correct identifications`, () => {
        const resource = report.reportsByUrl[inputUrl].resourcesByUrl[inputUrl];
        const outlineBody = resource.outline.children[0];
        const outlineNavigation = outlineBody.children[0];
        const outlineFirstSection = outlineBody.children[1];
        const outlineSecondSection = outlineBody.children[2];
        const outlineThirdSection = outlineBody.children[3];
        const outlineFooter = outlineBody.children[4];
        expect(outlineBody.identification).toBe(false);
        expect(outlineNavigation.identification).toBe(`#navigation`);
        expect(outlineFirstSection.identification).toBe(`.main-section.main-section-first`);
        expect(outlineFirstSection.children[0].identification).toBe(`.news-article`);
        expect(outlineFirstSection.children[1].identification).toBe(`.news-article`);
        expect(outlineSecondSection.identification).toBe(`#second`);
        expect(outlineSecondSection.children[0].identification).toBe(false);
        expect(outlineThirdSection.identification).toBe(false);
        expect(outlineFooter.identification).toBe(false);
      });
    });
  });
});
