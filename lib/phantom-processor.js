var phantom = require('phantom'),
  path = require('path'),
  url = require('url'),
  fsUtils = require('./fs_utils');

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
    var page;
    var outObj = ph.createOutObject();
    return ph.createPage()
      .then(function(p){
        page = p;
        console.log('createPage ' + fileReport.context);
        page.property('onResourceRequested', function (resource, networkRequest, debug, outObj) {
          // console.log('onResourceRequested ' + resource.url);
          if(!outObj.requestedUrls) {
            outObj.requestedUrls = [];
          }
          outObj.requestedUrls.push(resource.url);
        }, false, outObj);
        return page.open(fileReport.context);
      })
      .then(function(status){
        console.log('status ' + status + ' ' + fileReport.context);
      })
      .then(function(){
        return page.evaluate(function() {
          var styleSheetPaths = [];
          var cssFiles = document.querySelectorAll('[rel="stylesheet"]');
          for(var i = 0; i < cssFiles.length; i++) {
            var href = cssFiles[i].getAttribute('href');
            if(!href) {
              continue;
            }
            styleSheetPaths.push(href);
          }
          return styleSheetPaths;
        });
      })
      .then(function(styleSheetPaths){
        styleSheetPaths.forEach(styleSheetPath => {
          if(!fsUtils.pathIsRemoteUrl(styleSheetPath)) {
            if(!fsUtils.pathIsRemoteUrl(fileReport.context)) {
              styleSheetPath = 'file://' + path.resolve(fileReport.context, '..', styleSheetPath);
            } else {
              styleSheetPath = url.resolve(fileReport.context, styleSheetPath);
            }
          }
          fileReport.resources.styleSheetPaths.push(styleSheetPath);
        });
      })
      .then(function(){
        return page.render(path.resolve(fileReport.outputFolder, 'phantomjs.png'));
      })
      .then(function(){
        fileReport.screenshots.screenshots.push({
          browserName: 'phantomjs',
          url: path.resolve(fileReport.outputFolder, 'phantomjs.png')
        });
      })
      .then(function(){
        return outObj.property('requestedUrls');
      })
      .then(function(requestedUrls){
        requestedUrls.forEach(function(url){
          fileReport.resources.paths.push(decodeURI(url));
        });
      })
      .then(function(){
        page.close();
      })
      .then(function(){
        resolve(fileReport);
      });
  });
};

var _startPhantom = function() {
  return phantom.create(['--web-security=no', '--ignore-ssl-errors=yes']);
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
