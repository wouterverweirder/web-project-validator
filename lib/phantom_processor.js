'use strict';

/**
 * Phantom Processor will loop through the urls and build basic resource reports
 */

const phantom = require(`phantom`),
  mime = require(`mime-types`),
  lib = require(`./index`),
  fsUtils = require(`./fs_utils`);

/**
 * loop through the urls in the report and load each of them with phantomjs
 */
const buildReport = report => {
  let _ph;
  return Promise.resolve()
  .then(() => startPhantom())
  .then(ph => _ph = ph)
  .then(() => buildReportWithPhantom(_ph, report))
  .then(() => stopPhantom(_ph))
  .then(() => report);
};

const buildReportWithPhantom = (ph, report) => {
  return new Promise((resolve, reject) => {
    if (!report.urls || report.urls.length === 0) {
      return reject(`no urls set to process with phantomjs`);
    }
    if (!report.localReportPath || !report.localReportPath.folder) {
      return reject(`no local folder path set for resource output`);
    }
    lib.setReportPropertiesBasedOnReportUrls(report);
    let seq = Promise.resolve();
    report.urls.forEach(url => {
      seq = seq.then(() => processUrlWithPhantom(ph, report, url));
    });
    seq = seq.then(() => resolve(report), e => reject(e));
  });
};

const processUrlWithPhantom = (ph, report, url) => {
  return new Promise(resolve => {
    let page;
    ph.createPage()
    .then(p => page = p)
    .then(() => console.log(`createPage ${url}`))
    .then(() => {
      return page.property(`viewportSize`, {
        width: 1366,
        height: 600
      });
    })
    .then(() => {
      return page.setting(`resourceTimeout`, 5000); //5 seconds
    })
    .then(() => {
      return page.on(`onResourceRequested`, requestData => {
        console.log(`onResourceRequested ${requestData.url}`);
        const resource = lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, requestData.url);
        // first step: derive mimeType from extension
        resource.mimeType = mime.lookup(requestData.url);
        if (resource.mimeType) {
          if (resource.mimeType.indexOf(`image/`) === 0) {
            resource.type = `image`;
          }
          if (resource.mimeType.indexOf(`application/javascript`) === 0) {
            resource.type = `javascript`;
          }
        }
      });
    })
    .then(() => {
      return page.on(`onResourceError`, resourceError => {
        console.log(`onResourceError ${resourceError.url}`);
        lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, resourceError.url).error = true;
      });
    })
    .then(() => {
      return page.on(`onResourceReceived`, response => {
        if (response.contentType) {
          const mimeType = response.contentType.split(`;`)[0].trim();
          lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, response.url).mimeType = mimeType;
        }
      });
    })
    .then(() => page.open(url))
    .then(status => console.log(`status ${status} ${url}`))
    .then(() => page.off(`onResourceRequested`))
    .then(() => page.off(`onResourceError`))
    .then(() => getStyleSheetIncludesFromPage(url, page))
    .then(styleSheetIncludes => {
      styleSheetIncludes.forEach(styleSheetInclude => {
        const relativeUrl = styleSheetInclude.includeUrl;
        styleSheetInclude.includeUrl = fsUtils.getFullUrl(url, styleSheetInclude.includeUrl);
        const resource = lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, styleSheetInclude.includeUrl);
        resource.type = `style`;
        resource.relativeUrl = relativeUrl;
        resource.includedFrom.push(styleSheetInclude);
      });
    }, e => console.error(e))
    .then(() => getImageIncludesFromPage(url, page))
    .then(imageIncludes => {
      imageIncludes.forEach(imageInclude => {
        const relativeUrl = imageInclude.includeUrl;
        imageInclude.includeUrl = fsUtils.getFullUrl(url, imageInclude.includeUrl);
        const resource = lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, imageInclude.includeUrl);
        resource.type = `image`;
        resource.relativeUrl = relativeUrl;
        resource.includedFrom.push(imageInclude);
      });
    }, e => console.error(e))
    .then(() => {
      const htmlResource = lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, url);
      htmlResource.type = `html`;
      htmlResource.relativeUrl = require(`path`).basename(fsUtils.getSanitizedRemoteUrl(htmlResource.url));
    })
    .then(() => require(`./resource_processor`).processRequestedResources(report, url))
    .then(() => lib.updateResourcesListAndMap(report, url))
    .then(() => {
      const pageReport = report.reportsByUrl[url];
      const path = require(`path`);
      let baseUrl = fsUtils.getSanitizedRemoteUrl(pageReport.url);
      const extname = path.extname(baseUrl);
      if (extname === `.html` || extname === `.htm` || extname === `.php`) {
        baseUrl = path.dirname(baseUrl);
      }
      pageReport.resources.forEach(resource => {
        if (!resource.relativeUrl) {
          resource.relativeUrl = fsUtils.getRelativeUrl(baseUrl, resource.url);
        }
      });
    })
    .then(() => require(`./resource_processor`).createResourcesReport(report.reportsByUrl[url]))
    .then(() => page.close())
    .then(() => resolve(report));
  });
};

const getStyleSheetIncludesFromPage = (url, page) => {
  /* eslint-disable */
  return page.evaluate(function(url) {
    var styleSheetIncludes = [];
    var cssFiles = [].slice.call(document.querySelectorAll("[rel=\"stylesheet\"]"));
    cssFiles.forEach(function (linkEl) {
      var href = linkEl.getAttribute("href");
      if (href) {
        styleSheetIncludes.push({
          url: url,
          includeUrl: href,
          tagName: linkEl.tagName.toLowerCase()
        });
      }
    });
    return styleSheetIncludes;
  }, url);
  /* eslint-enable */
};

const getImageIncludesFromPage = (url, page) => {
  /* eslint-disable */
  return page.evaluate(function(url) {
    var imageIncludes = [];
    var imgEls = [].slice.call(document.querySelectorAll("img"));
    imgEls.forEach(function (imgEl) {
      var src = imgEl.getAttribute("src");
      if (src) {
        imageIncludes.push({
          url: url,
          includeUrl: src,
          width: imgEl.width,
          height: imgEl.height,
          naturalWidth: imgEl.naturalWidth,
          naturalHeight: imgEl.naturalHeight,
          tagName: imgEl.tagName.toLowerCase()
        });
      }
    });
    return imageIncludes;
  }, url);
  /* eslint-enable */
};

const startPhantom = () => {
  return phantom.create([`--web-security=no`, `--ignore-ssl-errors=yes`]);
};

const stopPhantom = ph => {
  return ph.exit();
};

module.exports = {
  buildReport,
  buildReportWithPhantom,
  startPhantom,
  stopPhantom
};
