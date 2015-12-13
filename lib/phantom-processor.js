var phantom = require('phantom'),
  path = require('path');

var buildReport = function(report) {
  var _ph;
  return _startPhantom()
    .then(function(ph){
      _ph = ph;
    })
    .then(function(){
      return _buildReportWithPhantom(report, _ph);
    })
    .then(function(){
      return _stopPhantom(_ph);
    })
    .then(function(){
      return report;
    });
};

var _buildReportWithPhantom = function(report, ph) {
  return new Promise(function(resolve, reject){
    var seq = Promise.resolve();
    report.htmlFilePaths.forEach(function(htmlFilePath){
      seq = seq.then(function(){
        return _processHtmlFileWithPhantom(report.reportsByFile[htmlFilePath], ph);
      }).catch(function(error){
        console.log(error);
      });
    });
    seq = seq.then(function(){
      resolve(report);
    }).catch(function(error){
      console.log(error);
    });
  });
};

var _processHtmlFileWithPhantom = function(fileReport, ph) {
  return new Promise(function(resolve, reject){
    console.log('processing ' + fileReport.context + ' with phantomjs');
    ph.createPage(function(page){
      console.log('createPage ' + fileReport.context);
      page.set('onError', function(error){
        console.log('PHANTOMJS page error: ' + error);
      });
      // page.set('settings.resourceTimeout', 1000);
      // page.set('viewportSize', { width: 1366, height: 720 });
      page.set('onResourceRequested', function (resource) {
        //console.log('onResourceRequested ' + fileReport.context + ' ' + resource.url);
        fileReport.resourcePaths.push(decodeURI(resource.url));
      });
      page.set('onLoadFinished', function (status) {
        console.log('onLoadFinished: ' + fileReport.context);
        //screenshot with phantomjs
        // page.render(path.resolve(fileReport.outputFolder, 'phantomjs.png'), function(){
        //   fileReport.screenshots.phantomjs = path.resolve(fileReport.outputFolder, 'phantomjs.png');
          resolve(fileReport);
        // });
      });
      page.open(fileReport.context, function (status) {
        console.log('status ' + status + ' ' + fileReport.context);
      });
    });
  });
};

var _startPhantom = function() {
  return new Promise(function(resolve, reject){
    phantom.create("--web-security=no", "--ignore-ssl-errors=yes", {
      port: 12345,
      // onStdout: function() {},
      // onStderr: function() {},
    }, function (ph, error) {
      if(error) {
        console.log(error);
        return reject(error);
      }
      resolve(ph);
    });
  });
};

var _stopPhantom = function(ph) {
  return new Promise(function(resolve, reject){
    ph.exit();
    resolve();
  });
};

module.exports = {
  buildReport: buildReport
};
