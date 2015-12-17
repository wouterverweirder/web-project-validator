var chai = require('chai'),
  path = require('path'),
  rimraf = require('rimraf');

chai.use(require('chai-as-promised'));
chai.use(require('chai-fs'));

var expect = require('chai').expect;

var testAssetsPath = path.resolve(__dirname, '..', 'test_assets');
var testAssetsHtmlFilePaths = [
  path.resolve(testAssetsPath, 'project_2', 'page_1', 'page1.html'),
path.resolve(testAssetsPath, 'project_1', 'index.html')
];
testAssetsHtmlFilePaths.sort();
var testUrl = "http://blog.aboutme.be/about/";

var testDefaultOutputPath = path.resolve('./output');

describe('WebProjectValidator', function() {
  describe('#_initDefaultOptions()', function(){
    var webProjectValidator;
    beforeEach(function(){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
    });
    describe('.outputFolder', function(){
      it('should convert the outputFolder to an absolute path', function() {
        var options = {
          outputFolder: './output/test/hello'
        };
        webProjectValidator._initDefaultOptions(options);
        expect(options.outputFolder).to.be.equal(path.resolve('./output/test/hello'));
      });
      it('should not change an absolute path to the outputFolder', function() {
        var options = {
          outputFolder: '/output/test/hello'
        };
        webProjectValidator._initDefaultOptions(options);
        expect(options.outputFolder).to.be.equal('/output/test/hello');
      });
      it('should set the outputFolder property to a folder named output in the current working directory when none is provided', function() {
        var options = {};
        webProjectValidator._initDefaultOptions(options);
        expect(options.outputFolder).to.be.equal(testDefaultOutputPath);
      });
    });
    describe('.type', function(){
      it('should set the type property to url when none is provided', function() {
        var options = {};
        webProjectValidator._initDefaultOptions(options);
        expect(options.type).to.be.equal('url');
      });
    });
  });
  describe('#_getInitializerForInputType()', function() {
    var webProjectValidator;
    beforeEach(function(){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
    });
    it('should return _initReportForInputFile when specifying file ', function() {
      expect(webProjectValidator._getInitializerForInputType('file')).to.be.equal(webProjectValidator._initReportForInputFile);
    });
    it('should return _initReportForInputFolder when specifying folder ', function() {
      expect(webProjectValidator._getInitializerForInputType('folder')).to.be.equal(webProjectValidator._initReportForInputFolder);
    });
    it('should return _initReportForInputUrl when specifying url ', function() {
      expect(webProjectValidator._getInitializerForInputType('url')).to.be.equal(webProjectValidator._initReportForInputUrl);
    });
    it('should return _initReportForInputUrl when not specifying type ', function() {
      expect(webProjectValidator._getInitializerForInputType()).to.be.equal(webProjectValidator._initReportForInputUrl);
    });
    it('should return _initReportForInputUrl when specifying unknown type', function() {
      expect(webProjectValidator._getInitializerForInputType('this is some garbage')).to.be.equal(webProjectValidator._initReportForInputUrl);
    });
  });
  describe('#_getOutputFolderForHtmlFilePath()', function() {
    var webProjectValidator;
    beforeEach(function(){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
    });
    it('should set the correct output folder for an html file when input type is file', function() {
      var report = { context: testAssetsHtmlFilePaths[0], htmlFilePaths: [testAssetsHtmlFilePaths[0]] };
      var options = { type: 'file' };
      webProjectValidator._initDefaultOptions(options);
      var expectedPath = path.resolve('./output/index.html');
      expect(webProjectValidator._getOutputFolderForHtmlFilePath(report, options, testAssetsHtmlFilePaths[0])).to.equal(expectedPath);
    });
    it('should set the correct output folder for an html file when input type is folder', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._initDefaultOptions(options);
      var expectedPath = path.resolve('./output/project_1/index.html');
      expect(webProjectValidator._getOutputFolderForHtmlFilePath(report, options, testAssetsHtmlFilePaths[0])).to.equal(expectedPath);
    });
    it('should set the correct output folder for an html file when input type is a web url', function() {
      var report = { context: 'http://blog.aboutme.be/test/hello?q=world&t=1234', htmlFilePaths: ['http://blog.aboutme.be/test/hello?q=world&t=1234'] };
      var options = { type: 'url' };
      webProjectValidator._initDefaultOptions(options);
      var expectedPath = path.resolve('./output/blog.aboutme.be/test/hello');
      expect(webProjectValidator._getOutputFolderForHtmlFilePath(report, options, 'http://blog.aboutme.be/test/hello?q=world&t=1234')).to.equal(expectedPath);
    });
  });
  describe('#_fillReportWithBasicFileReports()', function() {
    var webProjectValidator;
    beforeEach(function(){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
    });
    it('should return the input report object', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      expect(webProjectValidator._fillReportWithBasicFileReports(report, options)).to.equal(report);
    });
    it('should add a property reportsByFile to the report object', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      expect(webProjectValidator._fillReportWithBasicFileReports(report, options)).to.have.property('reportsByFile');
      expect(report.reportsByFile).to.be.an('object');
    });
    it('should add each html path as a property of report.reportsByFile', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile).to.have.all.keys(testAssetsHtmlFilePaths);
    });
    it('should set the context property of a file report to the html file path', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].context).to.equal(testAssetsHtmlFilePaths[0]);
    });
    it('should set the outputFolder property of a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].outputFolder).to.equal(path.resolve('./output/project_1/index.html'));
      expect(report.reportsByFile[testAssetsHtmlFilePaths[1]].outputFolder).to.equal(path.resolve('./output/project_2/page_1/page1.html'));
    });
    it('should create a screenshots property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]]).to.have.property('screenshots');
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].screenshots).to.be.an('object');
    });
    it('should set the context property screenshot report to the html file path', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].screenshots.context).to.equal(testAssetsHtmlFilePaths[0]);
    });
    it('should create an empty array named screenshots in the screenshot report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].screenshots.screenshots).to.eql([]);
    });
    it('should create a styleSheetPaths property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].styleSheetPaths).to.eql([]);
    });
    it('should create a resourcePaths property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]]).to.have.property('resourcePaths');
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].resourcePaths).eql([]);
    });
    it('should create a validator property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]]).to.have.property('validator');
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].validator).to.be.an('object');
    });
    it('should set the context property validator report to the html file path', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].validator.context).to.equal(testAssetsHtmlFilePaths[0]);
    });

    it('should create a outline property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]]).to.have.property('outline');
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].outline).to.be.an('object');
    });
    it('should set the context property outline report to the html file path', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].outline.context).to.equal(testAssetsHtmlFilePaths[0]);
    });

    it('should create a csslint property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]]).to.have.property('csslint');
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].csslint).to.be.an('object');
    });
    it('should set the context property csslint report to the html file path', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].csslint.context).to.equal(testAssetsHtmlFilePaths[0]);
    });
    it('should create an empty array named results in the csslint report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].csslint.results).to.eql([]);
    });
    it('should create a resources property in a file report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]]).to.have.property('resources');
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].resources).to.be.an('object');
    });
    it('should set the context property resource report to the html file path', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].resources.context).to.equal(testAssetsHtmlFilePaths[0]);
    });
    it('should create an empty array named results in the resources report', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      expect(report.reportsByFile[testAssetsHtmlFilePaths[0]].resources.results).to.eql([]);
    });
  });
  describe('#initReport()', function() {
    var webProjectValidator;
    beforeEach(function(){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
    });
    it('should throw an error when no context is provided', function() {
      expect(function(){ webProjectValidator.initReport({}, {}) }).to.throw();
    });
    it('should not throw an error when no options are provided', function() {
      expect(function(){ webProjectValidator.initReport({ context: testAssetsPath }) }).to.not.throw();
    });
    it('should add extra properties to a given report object with type folder and return that extended object through a promise', function() {
      var report = { context: testAssetsPath };
      var options = { type: 'folder' };
      return expect(webProjectValidator.initReport(report, options)).to.eventually.equal(report);
    });
    it('should add extra properties to a given report object with type file and return that extended object through a promise', function() {
      var report = { context: testAssetsPath };
      var options = { type: 'file' };
      return expect(webProjectValidator.initReport(report, options)).to.eventually.equal(report);
    });
    it('should add extra properties to a given report object with type url and return that extended object through a promise', function() {
      var report = { context: testAssetsPath };
      var options = { type: 'url' };
      return expect(webProjectValidator.initReport(report, options)).to.eventually.equal(report);
    });
    it('should add extra properties to a given report object with no type and return that extended object through a promise', function() {
      var report = { context: testAssetsPath };
      var options = { };
      return expect(webProjectValidator.initReport(report, options)).to.eventually.equal(report);
    });
    it('should add extra properties to a given report object with an unknown type and return that extended object through a promise', function() {
      var report = { context: testAssetsPath };
      var options = { type: 'this is some garbage' };
      return expect(webProjectValidator.initReport(report, options)).to.eventually.equal(report);
    });
  });
  describe('#_createOutputFolderForFileReport', function(){
    var webProjectValidator;
    beforeEach(function(done){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
      rimraf(testDefaultOutputPath, done);
    });
    it('should create the output folder & intermediary folders for a given file report object', function(){
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      var fileReport = report.reportsByFile[testAssetsHtmlFilePaths[0]];
      return expect(webProjectValidator._createOutputFolderForFileReport(fileReport)).to.be.fulfilled.then(function(){
        //check if folder exists
        return expect(fileReport.outputFolder).to.be.a.directory();
      });
    });
    afterEach(function(done){
      rimraf(testDefaultOutputPath, done);
    });
  });
  describe('#createOutputFoldersForReport', function(){
    var webProjectValidator;
    beforeEach(function(done){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
      rimraf(testDefaultOutputPath, done);
    });
    it('should return the input report object as the finale promise result', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      return expect(webProjectValidator.createOutputFoldersForReport(report, options, [])).to.eventually.equal(report);
    });
    it('should create the output folders & intermediary folders for a given report object', function(){
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      webProjectValidator._fillReportWithBasicFileReports(report, options);
      return expect(webProjectValidator.createOutputFoldersForReport(report)).to.be.fulfilled.then(function(){
        //check if folders exist
        for(var htmlFilePath in report.reportsByFile) {
          expect(report.reportsByFile[htmlFilePath].outputFolder).to.be.a.directory();
        }
      });
    });
    afterEach(function(done){
      rimraf(testDefaultOutputPath, done);
    });
  });
  describe('#buildReport', function(){
    var webProjectValidator;
    beforeEach(function(){
      var WebProjectValidator = require('../lib');
      webProjectValidator = new WebProjectValidator();
    });
    it('should return the input report object as the finale promise result', function() {
      var report = { context: testAssetsPath, htmlFilePaths: testAssetsHtmlFilePaths };
      var options = { type: 'folder' };
      return expect(webProjectValidator.buildReport(report, options, [])).to.eventually.equal(report);
    });
  });
});

