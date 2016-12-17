'use strict';

const lib = require(`./index`),
  fsUtils = require(`./fs_utils`),
  jsdom = require(`jsdom`),
  HTML5Outline = require(`h5o`);

/**
 * loop through the urls in the report and load each of them with jsdom
 */
const buildReport = report => {
  return Promise.resolve()
  .then(() => {
    if (!report.urls || report.urls.length === 0) {
      throw `no urls set to process with jsdom`;
    }
    if (!report.localReportPath || !report.localReportPath.folder) {
      throw `no local folder path set for resource output`;
    }
    lib.setReportPropertiesBasedOnReportUrls(report);
  })
  .then(() => {
    let seq = Promise.resolve();
    report.urls.forEach(url => {
      seq = seq.then(() => processUrlWithJsdom(report, url));
    });
    return seq;
  })
  .then(() => report);
};

const processUrlWithJsdom = (report, url) => {
  return new Promise((resolve, reject) => {
    console.log(`processUrlWithJsdom: ${url}`);
    const resource = lib.getResourceByUrlFromDictionary(report.reportsByUrl[url].resourcesByUrl, url);
    const env = {
      scripts: [],
      done: (error, window) => {
        if (error) {
          console.log(error);
          return reject(error);
        }
        Promise.resolve()
        .then(() => createOutlineReport(window, resource))
        .then(() => {
          window.close();
        })
        .then(() => lib.updateResourcesListAndMap(report, url))
        .then(() => {
          resolve(report);
        });
      }
    };
    if (fsUtils.pathIsRemoteUrl(url)) {
      env.url = url;
    } else {
      env.file = decodeURI(fsUtils.getPathWithoutProtocol(url));
    }
    jsdom.env(env);
  });
};

const createOutlineReport = (window, report) => {
  const outlineResult = HTML5Outline(window.document.body);
  report.outline = {
    numErrors: 0,
    numWarnings: 0
  };
  Object.assign(report.outline, generateOutlinerSectionReport(report.outline, outlineResult));
};

const generateOutlinerSectionReport = function(outlineReport, section) {
  const report = {
  };
  if (section.heading) {
    report.title = false;
    report.tagName = section.startingNode.localName;
    report.identification = false;
    if (section.startingNode.getAttribute(`id`)) {
      report.identification = `#${  section.startingNode.getAttribute(`id`)}`;
    } else if (section.startingNode.getAttribute(`class`)) {
      report.identification = `.${[].slice.call(section.startingNode.classList).join(`.`)}`;
    }
    if (section.heading.innerHTML) {
      report.title = section.heading.innerHTML.trim();
    }
    if (!report.title) {
      outlineReport .numErrors++;
    }
  }
  if (section.sections) {
    report.children = [];
    section.sections.forEach(function(subsection) {
      report.children.push(generateOutlinerSectionReport(outlineReport, subsection));
    });
  }
  return report;
};

module.exports = {
  buildReport
};
