'use strict';

const
  path = require(`path`),
  glob = require(`glob`),
  getUrls = require(`get-urls`),
  plist = require(`simple-plist`),
  fsUtils = require(`./fs_utils`);

const buildReport = (inputPath, argv = {}) => {
  const report = {};
  return Promise.resolve()
    .then(() => {
      if (!argv.outputFolder) {
        argv.outputFolder = `./output`;
      }
    })
    .then(() => {
      report.localReportPath = {};
      report.localReportPath.folder = require(`path`).resolve(argv.outputFolder);
    })
    .then(() => setReportPropertiesBasedOnInputPath(report, inputPath))
    .then(() => setReportPropertiesBasedOnReportUrls(report))
    .then(() => {
      // console.log(report);
      // process.exit();
    })
    .then(() => require(`./phantom_processor`).buildReport(report))
    .then(() => require(`./jsdom_processor`).buildReport(report))
    .then(() => require(`./html_validator`).stop())
    .then(() => {
      return report;
    });
};

const renderReport = report => {
  return require(`./render`).renderReport(report);
};

const getResourceByUrlFromDictionary = (dictionary, resourceUrl,
  createIfNotExists = true) => {
  resourceUrl = fsUtils.getPathWithProtocol(resourceUrl);
  let resource = dictionary[resourceUrl];
  if (!resource) {
    if (!createIfNotExists) {
      return false;
    }
    resource = createBasicResourceObject(resourceUrl);
    dictionary[resourceUrl] = resource;
  }
  return resource;
};

const getResourcesByType = (pageReport, type) => {
  return pageReport.resources.filter(resource => resource.type === type);
};

const getResourcesByTypeIncludedByType = (pageReport, resourceType, includeType) => {
  const resourcesByUrl = {};
  pageReport.resources.forEach(resource => resourcesByUrl[resource.url] =
    resource);
  return pageReport.resources.filter(resource => {
    if (resource.type !== resourceType) {
      return false;
    }
    if (!resource.includedFrom) {
      return false;
    }
    let resourceIsOk = false;
    resource.includedFrom.forEach(includeFrom => {
      if (resourceIsOk) {
        return;
      }
      const includingResource = resourcesByUrl[includeFrom.url];
      if (!includingResource) {
        return;
      }
      if (includingResource.type === includeType) {
        resourceIsOk = true;
      }
    });
    return resourceIsOk;
  });
};

const updateResourcesListAndMap = (report, url) => {
  addResourcesByUrlToResourcesList(report, url);
  addResourcesFromListToMap(report, url);
};

const addResourcesByUrlToResourcesList = (report, url) => {
  const resourcesByUrl = report.reportsByUrl[url].resourcesByUrl;
  const resourceUrls = Object.keys(resourcesByUrl);
  resourceUrls.forEach(resourceUrl => {
    const resource = getResourceByUrlFromDictionary(resourcesByUrl,
      resourceUrl, false);
    if (report.reportsByUrl[url].resources.indexOf(resource) === - 1) {
      report.reportsByUrl[url].resources.push(resource);
    }
  });
};

const addResourcesFromListToMap = (report, url) => {
  const resourcesByUrl = report.reportsByUrl[url].resourcesByUrl;
  report.reportsByUrl[url].resources.forEach(resource => {
    if (!resourcesByUrl[resource.url]) {
      resourcesByUrl[resource.url] = resource;
    }
  });
};

const createBasicResourceObject = resourceUrl => {
  return {
    url: resourceUrl,
    error: false,
    type: false,
    localReportPath: {
      folder: false
    },
    includedFrom: []
  };
};

const setReportPropertiesBasedOnInputPath = (report, inputPath) => {
  if (!report.urls) {
    report.urls = [];
  }
  if (!report.reportsByUrl) {
    report.reportsByUrl = {};
  }
  return new Promise((resolve, reject) => {
    getReportTypeForInputPath(inputPath)
      .then(type => report.type = type)
      .then(() => getProjectsForInputPath(inputPath, report.type))
      .then(projects => {
        projects.forEach(project => {
          report.urls.push(project.url);
          report.reportsByUrl[project.url] = project;
        });
      })
      .then(() => resolve(report))
      .catch(e => reject(e));
  });
};

