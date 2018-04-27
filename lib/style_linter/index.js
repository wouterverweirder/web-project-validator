`use strict`;

const styleLint = require(`stylelint`),
  path = require(`path`),
  projectRoot = path.resolve(__dirname, `..`, `..`),
  safeParserModulePath = path.resolve(projectRoot, `node_modules`, `postcss-safe-parser`),
  stylelintErrorsConfigPath = path.resolve(projectRoot, `conf`, `stylelint.errors.json`),
  stylelintWarningsConfigPath = path.resolve(projectRoot, `conf`, `stylelint.warnings.json`);

const lintStyleSource = fileContent => {
  //lookup object to keep track of rule, line & column to avoid duplicates between errors & warnings
  const styleLintReport = {
    numErrors: 0,
    numWarnings: 0,
    errors: [],
    warnings: []
  };
  let backgroundImagePaths = [];
  return Promise.resolve()
  .then(() => getReportWithConfigFile(fileContent, stylelintErrorsConfigPath, `danger`))
  .then(reportWithConfigFile => {
    styleLintReport.errors = styleLintReport.errors.concat(reportWithConfigFile.groupedMessages);
  })
  .then(() => getReportWithConfigFile(fileContent, stylelintWarningsConfigPath, `warning`))
  .then(reportWithConfigFile => {
    styleLintReport.warnings = styleLintReport.warnings.concat(reportWithConfigFile.groupedMessages);
    backgroundImagePaths = backgroundImagePaths.concat(reportWithConfigFile.backgroundImagePaths);
  })
  .then(() => {
    styleLintReport.numErrors = styleLintReport.errors.length;
    styleLintReport.numWarnings = styleLintReport.warnings.length;
  })
  .then(() => {
    return {
      styleLint: styleLintReport,
      backgroundImagePaths
    };
  });
};

const getReportWithConfigFile = (fileContent, configFile, outputType) => {
  return Promise.resolve()
    .then(() => lintWithConfigFile(fileContent, configFile))
    .then(stylelintResult => processStyleLintResult(stylelintResult, outputType));
};

const lintWithConfigFile = (fileContent, configFile) => {
  return styleLint.lint({
    code: fileContent,
    customSyntax: safeParserModulePath,
    configFile: configFile
  });
};

const processStyleLintResult = (stylelintResult, outputType) => {
  const styleReport = {
    groupedMessages: [],
    backgroundImagePaths: []
  };
  const groupedMessagesMap = {};
  stylelintResult.results.forEach(stylelintResultObject => {
    processPostCssResult(styleReport, stylelintResultObject._postcssResult);
    processStyleLintWarnings(groupedMessagesMap, stylelintResultObject.warnings, outputType);
  });
  for (const key in groupedMessagesMap) {
    styleReport.groupedMessages.push(groupedMessagesMap[key]);
  }
  return styleReport;
};

const processPostCssResult = (styleReport, postCssResult) => {
  if (!postCssResult || !postCssResult.root) {
    return;
  }
  postCssResult.root.walkDecls(node => {
    if (node.prop === `background` || node.prop === `background-image`) {
      const matches = node.value.match(/url\((.*?)\)/);
      if (!matches) {
        return;
      }
      const url = matches[1].replace(/('|")/g, ``);
      //url is relative to the css file!
      styleReport.backgroundImagePaths.push(url);
    }
  });
};

const processStyleLintWarnings = (groupedMessagesMap, warnings, outputType) => {
  warnings.forEach(messageObject => {
    if (!groupedMessagesMap[messageObject.rule]) {
      groupedMessagesMap[messageObject.rule] = {
        outputType,
        message: messageObject.rule,
        evidence: [],
        numMessages: 0
      };
    }
    groupedMessagesMap[messageObject.rule].evidence.push({
      line: messageObject.line,
      column: messageObject.column,
      text: messageObject.text
    });
    groupedMessagesMap [messageObject.rule].numMessages++;
  });
};

module.exports = {
  lintStyleSource
};