describe('fs_utils', function(){
  describe('#getHtmlFilesFromDirectory()', function(){
    it('should return all the html files inside a given directory & its subdirectories', function(){
      return expect(require('../lib/fs_utils').getHtmlFilesFromDirectory(testAssetsPath)).to.eventually.eql(testAssetsHtmlFilePaths);
    });
  });
  describe('#loadResource()', function(){
    it('should load a url', function(){
      this.timeout(0);
      return expect(require('../lib/fs_utils').loadResource(testUrl, 'utf-8')).to.be.fulfilled.then(function(fileContents){
        expect(fileContents).to.contain('<title>About - Wouter Verweirder</title>');
      });
    });
  });
});

describe('phantom-processor', function() {
  var webProjectValidator;
  beforeEach(function(done){
    var WebProjectValidator = require('../lib');
    webProjectValidator = new WebProjectValidator();
    rimraf(testDefaultOutputPath, done);
  });
  afterEach(function(done){
    rimraf(testDefaultOutputPath, done);
  });
  it('should fill a report for an online url', function(){
    this.timeout(0);
    var report = { context: testUrl };
    var options = { type: 'url' };
    return expect(webProjectValidator.initReport(report, options)).to.be.fulfilled.then(function(){
      return webProjectValidator.createOutputFoldersForReport(report);
    }).then(function(){
      return require('../lib/phantom-processor').buildReport(report);
    }).then(function(){
      var fileReport = report.reportsByFile[testUrl];
      //check resource paths
      expect(fileReport.resourcePaths).to.contain('http://blog.aboutme.be/stylesheets/screen.css');
      expect(fileReport.resourcePaths).to.contain('http://blog.aboutme.be/javascripts/modernizr-2.0.js');
      expect(fileReport.resourcePaths).to.contain('http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js');
      //check screenshot
      expect(fileReport.screenshots.screenshots).to.have.length(1);
      expect(fileReport.screenshots.screenshots[0].browserName).to.equal('phantomjs');
      expect(fileReport.screenshots.screenshots[0].url).to.equal(path.resolve(fileReport.outputFolder, 'phantomjs.png'));
      expect(fileReport.screenshots.screenshots[0].url).to.be.a.file();
    });
  });
});

describe('jsdom-processor', function() {
  var webProjectValidator;
  beforeEach(function(done){
    var WebProjectValidator = require('../lib');
    webProjectValidator = new WebProjectValidator();
    rimraf(testDefaultOutputPath, done);
  });
  afterEach(function(done){
    rimraf(testDefaultOutputPath, done);
  });
  it('should fill a report for an online url', function(){
    this.timeout(0);
    var report = { context: testUrl };
    var options = { type: 'url' };
    return expect(webProjectValidator.initReport(report, options)).to.be.fulfilled.then(function(){
      return webProjectValidator.createOutputFoldersForReport(report);
    }).then(function(){
      return require('../lib/jsdom-processor').buildReport(report);
    }).then(function(){
      var fileReport = report.reportsByFile[testUrl];
      expect(fileReport.styleSheetPaths).to.contain('http://blog.aboutme.be/stylesheets/screen.css');
      expect(fileReport.styleSheetPaths).to.contain('http://fonts.googleapis.com/css?family=PT+Serif:regular,italic,bold,bolditalic');
      expect(fileReport.styleSheetPaths).to.contain('http://fonts.googleapis.com/css?family=PT+Sans:regular,italic,bold,bolditalic');
    });
  });
});