const setReportPropertiesBasedOnReportUrls = report => {
  if (!report.urls || report.urls.length === 0) {
    throw `no urls set to process`;
  }
  if (!report.reportsByUrl) {
    report.reportsByUrl = {};
  }
  report.urls.forEach(url => {
    if (!report.reportsByUrl[url]) {
      report.reportsByUrl[url] = {};
    }
    if (!report.reportsByUrl[url].url) {
      report.reportsByUrl[url].url = url;
    }
    if (!report.reportsByUrl[url].localReportPath) {
      report.reportsByUrl[url].localReportPath = {};
    }
    if (!report.reportsByUrl[url].localReportPath.folder) {
      report.reportsByUrl[url].localReportPath.folder = fsUtils.getLocalFolderPathForResource(
        report.reportsByUrl[url], report.localReportPath.folder);
    }
    if (!report.reportsByUrl[url].resources) {
      report.reportsByUrl[url].resources = [];
    }
    if (!report.reportsByUrl[url].resourcesByUrl) {
      report.reportsByUrl[url].resourcesByUrl = {};
    }
  });
};

const getGlob = (inputFolder, type) => {
  switch (type) {
  case `package.json`:
    return `${inputFolder}/**/package.json`;
  case `url`:
    return `${inputFolder}/**/{url,link,github,git}.{txt,md,rtf,rtfd}`;
  case `webloc`:
    return `${inputFolder}/**/*.webloc`;
  case `gitConfig`:
    return `${inputFolder}/**/.git/config`;
  case `html`:
    return `${inputFolder}/**/*@(.htm|.html)`;
  case `.git`:
    return `${inputFolder}/**/.git`;
  }
  throw new Error(`Unknown glob type: ${type}`);
};

const globPromised = (pattern, options = null) => {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
};

const findByKind = (kind, directoryPath) => {
  return new Promise(resolve => {
    const {
      exec
    } = require(`child_process`);
    exec(`mdfind 'kMDItemKind="${kind}"' -onlyin '${directoryPath}'`, (
      error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return resolve([]);
      }
      resolve(stdout
        .split(`\n`)
        .filter(line => line.length > 0)
      );
    });
  });
};

const getMetaDataForProjectPaths = projectPaths => {
  return Promise.all(projectPaths.map(projectPath =>
    getMetaDataForProjectPath(projectPath)));
};

const getMetaDataForProjectPath = projectPath => {
  const globOptions = {
    ignore: `${projectPath}/**/node_modules/**`,
    nocase: true
  };
  const metaData = {
    projectPath
  };
  return Promise.resolve()
    .then(() => globPromised(getGlob(projectPath, `package.json`),
      globOptions))
    .then(files => {
      if (files.length > 0) {
        metaData[`package.json`] = files[0];
      }
    })
    .then(() => getUrlsForProjectPath(projectPath))
    .then(urls => metaData.urls = urls)
    .then(() => {
      metaData.urls.forEach(url => {
        const domain = fsUtils.getUrlDomain(url);
        if (domain === `github.com`) {
          metaData.github = url;
        } else if (domain === `youtu.be` || domain === `git.heroku.com` ||
          domain.indexOf(`pinterest.com`) > - 1 || domain.indexOf(`pin.it`) > - 1 || domain ===
          `w3.org`) {
          // ignore
        } else {
          if (!metaData.online) {
            metaData.online = url;
          }
        }
      });
    })
    .then(() => globPromised(getGlob(projectPath, `html`), globOptions))
    .then(files => metaData.htmls = files)
    .then(() => metaData);
};

