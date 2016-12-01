'use strict';

const glob = require('glob'),
  path = require('path'),
  spawn = require('child_process').spawn,
  projectRoot = path.resolve(__dirname, '..');

class Selenium {
  constructor() {
    this._seleniumProcess = false;
  }
  start() {
    return new Promise((resolve, reject) => {
      if(this._seleniumProcess) {
        return reject('Selenium is already running');
      }
      return resolveLocalJar()
      .then(localJarPath => {
        this._seleniumProcess = spawn('java', ['-jar', localJarPath]);
        this._seleniumProcess.stdout.on('data', (data) => {
          console.log(data.toString().trim());
        });
        this._seleniumProcess.stderr.on('data', (data) => {
          console.log(data.toString().trim());
        });
        this._seleniumProcess.on('close', (code) => {
          console.log('child process exited with code ' + code);
          reject('Selenium could not be launched');
        });
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
    });
  }
  stop() {
    return new Promise((resolve, reject) => {
      if(!this._seleniumProcess) {
        return reject('Selenium is not running');
      }
      this._seleniumProcess.on('close', (code) => {
        console.log('child process exited with code ' + code);
        resolve(true);
      });
      this._seleniumProcess.kill();
      this._seleniumProcess = false;
    });
  }
};

const resolveLocalJar = () => {
  return new Promise((resolve, reject) => {
    glob(projectRoot + '/selenium**.jar', (err, files) => {
      if(err) {
        return reject(err);
      }
      if(files.length === 0) {
        return reject('no local selenium found');
      }
      resolve(files[files.length - 1]);
    });
  });
};

const seleniumInstance = new Selenium();

module.exports = {
  start: seleniumInstance.start,
  stop: seleniumInstance.stop,
  resolveLocalJar: resolveLocalJar
};
