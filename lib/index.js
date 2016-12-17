'use strict';

const fsUtils = require(`./fs_utils`);

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

const getResourceByUrlFromDictionary = (dictionary, resourceUrl, createIfNotExists = true) => {
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
  pageReport.resources.forEach(resource => resourcesByUrl[resource.url] = resource);
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
    const resource = getResourceByUrlFromDictionary(resourcesByUrl, resourceUrl, false);
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
  return new Promise((resolve, reject) => {
    getReportTypeForInputPath(inputPath)
    .then(type => report.type = type)
    .then(() => getUrlsForInputPath(inputPath, report.type))
    .then(urls => report.urls = urls)
    .then(() => resolve(report))
    .catch(e => reject(e));
  });
};

const setReportPropertiesBasedOnReportUrls = report => {
  if (!report.urls || report.urls.length === 0) {
    throw `no urls set to process`;
  }
  report.urls = report.urls.map(url => fsUtils.getPathWithProtocol(url));
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
      report.reportsByUrl[url].localReportPath.folder = fsUtils.getLocalFolderPathForResource(report.reportsByUrl[url], report.localReportPath.folder);
    }
    if (!report.reportsByUrl[url].resources) {
      report.reportsByUrl[url].resources = [];
    }
    if (!report.reportsByUrl[url].resourcesByUrl) {
      report.reportsByUrl[url].resourcesByUrl = {};
    }
  });
};

const getUrlsForInputPath = (inputPath, inputType = false) => {
  let seq = Promise.resolve();
  if (!inputType) {
    seq = seq.then(() => getReportTypeForInputPath(inputPath));
  } else {
    seq = seq.then(() => inputType);
  }
  seq = seq
  .then(inputType => {
    if (inputType === `list`) {
      return fsUtils.getUrlsFromList(inputPath);
    } else if (inputType === `folder`) {
      return fsUtils.getHtmlFilesFromDirectory(inputPath);
    }
    return [fsUtils.getPathWithProtocol(inputPath)];
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
  getUrlsForInputPath,
  renderReport,
  setReportPropertiesBasedOnInputPath,
  setReportPropertiesBasedOnReportUrls,
  updateResourcesListAndMap
};
