'use strict';

const path = require(`path`),
  fsUtils = require(`../fs_utils`),
  templatesPath = path.resolve(__dirname, `templates`);

const renderReportForUrl = (report, reportUrl) => {
  const pageReport = report.reportsByUrl[reportUrl];
  return Promise.resolve()
  .then(() => console.log(`creating report output for ${pageReport.url}`))
  .then(() => {
    pageReport.localReportPath.report = path.resolve(pageReport.localReportPath.folder, `report.html`);
  })
  .then(() => getHtmlOutputAsString(pageReport))
  .then(htmlContent => fsUtils.writeFile(pageReport.localReportPath.report, htmlContent));
};

const getHtmlOutputAsString = pageReport => {
  let output = `<html>`;
  let resourceCounter = 0;
  return Promise.resolve()
  .then(() => fsUtils.loadFile(path.resolve(templatesPath, `html.head.hbs`), `utf-8`))
  .then(templateContent => output = `${output}${templateContent}`)
  .then(() => {
    output = `${output}
    <body>
      <main class="container-fluid">
      <header><h1>Webpage Report</h1></header>
      <p>${pageReport.url}</p>
      <ul class="nav nav-tabs" role="tablist">
        <li role="presentation" class="active">
          <a href="#" aria-controls="live-view" role="tab">Live View</a>
        </li>
    `;
  })
  .then(() => {
    //html resource
    const resource = require(`../index`).getResourceByUrlFromDictionary(pageReport.resourcesByUrl, pageReport.url, false);
    console.log(`html resource tab: ${resource.url}`);
    if (!resource.nr) {
      resource.nr = ++ resourceCounter;
    }
    const name = path.basename(resource.url);
    let badges = ``;
    let numErrors = 0;
    let numWarnings = 0;
    //outline
    numErrors += resource.outline.numErrors;
    numWarnings += resource.outline.numWarnings;
    //validator
    numErrors += resource.validator.numErrors;
    numWarnings += resource.validator.numWarnings;
    if (numErrors > 0) {
      badges = `${badges} <span class="badge" style="background: red">${  numErrors  }</span>`;
    }
    if (numWarnings > 0) {
      badges = `${badges} <span class="badge" style="background: orange">${  numWarnings  }</span>`;
    }
    output = `${output}
    <li>
      <a href="#view-source-${resource.nr}" aria-controls="view-source-${resource.nr}" role="tab">
        ${name}${badges}
      </a>
    </li>
    `;
  })
  .then(() => {
    //css source tabs
    pageReport.resources.forEach(resource => {
      if (resource.type !== `style`) {
        return;
      }
      if (!resource.nr) {
        resource.nr = ++ resourceCounter;
      }
      console.log(`css resource tab: ${resource.url}`);
      const name = path.basename(resource.url);
      let badges = ``;
      const numErrors = resource.styleLint.numErrors;
      const numWarnings = resource.styleLint.numWarnings;
      if (numErrors > 0) {
        badges = `${badges} <span class="badge" style="background: red">${  numErrors  }</span>`;
      }
      if (numWarnings > 0) {
        badges = `${badges} <span class="badge" style="background: orange">${  numWarnings  }</span>`;
      }
      output = `${output}
      <li>
        <a href="#view-source-${resource.nr}" aria-controls="view-source-${resource.nr}" role="tab">
          ${name}${badges}
        </a>
      </li>
      `;
    });
  })
  .then(() => {
    console.log(`images tab`);
    output = `${output}
    <li>
      <a href="#images" aria-controls="images" role="tab">
        Images
      </a>
    </li>
    `;
  })
  .then(() => {
    console.log(`resources tab`);
    let badges = ``;
    const numErrors = pageReport.resourcesReport.numErrors;
    const numWarnings = pageReport.resourcesReport.numWarnings;
    if (numErrors > 0) {
      badges = `${badges} <span class="badge" style="background: red">${  numErrors  }</span>`;
    }
    if (numWarnings > 0) {
      badges = `${badges} <span class="badge" style="background: orange">${  numWarnings  }</span>`;
    }
    output = `${output}
    <li>
      <a href="#resources" aria-controls="resources" role="tab">
        Resources${badges}
      </a>
    </li>
    `;
  })
  .then(() => {
    output = `${output}
      </ul>`;
  })
  .then(() => {
    output = `${output}
    <div class="tab-content">
      <div role="tabpanel" class="tab-pane active" data-tab-id="live-view">
        <iframe id="live-view" width="100%" height="600" src="${pageReport.url}"></iframe>
      </div>
    `;
  })
  .then(() => {
    const resource = require(`../index`).getResourceByUrlFromDictionary(pageReport.resourcesByUrl, pageReport.url, false);
    console.log(`html tab content: ${resource.url}`);
    return require(`./html`).getHtmlOutputAsString(resource)
    .then(resourceOutput => {
      output = `${output}
        <div role="tabpanel" class="tab-pane" data-tab-id="view-source-${resource.nr}">
          ${resourceOutput}
        </div>
      `;
    });
  })
  .then(() => {
    let seq = Promise.resolve();
    //css source tabs
    pageReport.resources.forEach(resource => {
      if (resource.type !== `style`) {
        return;
      }
      console.log(`css tab content: ${resource.url}`);
      seq = seq
      .then(() => require(`./style`).getHtmlOutputAsString(resource))
      .then(resourceOutput => {
        output = `${output}
          <div role="tabpanel" class="tab-pane" data-tab-id="view-source-${resource.nr}">
            ${resourceOutput}
          </div>
        `;
      });
    });
    return seq;
  })
  .then(() => {
    console.log(`images tab content`);
    return require(`./images`).getHtmlOutputAsString(pageReport)
    .then(tabContent => {
      output = `${output}
        <div role="tabpanel" class="tab-pane" data-tab-id="images">
          ${tabContent}
        </div>
      `;
    });
  })
  .then(() => {
    console.log(`resources tab content`);
    return require(`./resources`).getHtmlOutputAsString(pageReport)
    .then(tabContent => {
      output = `${output}
        <div role="tabpanel" class="tab-pane" data-tab-id="resources">
          ${tabContent}
        </div>
      `;
    });
  })
  .then(() => {
    output = `${output}
    </div>`;
  })
  .then(() => fsUtils.loadFile(path.resolve(templatesPath, `script.bottom.hbs`), `utf-8`))
  .then(templateContent => output = `${output}${templateContent}`)
  .then(() => {
    output = `${output}
        </main>
      </body>
    </html>`;
  })
  .then(() => output);
};



module.exports = {
  renderReportForUrl
};
