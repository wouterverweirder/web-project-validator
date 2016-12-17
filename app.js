'use strict';

const argv = require(`yargs`)
  .usage(`Usage: $0 <input> [options]`)
  .example(`$0 http://www.bump-festival.be`, `create a report for the given url`)
  .example(`$0 ./my-project/index.html`, `create a report for the html file`)
  .example(`$0 ./project/`, `create a report for each file in the directory`)
  .example(`$0 urls.txt`, `create a report for each url listed in the file`)
  .help(`h`)
  .alias(`h`, `help`)
  .demand(1)
  .default(`output-folder`, `./output`)
  .describe(`output-folder`, `Where do you want to save the generated report?`)
  .argv;

const init = () => {
  const lib = require(`./lib`);
  return Promise.resolve()
  .then(() => lib.buildReport(argv._[0], argv))
  .then(report => lib.renderReport(report));
};

init();
