'use strict';

const fsUtils = require(`./fs_utils`);

const processRequestedResources = (report, url) => {
  const pageReport = report.reportsByUrl[url];
  const resourcesByUrl = pageReport.resourcesByUrl;
  const resourceUrls = Object.keys(resourcesByUrl);
  let seq = Promise.resolve();
  resourceUrls.forEach(resourceUrl => seq = seq.then(() => processRequestedResource(report, url, resourcesByUrl[resourceUrl])));
  return seq.then(() => report);
};

const createResourcesReport = pageReport => {
  const resourcesReport = {
    numErrors: 0,
    numWarnings: 0,
    errors: [
    ],
    warnings: [
    ],
    resources: pageReport.resources
  };
  const fileNotFound = {
    outputType: `danger`,
    message: `file not found`,
    numMessages: 0,
    evidence: []
  };
  const invalidFileName = {
    outputType: `warning`,
    message: `invalid file name`,
    numMessages: 0,
    evidence: []
  };
  pageReport.resources.forEach(resource => {
    if (resource.error) {
      fileNotFound.evidence.push({
        url: resource.url,
        message: ``
      });
    }
    //validate name
    const isFileOnOtherDomain = fsUtils.pathIsRemoteUrl(resource.relativeUrl);
    if (!isFileOnOtherDomain) {
      const relativePath = fsUtils.getPathWithoutQueryString(fsUtils.getPathWithoutAnchor(resource.relativeUrl));
      const sanitized = relativePath.replace(/[^\w.:\/-]+/g, ``).toLowerCase();
      if (relativePath !== sanitized) {
        invalidFileName.evidence.push({
          url: fsUtils.getPathWithoutQueryString(fsUtils.getPathWithoutAnchor(resource.relativeUrl)),
          message: ` should be named ${sanitized}`
        });
      }
    }
  });
  if (fileNotFound.evidence.length > 0) {
    fileNotFound.numMessages = fileNotFound.evidence.length;
    resourcesReport.errors.push(fileNotFound);
    resourcesReport.numErrors = resourcesReport.errors.length;
  }
  if (invalidFileName.evidence.length > 0) {
    invalidFileName.numMessages = invalidFileName.evidence.length;
    resourcesReport.warnings.push(invalidFileName);
    resourcesReport.numWarnings = resourcesReport.warnings.length;
  }
  pageReport.resourcesReport = resourcesReport;
};

const processRequestedResource = (report, url, resource) => {
  return new Promise(resolve => {
    resource.basename = fsUtils.getBasename(resource.url);
    if (resource.type === `style` || resource.type === `html`) {
      resource.localReportPath.folder = fsUtils.getLocalFolderPathForResource(resource, report.localReportPath.folder);
      resource.localReportPath.file = require(`path`).resolve(resource.localReportPath.folder, `content`);
    }
    if (!resource.localReportPath.folder) {
      return resolve(resource);
    }
    fsUtils.downloadFile(resource.url, resource.localReportPath.file, `utf-8`)
    .then(
      fileContent => handleResourceContent(report, url, resource, fileContent),
      () => resource.error = true
    )
    .then(() => resolve(resource));
  });
};

const handleResourceContent = (report, url, resource, fileContent) => {
  return Promise.resolve()
  .then(() => getResourceHandlerForType(resource.type))
  .then(resourceHandler => resourceHandler(report, url, resource, fileContent))
  .then(() => fileContent);
};

const getResourceHandlerForType = type => {
  if (type === `html`) {
    return handleHtmlContent;
  }
  if (type === `style`) {
    return handleStyleContent;
  }
  return () => {};
};

const handleHtmlContent = (report, url, resource, fileContent) => { //eslint-disable-line
  console.log(`validate html: ${resource.url}`);
  return require(`./html_validator`).validateHtmlFile(resource.localReportPath.file)
  .then(validatorReport => resource.validator = validatorReport);
};

const handleStyleContent = (report, url, resource, fileContent) => { //eslint-disable-line
  console.log(`lint css: ${resource.url}`);
  return require(`./style_linter`).lintStyleSource(fileContent)
  .then(styleLintReport => {
    resource.styleLint = styleLintReport.styleLint;
    return styleLintReport.backgroundImagePaths;
  })
  .then(backgroundImagePaths => {
    backgroundImagePaths.forEach(backgroundImagePath => {
      const fullBackgroundImagePath = fsUtils.getFullUrl(resource.url, backgroundImagePath);
      const imageResource = require(`./index`).getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, fullBackgroundImagePath);
      imageResource.type = `image`;
      imageResource.includedFrom.push({
        url: resource.url,
        includeUrl: backgroundImagePath
      });
    });
  })
  .catch(e => console.error(e));
};

module.exports = {
  processRequestedResources,
  processRequestedResource,
  createResourcesReport
};
