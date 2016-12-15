'use strict';

const getResourceReportForResource = (report, resourcePath) => {
  if(resourcePath.indexOf('file://') === 0) {
    resourcePath = resourcePath.substr('file://'.length);
  }
  for(let i = report.resources.results.length - 1; i > -1; i--) {
    const resourceReport = report.resources.results[i];
    let resourceReportContext = resourceReport.context;
    if(resourceReportContext.indexOf('file://') === 0) {
      resourceReportContext = resourceReportContext.substr('file://'.length);
    }
    if(resourceReportContext === resourcePath) {
      return resourceReport;
    }
  }
  return false;
};

const getStylelintReportForResource = (report, resourcePath) => {
  if(resourcePath.indexOf('file://') === 0) {
    resourcePath = resourcePath.substr('file://'.length);
  }
  for(let i = report.stylelint.results.length - 1; i > -1; i--) {
    const resourceReport = report.stylelint.results[i];
    let resourceReportContext = resourceReport.context;
    if(resourceReportContext.indexOf('file://') === 0) {
      resourceReportContext = resourceReportContext.substr('file://'.length);
    }
    if(resourceReportContext === resourcePath) {
      return resourceReport;
    }
  }
  return false;
};

module.exports = {
  getResourceReportForResource,
  getStylelintReportForResource
};