const getUrlFilesInFolder = folderPath => {
  const globOptions = {
    ignore: `${folderPath}/**/node_modules/**`,
    nocase: true
  };
  let filePaths = [];
  return Promise.resolve()
    .then(() => globPromised(getGlob(folderPath, `url`), globOptions))
    .then(result => filePaths = filePaths.concat(result))
    .then(() => globPromised(getGlob(folderPath, `webloc`), globOptions))
    .then(result => filePaths = filePaths.concat(result))
    .then(() => globPromised(getGlob(folderPath, `gitConfig`), globOptions))
    .then(result => filePaths = filePaths.concat(result))
    .then(() => findByKind(`Web internet location`, folderPath))
    .then(result => filePaths = filePaths.concat(result))
    .then(() => filePaths = filePaths.map(filePath => fsUtils.getPathWithProtocol(filePath)))
    .then(() => Array.from(new Set(filePaths)));
};

const getUrlsForProjectPath = projectPath => {
  let urls = [];
  return Promise.resolve()
    .then(() => getUrlFilesInFolder(projectPath))
    .then(filePaths => getUrlsFromUrlFiles(filePaths))
    .then(getUrlsFromUrlFilesResult => urls = urls.concat(getUrlsFromUrlFilesResult))
    .then(() => {
      urls = urls
        .map(url => {
          // remove .git suffix for github urls
          const domain = fsUtils.getUrlDomain(url);
          if (domain === `github.com`) {
            if (url.endsWith(`/info/lfs`)) {
              url = url.substr(0, url.length - `/info/lfs`.length);
            }
            return url.replace(/\.[^/.]+$/, ``);
          }
          return url;
        })
        .filter(url => {
          return url !== `http://apple.com/DTDs/PropertyList-1.0.dtd`;
        });
    })
    .then(() => Array.from(new Set(urls)));
};

const getUrlsFromUrlFiles = (urlFilePaths, urls = []) => {
  return Promise.resolve()
    .then(() => Promise.all(urlFilePaths.map(filePath => getUrlsFromUrlFile(
      filePath))))
    .then(results => results.forEach(result => result.forEach(url => urls.push(
      url))))
    .then(() => urls);
};

const getUrlsFromUrlFile = urlFilePath => {
  // could be plain text, rich text or webloc
  // can contain multiple urls
  return new Promise(resolve => {
    // try to read as plist
    plist.readFile(fsUtils.getSanitizedLocalPath(urlFilePath), (err, data) => {
      if (!err) {
        resolve(Array.from(getUrls(JSON.stringify(data))));
      } else {
        fsUtils.loadFile(urlFilePath, `utf-8`)
          .catch(() => {
            // could be error because of rtfd file - try reading that
            return globPromised(`${urlFilePath}/**/*.rtf`)
              .then(files => {
                if (files.length > 0) {
                  return fsUtils.loadFile(files[0], `utf-8`);
                }
                throw `invalid file: ${urlFilePath}`;
              });
          })
          .then(contents => {
            // replace the { } < > characters from rtf files with spaces as they could accidently be added to the urls
            contents = contents.replace(/\{/gi, ` `);
            contents = contents.replace(/\}/gi, ` `);
            contents = contents.replace(/\</gi, ` `);
            contents = contents.replace(/\>/gi, ` `);
            resolve(Array.from(getUrls(contents)));
          });
      }
    });
  });
};

