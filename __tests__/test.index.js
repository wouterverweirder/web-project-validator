'use strict';

const path = require(`path`);
const projectRoot = path.resolve(__dirname, `..`);
const testsAssetsFolder = path.resolve(projectRoot, `examples`, `tests`);

describe(`lib index test`, () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; //eslint-disable-line
  describe(`getReportTypeForInputPath`, () => {
    const path = require(`path`);
    const testFolder = path.resolve(testsAssetsFolder, `index`, `get_report_input_type`);
    it(`throws an error when local file / folder does not exist`, () => {
      return require(`../lib`).getReportTypeForInputPath(path.resolve(testFolder, `does-not-exist`))
      .catch(e => {
        expect(e).toBe(`specified path does not exist`);
      });
    });
    it(`returns file for the path to a local html file (no file:// prefix)`, () => {
      return require(`../lib`).getReportTypeForInputPath(path.resolve(testFolder, `hello.html`))
      .then(result => {
        expect(result).toBe(`file`);
      });
    });
    it(`returns file for the path to a local html file (with file:// prefix)`, () => {
      return require(`../lib`).getReportTypeForInputPath(`file://${path.resolve(testFolder, `hello.html`)}`)
      .then(result => {
        expect(result).toBe(`file`);
      });
    });
    it(`returns folder for the path to a local folder (no file:// prefix)`, () => {
      return require(`../lib`).getReportTypeForInputPath(testFolder)
      .then(result => {
        expect(result).toBe(`folder`);
      });
    });
    it(`returns folder for the path to a local folder (with file:// prefix)`, () => {
      return require(`../lib`).getReportTypeForInputPath(`file://${testFolder}`)
      .then(result => {
        expect(result).toBe(`folder`);
      });
    });
    it(`returns list for the path to a local url list (no file:// prefix)`, () => {
      return require(`../lib`).getReportTypeForInputPath(path.resolve(testFolder, `urls.txt`))
      .then(result => {
        expect(result).toBe(`list`);
      });
    });
    it(`returns list for the path to a local url list (with file:// prefix)`, () => {
      return require(`../lib`).getReportTypeForInputPath(`file://${path.resolve(testFolder, `urls.txt`)}`)
      .then(result => {
        expect(result).toBe(`list`);
      });
    });
    it(`returns url for the http path to a remote url`, () => {
      return require(`../lib`).getReportTypeForInputPath(`https://github.com/wouterverweirder`)
      .then(result => {
        expect(result).toBe(`url`);
      });
    });
  });
  describe(`getUrlFilesInFolder`, () => {
    const path = require(`path`);
    const testFolder = path.resolve(testsAssetsFolder, `index`, `get_url_files_in_folder`);
    it(`contains a list of files which contain a url / shortcut to an online project`, () => {
      return require(`../lib`).getUrlFilesInFolder(testFolder)
        .then(result => {
          const expectedOutput = [
            `file://${path.resolve(testFolder, `link.rtfd`)}`,
            `file://${path.resolve(testFolder, `url.rtfd`)}`,
            `file://${path.resolve(testFolder, `bplist.webloc`)}`,
            `file://${path.resolve(testFolder, `link.md`)}`,
            `file://${path.resolve(testFolder, `link.rtf`)}`,
            `file://${path.resolve(testFolder, `link.txt`)}`,
            `file://${path.resolve(testFolder, `url.md`)}`,
            `file://${path.resolve(testFolder, `no-extension-webloc`)}`,
            `file://${path.resolve(testFolder, `url.rtf`)}`,
            `file://${path.resolve(testFolder, `url.txt`)}`,
            `file://${path.resolve(testFolder, `webloc.webloc`)}`
          ];
          expect(result.sort()).toEqual(expectedOutput.sort());
        });
    });
  });
  // describe(`getUrlsForProjectPath`, () => {
  //   const path = require(`path`);
  //   const testFolder = path.resolve(testsAssetsFolder, `index`, `get_urls_for_input_path`);
  //   it(`result is an array containing just one file for the path to a local html file`, () => {
  //     return require(`../lib`).getUrlsForProjectPath(path.resolve(testFolder, `hello.htm`))
  //     .then(result => {
  //       const expectedOutput = [
  //         `file://${path.resolve(testFolder, `hello.htm`)}`
  //       ];
  //       expect(result).toEqual(expectedOutput);
  //     });
  //   });
  //   it(`result is an array containing all html file paths for the path to a local folder`, () => {
  //     return require(`../lib`).getUrlsForProjectPath(testFolder)
  //     .then(result => {
  //       const expectedOutput = [
  //         `file://${path.resolve(testFolder, `hello.htm`)}`,
  //         `file://${path.resolve(testFolder, `subdir_1/is.html`)}`,
  //         `file://${path.resolve(testFolder, `subdir_1/me.html`)}`,
  //         `file://${path.resolve(testFolder, `subdir_1/subdir_1_2/are.htm`)}`,
  //         `file://${path.resolve(testFolder, `subdir_1/subdir_1_2/how.html`)}`,
  //         `file://${path.resolve(testFolder, `subdir_1/this.htm`)}`,
  //         `file://${path.resolve(testFolder, `subdir_2/with%20spaces.html`)}`,
  //         `file://${path.resolve(testFolder, `subdir_2/you.html`)}`,
  //         `file://${path.resolve(testFolder, `world.html`)}`,
  //       ];
  //       expect(result).toEqual(expectedOutput);
  //     });
  //   });
  //   it(`result is an array containing the listed paths for the path to a local url list`, () => {
  //     return require(`../lib`).getUrlsForProjectPath(path.resolve(testFolder, `urls.txt`))
  //     .then(result => {
  //       const expectedOutput = [
  //         `https://github.com/wouterverweirder/`,
  //         `file:///Users/wouter/Desktop/hello.html`,
  //         `file:///Users/wouter/Desktop/world.html`,
  //         `https://github.com/wouterverweirder/hello%20devine/how/are%20you`,
  //         `https://github.com/wouterverweirder/this/has%20spaces`,
  //         `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine`
  //       ];
  //       expect(result).toEqual(expectedOutput);
  //     });
  //   });
  //   it(`result is an array containing just one url for the http path to a remote url`, () => {
  //     return require(`../lib`).getUrlsForProjectPath(`https://github.com/wouterverweirder`)
  //     .then(result => {
  //       const expectedOutput = [
  //         `https://github.com/wouterverweirder`
  //       ];
  //       expect(result).toEqual(expectedOutput);
  //     });
  //   });
  // });
  describe(`setReportPropertiesBasedOnInputPath`, () => {
    const path = require(`path`);
    const testFolder = path.resolve(testsAssetsFolder, `index`, `set_report_properties_based_on_input_path`);
    it(`throws an error when local file / folder does not exist`, () => {
      const testFolder = path.resolve(testsAssetsFolder, `index`, `get_report_input_type`);
      return require(`../lib`).setReportPropertiesBasedOnInputPath({}, path.resolve(testFolder, `does-not-exist`))
      .catch(e => {
        expect(e).toBe(`specified path does not exist`);
      });
    });
    describe(`setting the correct type`, () => {
      it(`sets the type to file for the path to a local html file`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, path.resolve(testFolder, `hello.htm`))
        .then(result => {
          expect(result.type).toBe(`file`);
        });
      });
      it(`sets the type to folder for the path to a local folder`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, testFolder)
        .then(result => {
          expect(result.type).toBe(`folder`);
        });
      });
      it(`sets the type to list for the path to a local url list`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, path.resolve(testFolder, `urls.txt`))
        .then(result => {
          expect(result.type).toBe(`list`);
        });
      });
      it(`sets the type to url for the http path to a remote url`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, `https://github.com/wouterverweirder`)
        .then(result => {
          expect(result.type).toBe(`url`);
        });
      });
    });
    describe(`setting the urls`, () => {
      it(`sets the report.urls property to an array containing just one file for the path to a local html file`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, path.resolve(testFolder, `hello.htm`))
        .then(result => {
          const expectedOutput = [
            `file://${path.resolve(testFolder, `hello.htm`)}`
          ];
          expect(result.urls).toEqual(expectedOutput);
        });
      });
      it(`sets the report.urls property to an array containing all html file paths for the path to a local folder`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, testFolder)
        .then(result => {
          const expectedOutput = [
            `file://${path.resolve(testFolder, `hello.htm`)}`,
            `file://${path.resolve(testFolder, `subdir_1/is.html`)}`,
            `file://${path.resolve(testFolder, `subdir_1/me.html`)}`,
            `file://${path.resolve(testFolder, `subdir_1/subdir_1_2/are.htm`)}`,
            `file://${path.resolve(testFolder, `subdir_1/subdir_1_2/how.html`)}`,
            `file://${path.resolve(testFolder, `subdir_1/this.htm`)}`,
            `file://${path.resolve(testFolder, `subdir_2/with%20spaces.html`)}`,
            `file://${path.resolve(testFolder, `subdir_2/you.html`)}`,
            `file://${path.resolve(testFolder, `world.html`)}`,
          ];
          expect(result.urls).toEqual(expectedOutput);
        });
      });
      it(`sets the report.urls property to an array containing the listed paths for the path to a local url list`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, path.resolve(testFolder, `urls.txt`))
        .then(result => {
          const expectedOutput = [
            `https://github.com/wouterverweirder/`,
            `file:///Users/wouter/Desktop/hello.html`,
            `file:///Users/wouter/Desktop/world.html`,
            `https://github.com/wouterverweirder/hello%20devine/how/are%20you/`,
            `https://github.com/wouterverweirder/this/has%20spaces/`,
            `https://github.com/wouterverweirder/?a=test&b=hello%20world&c=hello%20devine`
          ];
          expect(result.urls).toEqual(expectedOutput);
        });
      });
      it(`sets the report.urls property to an array containing just one url for the http path to a remote url`, () => {
        return require(`../lib`).setReportPropertiesBasedOnInputPath({}, `https://github.com/wouterverweirder`)
        .then(result => {
          const expectedOutput = [
            `https://github.com/wouterverweirder/`
          ];
          expect(result.urls).toEqual(expectedOutput);
        });
      });
    });
  });
  describe(`getResourcesByTypeIncludedByType`, () => {
    const inputPageReport = {
      resources: [
        {
          url: `first-resource`,
          type: false
        },
        {
          url: `second-resource`,
          type: `html`
        },
        {
          url: `third-resource`,
          type: `style`
        },
        {
          url: `fourth-resource`,
          type: `image`
        },
        {
          url: `fifth-resource`,
          type: `style`,
          includedFrom: []
        },
        {
          url: `sixth-resource`,
          type: false,
          includedFrom: [
            {url: `second-resource`}
          ]
        },
        {
          url: `seventh-resource`,
          type: `image`,
          includedFrom: [
            {url: `second-resource`}
          ]
        },
        {
          url: `eighth-resource`,
          type: `image`,
          includedFrom: [
            {url: `third-resource`}
          ]
        },
        {
          url: `ninth-resource`,
          type: `image`,
          includedFrom: [
            {url: `second-resource`},
            {url: `third-resource`}
          ]
        },
        {
          url: `tenth-resource`,
          type: `image`,
          includedFrom: [
            {url: `fifth-resource`}
          ]
        },
        {
          url: `eleventh-resource`,
          type: `image`,
          includedFrom: [
            {url: `second-resource`},
            {url: `fifth-resource`}
          ]
        },
        {
          url: `twelveth-resource`,
          type: `image`,
          includedFrom: [
            {url: `third-resource`},
            {url: `fifth-resource`}
          ]
        }
      ]
    };
    it(`gets all images from html files`, () => {
      const expectedOutput = [
        {
          url: `seventh-resource`,
          type: `image`,
          includedFrom: [
            {url: `second-resource`}
          ]
        },
        {
          url: `ninth-resource`,
          type: `image`,
          includedFrom: [
            {url: `second-resource`},
            {url: `third-resource`}
          ]
        },
        {
          url: `eleventh-resource`,
          type: `image`,
          includedFrom: [
            {url: `second-resource`},
            {url: `fifth-resource`}
          ]
        }
      ];
      const output = require(`../lib`).getResourcesByTypeIncludedByType(inputPageReport, `image`, `html`);
      expect(output).toEqual(expectedOutput);
    });
  });
  describe(`buildReport`, () => {
    const path = require(`path`);
    const testFolder = path.resolve(testsAssetsFolder, `index`, `build_report`);
    beforeAll(() => {
      jest.mock(`../lib/phantom_processor`, () => {
        return {
          buildReport: jest.fn((...rest) => {
            // console.log(`phantom_processor.buildReport mock`);
            // console.log(rest);
            return Promise.resolve();
          })
        };
      });
    });
    afterAll(() => {
      jest.resetModules();
    });
    describe(`single local file`, () => {
      const inputPath = path.resolve(testFolder, `single_local_file`, `index.html`);
      let outputReport = false;
      beforeAll(() => {
        return require(`../lib`).buildReport(inputPath)
        .then(report => outputReport = report);
      });
      it(`sets the result type to file`, () => {
        expect(outputReport.type).toBe(`file`);
      });
      it(`sets the urls to an array with this file ref`, () => {
        const expectedOutput = [
          `file://${path.resolve(testFolder, `single_local_file`, `index.html`)}`
        ];
        expect(outputReport.urls).toEqual(expectedOutput);
      });
      it(`sets the localReportPath.folder`, () => {
        expect(outputReport.localReportPath.folder).toBe(path.resolve(projectRoot, `output`));
      });
      it(`sets the localReportPath.folder for the child report`, () => {
        const childReport = outputReport.reportsByUrl[outputReport.urls[0]];
        expect(childReport.localReportPath.folder).toBe(`${path.resolve(projectRoot, `output`)}${inputPath}/__META__/`);
      });
      it(`called into the phantom processor`, () => {
        const phantomProcessor = require(`../lib/phantom_processor`);
        expect(phantomProcessor.buildReport.mock.calls.length).toBe(1);
      });
    });
  });
});
