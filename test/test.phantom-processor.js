var chai = require('chai'),
  path = require('path'),
  rimraf = require('rimraf');

chai.use(require('chai-as-promised'));
chai.use(require('chai-fs'));

var expect = require('chai').expect;

//tests global variables
var testAssetsPath = path.resolve(__dirname, '..', 'test_assets');
var testAssetsHtmlFilePaths = [
  path.resolve(testAssetsPath, 'project_1', 'index.html'),
  path.resolve(testAssetsPath, 'project_2', 'page_1', 'page1.html')
];
var testUrl = "http://blog.aboutme.be/about/";
var testListPath = path.resolve(testAssetsPath, 'urls.txt');
var testListUrls = [
  'http://blog.aboutme.be/about/',
  'http://bump-festival.be'
];
var testDefaultOutputPath = path.resolve('./output');
//

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
  it('should set the stylesheet paths', function(){
    this.timeout(0);
    var report = { context: testAssetsHtmlFilePaths[0] };
    var options = { type: 'file' };
    return expect(webProjectValidator.initReport(report, options)).to.be.fulfilled
    .then(function(){
      return webProjectValidator.createOutputFoldersForReport(report);
    })
    .then(function(){
      return require('../lib/phantom-processor').buildReport(report);
    })
    .then(function(){
      var fileReport = report.reportsByFile[testAssetsHtmlFilePaths[0]];
      expect(fileReport.resources.styleSheetPaths).to.contain('file://' + path.resolve(testAssetsPath, 'project_1', 'css', 'style.css'));
      expect(fileReport.resources.styleSheetPaths).to.contain('file://' + path.resolve(testAssetsPath, 'project_1', 'css', 'style.async.css'));
    });
  });
  it('should set the htmlImage paths', function(){
    this.timeout(0);
    var report = { context: testAssetsHtmlFilePaths[0] };
    var options = { type: 'file' };
    return expect(webProjectValidator.initReport(report, options)).to.be.fulfilled
    .then(function(){
      return webProjectValidator.createOutputFoldersForReport(report);
    })
    .then(function(){
      return require('../lib/phantom-processor').buildReport(report);
    })
    .then(function(){
      var fileReport = report.reportsByFile[testAssetsHtmlFilePaths[0]];
      expect(fileReport.images.htmlImagePaths).to.contain('file://' + path.resolve(testAssetsPath, 'project_1', 'file-not-found.png'));
      expect(fileReport.images.htmlImagePaths).to.contain('file://' + path.resolve(testAssetsPath, 'project_1', 'photo with spaces.jpg'));
    });
  })
  it('should fill a report for an online url', function(){
    this.timeout(0);
    var report = { context: testUrl };
    var options = { type: 'url' };
    return expect(webProjectValidator.initReport(report, options)).to.be.fulfilled
    .then(function(){
      return webProjectValidator.createOutputFoldersForReport(report);
    })
    .then(function(){
      return require('../lib/phantom-processor').buildReport(report);
    })
    .then(function(){
      var fileReport = report.reportsByFile[testUrl];
      //check resource paths
      expect(fileReport.resources.paths).to.contain('http://blog.aboutme.be/stylesheets/screen.css');
      expect(fileReport.resources.paths).to.contain('http://blog.aboutme.be/javascripts/modernizr-2.0.js');
      expect(fileReport.resources.paths).to.contain('http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js');
      //check screenshot
      expect(fileReport.screenshots.screenshots).to.have.length(1);
      expect(fileReport.screenshots.screenshots[0].browserName).to.equal('phantomjs');
      expect(fileReport.screenshots.screenshots[0].url).to.equal(path.resolve(fileReport.outputFolder, 'phantomjs.png'));
      expect(fileReport.screenshots.screenshots[0].url).to.be.a.file();
    });
  });
});