const getProjectFolders = inputFolder => {
  // get all folders which have at least a package.json, url, git subdir or html files
  let allFiles = [];
  const tree = {
    name: path.basename(inputFolder),
    currentPath: inputFolder,
    children: [],
    isProjectFolder: false,
  };
  const globOptions = {
    ignore: `${inputFolder}/**/node_modules/**`,
    nocase: true
  };
  return Promise.resolve()
    .then(() => globPromised(getGlob(inputFolder, `package.json`),
      globOptions))
    .then(files => allFiles = allFiles.concat(files.map(filePath => path.dirname(
      filePath))))
    .then(() => getUrlFilesInFolder(inputFolder))
    .then(files => allFiles = allFiles.concat(files.map(filePath => path.dirname(
      filePath))))
    .then(() => globPromised(getGlob(inputFolder, `html`), globOptions))
    .then(files => allFiles = allFiles.concat(files.map(filePath => path.dirname(
      filePath))))
    .then(() => globPromised(getGlob(inputFolder, `.git`), globOptions))
    .then(files => allFiles = allFiles.concat(files.map(filePath => path.dirname(
      filePath))))
    .then(() => {
      allFiles = Array.from(new Set(allFiles));
      allFiles = allFiles.map(filePath => fsUtils.getPathWithoutProtocol(filePath));
      allFiles.forEach(filePath => {
        if (filePath === inputFolder) {
          tree.isProjectFolder = true;
        }
        let currentLevel = tree.children;
        let currentPath = inputFolder;
        filePath
          .substr(inputFolder.length)
          .split(path.sep)
          .filter(value => value.length > 0)
          .forEach(value => {
            currentPath = path.resolve(currentPath, value);
            // find part  with this name
            const existingPart = currentLevel.find(o => o.name ===
              value);
            if (existingPart) {
              currentLevel = existingPart.children;
            } else {
              const newPart = {
                name: value,
                fullPath: currentPath,
                children: []
              };
              currentLevel.push(newPart);
              currentLevel = newPart.children;
            }
          });
      });
      if (tree.isProjectFolder) {
        return [inputFolder];
      }
      // return subfolders
      return tree.children
        // .filter(o => o.children.length > 0)
        .map(o => o.fullPath);
    });
};

const getProjectsForInputPath = (inputPath, inputType = false) => {
  let seq = Promise.resolve();
  if (!inputType) {
    seq = seq.then(() => getReportTypeForInputPath(inputPath));
  } else {
    seq = seq.then(() => inputType);
  }
  seq = seq
    .then(inputType => {
      if (inputType === `list`) {
        return fsUtils
          .getUrlsFromList(inputPath)
          .then(urls => urls.map(url => {
            return {
              url: fsUtils.getUrlWithTrailingSlashIfNeeded(fsUtils.getPathWithProtocol(
                url))
            };
          }));
      } else if (inputType === `folder`) {
        return getProjectFolders(inputPath)
          .then(projectPaths => getMetaDataForProjectPaths(projectPaths))
          .then(projectMetaDatas => {
            const projects = [];
            projectMetaDatas.forEach(projectMetaData => {
              if (projectMetaData.online) {
                projects.push({
                  url: fsUtils.getUrlWithTrailingSlashIfNeeded(
                    fsUtils.getPathWithProtocol(projectMetaData
                      .online)),
                  githubUrl: projectMetaData.github
                });
              } else {
                projectMetaData.htmls.forEach(htmlFile => {
                  projects.push({
                    url: fsUtils.getUrlWithTrailingSlashIfNeeded(
                      fsUtils.getPathWithProtocol(htmlFile)
                    )
                  });
                });
              }
            });
            return projects;
          });
      }
      const url = fsUtils.getUrlWithTrailingSlashIfNeeded(fsUtils.getPathWithProtocol(
        inputPath));
      return [{
        id: url,
        url
      }];
    });
  return seq;
};

/**
 * Checks a given input path / uri and returns the type for the report:
 * Types are: file, folder, url, list
 */
const getReportTypeForInputPath = inputPath => {
  return new Promise((resolve, reject) => {
    if (fsUtils.pathIsRemoteUrl(inputPath)) {
      return resolve(`url`);
    }
    const localPath = fsUtils.getPathWithoutProtocol(inputPath);
    fsUtils.statPromised(localPath)
      .then(stats => {
        if (stats.isDirectory()) {
          return resolve(`folder`);
        }
        const extname = require(`path`).extname(localPath);
        if (extname === `.htm` || extname === `.html`) {
          return resolve(`file`);
        }
        return resolve(`list`);
      })
      .catch(() => reject(`specified path does not exist`));
  });
};

module.exports = {
  buildReport,
  createBasicResourceObject,
  getResourceByUrlFromDictionary,
  getResourcesByType,
  getResourcesByTypeIncludedByType,
  getReportTypeForInputPath,
  getProjectsForInputPath,
  getUrlFilesInFolder,
  renderReport,
  setReportPropertiesBasedOnInputPath,
  setReportPropertiesBasedOnReportUrls,
  updateResourcesListAndMap
};
