'use strict';

const path = require(`path`),
  fsUtils = require(`../lib/fs_utils`);

const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

const httpServerPort = 3001,
  createServer = require(`../lib/http_server`).createServer;

describe(`fs_utils test`, () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  afterAll(() => {
    return require(`../lib/html_validator`).stop();
  });
  const fsUtilsTestFolder = path.resolve(testsAssetsFolder, `fs_utils`);
  describe(`getPathWithProtocol`, () => {
    it(`prefixes a local path without file:// with file://`, () => {
      const input = `/Users/wouter/Desktop/test.html`;
      const expectedOutput = `file:///Users/wouter/Desktop/test.html`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`url encodes spaces in the path name`, () => {
      const input = `/Users/wouter/Desktop/test file with spaces.html`;
      const expectedOutput = `file:///Users/wouter/Desktop/test%20file%20with%20spaces.html`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`does not url encodes a path name twice`, () => {
      const input = `/Users/wouter/Desktop/test%20file%20with%20spaces.html`;
      const expectedOutput = `file:///Users/wouter/Desktop/test%20file%20with%20spaces.html`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`does not prefix local paths which already have a file:// prefix`, () => {
      const input = `file:///Users/wouter/Desktop/test.html`;
      const expectedOutput = `file:///Users/wouter/Desktop/test.html`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`resolves a relative path to an absolute path`, () => {
      const input = `./examples`;
      const expectedOutput = `file://${path.resolve(projectRoot, `examples`)}`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`does not prefix http:// paths`, () => {
      const input = `http://github.com/wouterverweirder/`;
      const expectedOutput = `http://github.com/wouterverweirder/`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`does not prefix https:// paths`, () => {
      const input = `https://github.com/wouterverweirder/`;
      const expectedOutput = `https://github.com/wouterverweirder/`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`works with querystrings`, () => {
      const input = `https://github.com/wouterverweirder/?a=test&b=hello world&c=hello%20devine`;
      const expectedOutput = `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`works with anchors`, () => {
      const input = `https://github.com/wouterverweirder/#a=test&b=hello world&c=hello%20devine`;
      const expectedOutput = `https://github.com/wouterverweirder/`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
    it(`works with querystrings and anchors`, () => {
      const input = `https://github.com/wouterverweirder/?a=test&b=hello world&c=hello%20devine#a=test&b=hello world&c=hello%20devine`;
      const expectedOutput = `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine`;
      expect(fsUtils.getPathWithProtocol(input)).toBe(expectedOutput);
    });
  });

  describe(`getBasename`, () => {
    it(`works with a local path without file:// prefix`, () => {
      const input = `/Users/wouter/Desktop/test.html`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`url encodes spaces in the path name`, () => {
      const input = `/Users/wouter/Desktop/test file with spaces.html`;
      const expectedOutput = `test%20file%20with%20spaces.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`does not url encodes a path name twice`, () => {
      const input = `/Users/wouter/Desktop/test%20file%20with%20spaces.html`;
      const expectedOutput = `test%20file%20with%20spaces.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`works with file:// files`, () => {
      const input = `file:///Users/wouter/Desktop/test.html`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`works with a relative path`, () => {
      const input = `./examples/tests/fs_utils/download_file/photo.jpg`;
      const expectedOutput = `photo.jpg`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`works with http:// files`, () => {
      const input = `http://github.com/wouterverweirder/test.html`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`works with https:// files`, () => {
      const input = `https://github.com/wouterverweirder/test.html`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`strips querystrings`, () => {
      const input = `https://github.com/wouterverweirder/test.html?a=test&b=hello world&c=hello%20devine`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`strips anchors`, () => {
      const input = `https://github.com/wouterverweirder/test.html#a=test&b=hello world&c=hello%20devine`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
    it(`strips querystrings and anchors`, () => {
      const input = `https://github.com/wouterverweirder/test.html?a=test&b=hello world&c=hello%20devine#a=test&b=hello world&c=hello%20devine`;
      const expectedOutput = `test.html`;
      expect(fsUtils.getBasename(input)).toBe(expectedOutput);
    });
  });

  describe(`getSanitizedLocalPath`, () => {
    it(`doesn't affect a valid path`, () => {
      const input = `/Users/wouter/Desktop/test.html`;
      const expectedOutput = `/Users/wouter/Desktop/test.html`;
      expect(fsUtils.getSanitizedLocalPath(input)).toBe(expectedOutput);
    });
    it(`resolves a relative path to an absolute path`, () => {
      const input = `./examples`;
      const expectedOutput = path.resolve(projectRoot, `examples`);
      expect(fsUtils.getSanitizedLocalPath(input)).toBe(expectedOutput);
    });
    it(`strips file:/// prefix`, () => {
      const input = `file:///Users/wouter/Desktop/test.html`;
      const expectedOutput = `/Users/wouter/Desktop/test.html`;
      expect(fsUtils.getSanitizedLocalPath(input)).toBe(expectedOutput);
    });
    it(`urldecodes the input`, () => {
      const input = `/Users/wouter/Desktop/this%20is/a%20test.html`;
      const expectedOutput = `/Users/wouter/Desktop/this is/a test.html`;
      expect(fsUtils.getSanitizedLocalPath(input)).toBe(expectedOutput);
    });
    it(`strips querystrings`, () => {
      const input = `/Users/wouter/Desktop/test.html?hello=world&how=are&you`;
      const expectedOutput = `/Users/wouter/Desktop/test.html`;
      expect(fsUtils.getSanitizedLocalPath(input)).toBe(expectedOutput);
    });
    it(`strips anchors`, () => {
      const input = `/Users/wouter/Desktop/test.html#hello=world&how=are&you`;
      const expectedOutput = `/Users/wouter/Desktop/test.html`;
      expect(fsUtils.getSanitizedLocalPath(input)).toBe(expectedOutput);
    });
  });
  describe(`getLocalFolderPathForResource`, () => {
    it(`throws an error when called without parameters`, () => {
      expect(() => fsUtils.getLocalFolderPathForResource()).toThrow();
    });
    it(`throws an error when called with one parameter`, () => {
      expect(() => fsUtils.getLocalFolderPathForResource(1)).toThrow();
    });
    it(`throws an error when the 2 parameters aren't the correct type`, () => {
      expect(() => fsUtils.getLocalFolderPathForResource(1, 2)).toThrow();
      expect(() => fsUtils.getLocalFolderPathForResource(``, 2)).toThrow();
      expect(() => fsUtils.getLocalFolderPathForResource(2, ``)).toThrow();
      expect(() => fsUtils.getLocalFolderPathForResource({}, ``)).toThrow();
      expect(() => fsUtils.getLocalFolderPathForResource({url: 2}, ``)).toThrow();
    });
    it(`throws an error when url has no protocol`, () => {
      expect(() => fsUtils.getLocalFolderPathForResource({url: `/Users/wouter/Desktop/test.html`}, ``)).toThrow();
    });
    it(`works with local paths with protocol`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `file:///Users/wouter/Desktop/test.html`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/Users/wouter/Desktop/test.html/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when context has a trailing slash`, () => {
      const context = `/Users/wouter/Desktop/output/`;
      const input = {
        url: `file:///Users/wouter/Desktop/test.html`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/Users/wouter/Desktop/test.html/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when local path has an extension`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `file:///Users/wouter/Desktop/test.html`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/Users/wouter/Desktop/test.html/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when local path has no extension`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `file:///Users/wouter/Desktop/test`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/Users/wouter/Desktop/test/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when url has an extension`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder.html`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder.html/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when url has no extension`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder/`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when url has a port number`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `http://localhost:3000/hello/world`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/localhost/3000/hello/world/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works when url has url encoded content`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder/hello%20devine/how/are%20you`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder/hello devine/how/are you/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with a querystring (with extension)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder.html?a=test&b=hello%20world&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder.html/__QUERYSTRING__/a/test/b/hello world/c/hello devine/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with a querystring (non-alphabetical parameters)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder.html?b=hello%20world&a=test&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder.html/__QUERYSTRING__/a/test/b/hello world/c/hello devine/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with an anchor (with extension)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder.html#a=test&b=hello%20world&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder.html/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with a querystring and an anchor (with extension)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder.html?a=test&b=hello%20world&c=hello%20devine#a=test&b=hello%20world&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder.html/__QUERYSTRING__/a/test/b/hello world/c/hello devine/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with a querystring (no extension)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder/__QUERYSTRING__/a/test/b/hello world/c/hello devine/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with an anchor (no extension)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder/#a=test&b=hello%20world&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
    it(`works with a querystring and an anchor (no extension)`, () => {
      const context = `/Users/wouter/Desktop/output`;
      const input = {
        url: `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine#a=test&b=hello%20world&c=hello%20devine`
      };
      const expectedOutput = `/Users/wouter/Desktop/output/github.com/wouterverweirder/__QUERYSTRING__/a/test/b/hello world/c/hello devine/__META__/`;
      expect(fsUtils.getLocalFolderPathForResource(input, context)).toBe(expectedOutput);
    });
  });
  describe(`getHtmlFilesFromDirectory`, () => {
    it(`returns the .html and .htm files from a given directory`, () => {
      const path = require(`path`);
      const input = path.resolve(fsUtilsTestFolder, `get_html_files_from_directory`);
      const expectedOutput = [
        `file://${path.resolve(input, `hello.htm`)}`,
        `file://${path.resolve(input, `subdir_1/is.html`)}`,
        `file://${path.resolve(input, `subdir_1/me.html`)}`,
        `file://${path.resolve(input, `subdir_1/subdir_1_2/are.htm`)}`,
        `file://${path.resolve(input, `subdir_1/subdir_1_2/how.html`)}`,
        `file://${path.resolve(input, `subdir_1/this.htm`)}`,
        `file://${path.resolve(input, `subdir_2/with%20spaces.html`)}`,
        `file://${path.resolve(input, `subdir_2/you.html`)}`,
        `file://${path.resolve(input, `world.html`)}`,
      ];
      return fsUtils.getHtmlFilesFromDirectory(input)
      .then(result => {
        expect(result).toEqual(expectedOutput);
        // output.forEach(htmlPath => expect(result).toContain(htmlPath));
      });
    });
  });
  describe(`getUrlsFromList`, () => {
    it(`returns an array with unique urls`, () => {
      const path = require(`path`);
      const input = path.resolve(fsUtilsTestFolder, `get_urls_from_list`, `urls.txt`);
      const expectedOutput = [
        `https://github.com/wouterverweirder/`,
        `file:///Users/wouter/Desktop/hello.html`,
        `file:///Users/wouter/Desktop/world.html`,
        `https://github.com/wouterverweirder/hello%20devine/how/are%20you`,
        `https://github.com/wouterverweirder/this/has%20spaces`,
        `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine`
      ];
      return fsUtils.getUrlsFromList(input)
      .then(result => {
        expect(result).toEqual(expectedOutput);
      });
    });
  });
  describe(`getFullUrl`, () => {
    it(`works for local files, without protocol in base`, () => {
      const inputBase = `/Users/wouter/Desktop/`,
        inputRelativePath = `css/style.css`;
      const expectedOutput = `file:///Users/wouter/Desktop/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for local files, trailing slash on base`, () => {
      const inputBase = `file:///Users/wouter/Desktop/`,
        inputRelativePath = `css/style.css`;
      const expectedOutput = `file:///Users/wouter/Desktop/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for local files, ending with file + extension`, () => {
      const inputBase = `file:///Users/wouter/Desktop/index.html`,
        inputRelativePath = `css/style.css`;
      const expectedOutput = `file:///Users/wouter/Desktop/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for local files, traversing up and trailing slash on base`, () => {
      const inputBase = `file:///Users/wouter/Desktop/`,
        inputRelativePath = `../css/style.css`;
      const expectedOutput = `file:///Users/wouter/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for local files, traversing up and ending with file + extension`, () => {
      const inputBase = `file:///Users/wouter/Desktop/index.html`,
        inputRelativePath = `../css/style.css`;
      const expectedOutput = `file:///Users/wouter/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for remote http files, trailing slash on base`, () => {
      const inputBase = `https://github.com/wouterverweirder/`,
        inputRelativePath = `css/style.css`;
      const expectedOutput = `https://github.com/wouterverweirder/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for remote http files, ending with file + extension`, () => {
      const inputBase = `https://github.com/wouterverweirder/index.html`,
        inputRelativePath = `css/style.css`;
      const expectedOutput = `https://github.com/wouterverweirder/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for remote http files, traversing up and trailing slash on base`, () => {
      const inputBase = `https://github.com/wouterverweirder/`,
        inputRelativePath = `../css/style.css`;
      const expectedOutput = `https://github.com/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works for remote http files, traversing up and ending with file + extension`, () => {
      const inputBase = `https://github.com/wouterverweirder/index.html`,
        inputRelativePath = `../css/style.css`;
      const expectedOutput = `https://github.com/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
    it(`works when both base and relativePath are a full url`, () => {
      const inputBase = `https://github.com/wouterverweirder/index.html`,
        inputRelativePath = `https://github.com/css/style.css`;
      const expectedOutput = `https://github.com/css/style.css`;
      expect(fsUtils.getFullUrl(inputBase, inputRelativePath)).toEqual(expectedOutput);
    });
  });
  describe(`getRelativeUrl`, () => {
    it(`works from trailing slash to a subfile`, () => {
      expect(fsUtils.getRelativeUrl(`file:///Users/wouter/`, `file:///Users/wouter/css/style.css`)).toBe(`css/style.css`);
    });
    it(`works from trailing slash to a parent file`, () => {
      expect(fsUtils.getRelativeUrl(`file:///Users/wouter/`, `file:///Users/css/style.css`)).toBe(`../css/style.css`);
    });
    it(`works from non trailing slash a subfile`, () => {
      expect(fsUtils.getRelativeUrl(`file:///Users/wouter`, `file:///Users/wouter/css/style.css`)).toBe(`css/style.css`);
    });
    it(`works from trailing slash to a subfile`, () => {
      expect(fsUtils.getRelativeUrl(`http://bump-festival.be/`, `http://bump-festival.be/css/style.css`)).toBe(`css/style.css`);
    });
    it(`works from non trailing slash a subfile`, () => {
      expect(fsUtils.getRelativeUrl(`http://bump-festival.be`, `http://bump-festival.be/css/style.css`)).toBe(`css/style.css`);
    });
    it(`sets the relative url to an absolute path if on other domain`, () => {
      expect(fsUtils.getRelativeUrl(`http://bump-festival.be`, `http://fonts.gstatic.com/s/roboto/`)).toBe(`http://fonts.gstatic.com/s/roboto/`);
    });
  });
  describe(`downloadFile`, () => {
    const tmpFolder = path.resolve(fsUtilsTestFolder, `tmp`);
    beforeEach(() => {
      return fsUtils.mkdirpPromised(tmpFolder);
    });
    afterEach(() => {
      return fsUtils.rimrafPromised(tmpFolder);
    });
    describe(`local files`, () => {
      it(`rejects when specifying a file which doesn't exist`, () => {
        const inputFile = path.resolve(fsUtilsTestFolder, `download_file`, `this`, `file`, `does`, `not`, `exist`);
        const outputFile = path.resolve(tmpFolder, `textfile.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .catch(e => expect(e).toBe(`file not found`));
      });
      it(`downloads the contents of a normal text file`, () => {
        const inputFile = path.resolve(fsUtilsTestFolder, `download_file`, `textfile.txt`);
        const outputFile = path.resolve(tmpFolder, `textfile.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file\n`);
          });
        });
      });
      it(`downloads the contents of a normal text file (file:// urls)`, () => {
        const inputFile = fsUtils.getPathWithProtocol(path.resolve(fsUtilsTestFolder, `download_file`, `textfile.txt`));
        const outputFile = fsUtils.getPathWithProtocol(path.resolve(tmpFolder, `textfile.txt`));
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file\n`);
          });
        });
      });
      it(`downloads the contents of a text file with spaces in the file name`, () => {
        const inputFile = path.resolve(fsUtilsTestFolder, `download_file`, `text file with spaces.txt`);
        const outputFile = path.resolve(tmpFolder, `text file with spaces.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file with spaces\n`);
          });
        });
      });
      it(`downloads the contents of a text file with spaces in the file name (file:// urls)`, () => {
        const inputFile = fsUtils.getPathWithProtocol(path.resolve(fsUtilsTestFolder, `download_file`, `text file with spaces.txt`));
        const outputFile = fsUtils.getPathWithProtocol(path.resolve(tmpFolder, `text file with spaces.txt`));
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file with spaces\n`);
          });
        });
      });
      it(`downloads the contents of an image file`, () => {
        const inputFile = path.resolve(fsUtilsTestFolder, `download_file`, `photo.jpg`);
        const outputFile = path.resolve(tmpFolder, `photo.jpg`);
        return fsUtils.downloadFile(inputFile, outputFile)
        .then(() => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
          });
        });
      });
      it(`downloads files over https`, () => {
        const inputFile = `https://github.com/wouterverweirder`;
        const outputFile = path.resolve(tmpFolder, `wouterverweirder.html`);
        return fsUtils.downloadFile(inputFile, outputFile)
        .then(() => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
          });
        });
      });
    });
    describe(`https file`, () => {
      it(`downloads a file over https`, () => {
        const inputFile = `https://howest.be/css/styles.css`;
        const outputFile = path.resolve(tmpFolder, `styles.css`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(() => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
          });
        });
      });
    });
    describe(`local http projects`, () => {
      //start a local http server
      //start a local http server
      const httpServer = createServer({
        root: fsUtilsTestFolder
      });
      beforeAll(() => {
        return httpServer.listen(httpServerPort);
      });
      afterAll(() => {
        return httpServer.close();
      });
      it(`rejects when specifying a file which doesn't exist`, () => {
        const inputFile = `http://localhost:${httpServerPort}/download_file/this/file/does/not/exist`;
        const outputFile = path.resolve(tmpFolder, `textfile.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .catch(e => expect(e).toBe(`file not found`));
      });
      it(`downloads the contents of a normal text file`, () => {
        const inputFile = `http://localhost:${httpServerPort}/download_file/textfile.txt`;
        const outputFile = path.resolve(tmpFolder, `textfile.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file\n`);
          });
        });
      });
      it(`downloads the contents of a text file with spaces in the file name`, () => {
        const inputFile = `http://localhost:${httpServerPort}/download_file/text file with spaces.txt`;
        const outputFile = path.resolve(tmpFolder, `text file with spaces.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file with spaces\n`);
          });
        });
      });
      it(`downloads the contents of a text file with spaces in the file name (urlencoded)`, () => {
        const inputFile = `http://localhost:${httpServerPort}/download_file/text%20file%20with%20spaces.txt`;
        const outputFile = path.resolve(tmpFolder, `text file with spaces.txt`);
        return fsUtils.downloadFile(inputFile, outputFile, `utf-8`)
        .then(fileContents => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
            expect(fileContents).toBe(`This is a text file with spaces\n`);
          });
        });
      });
      it(`downloads the contents of an image file`, () => {
        const inputFile = `http://localhost:${httpServerPort}/download_file/photo.jpg`;
        const outputFile = path.resolve(tmpFolder, `photo.jpg`);
        return fsUtils.downloadFile(inputFile, outputFile)
        .then(() => {
          return fsUtils.statPromised(outputFile).then(stats => {
            expect(stats.isFile()).toBe(true);
          });
        });
      });
    });
  });
});
