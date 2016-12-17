'use strict';

const path = require(`path`),
  createServer = require(`../lib/http_server`).createServer;

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);
const httpServerPort = 3000;

describe(`http_server`, () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  afterAll(() => {
    return require(`../lib/html_validator`).stop();
  });
  const htmlValidatorTestFolder = path.resolve(testsAssetsFolder, `http_server`);
  const httpServer = createServer({root: htmlValidatorTestFolder});
  it(`server starts`, () => {
    return httpServer.listen(httpServerPort)
    .then(() => {
      expect(httpServer.isRunning()).toBe(true);
    });
  });
  it(`server stops`, () => {
    return httpServer.close()
    .then(() => {
      expect(httpServer.isRunning()).toBe(false);
    });
  });
});
