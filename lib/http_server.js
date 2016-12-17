'use strict';

const
  path = require(`path`),
  projectRoot = path.resolve(__dirname, `..`),
  spawn = require(`child_process`).spawn;

const createServer = options => {
  options.root = options.root || projectRoot;
  let serverRunner = false;
  const listen = port => {
    return new Promise((resolve, reject) => {
      if (isRunning()) {
        return resolve();
      }
      console.log(`starting server on port ${port}`);
      const applicationPath = path.resolve(projectRoot, `node_modules`, `.bin`, `http-server`);
      const applicationArgs = [options.root, `-p`, port];
      const applicationOptions = {
        cwd: projectRoot
      };
      serverRunner = spawn(applicationPath, applicationArgs, applicationOptions);
      serverRunner.stdout.on(`data`, data => {
        data = data.toString().trim();
        if (data.indexOf(`Hit CTRL-C to stop the server`) > - 1) {
          resolve();
        }
      });
      serverRunner.stderr.on(`data`, data => {
        data = data.toString().trim();
        reject(data);
      });
    });
  };
  const close = () => {
    return new Promise(resolve => {
      if (!isRunning()) {
        return resolve();
      }
      console.log(`stopping server`);
      serverRunner.kill();
      serverRunner = false;
      return resolve();
    });
  };
  const isRunning = () => {
    return (serverRunner !== false);
  };

  //stop when process exits
  const exitHandler = options => {
    if (options.cleanup) {
      close();
    }
    if (options.exit) process.exit();
  };

  //do something when app is closing
  process.on(`exit`, exitHandler.bind(null, {cleanup: true}));

  //catches ctrl+c event
  process.on(`SIGINT`, exitHandler.bind(null, {exit: true}));

  //catches uncaught exceptions
  process.on(`uncaughtException`, exitHandler.bind(null, {exit: true}));

  return {
    listen,
    isRunning,
    close
  };
};

module.exports = {
  createServer
};
