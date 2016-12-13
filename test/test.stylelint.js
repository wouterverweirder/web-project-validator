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
  path.resolve(testAssetsPath, 'project_2', 'page_1', 'page1.html'),
  path.resolve(testAssetsPath, 'project_3_outline', 'index.html')
];
var testUrl = "http://blog.aboutme.be/about/";
var testListPath = path.resolve(testAssetsPath, 'urls.txt');
var testListUrls = [
  'http://blog.aboutme.be/about/',
  'http://bump-festival.be'
];
var testDefaultOutputPath = path.resolve('./output');
//

describe('lint-css', function(){
  it('handles a css file with a forgotten colon', function(){
    var cssFilePath = path.resolve(testAssetsPath, 'forgotten-colon.css');
    var lintCssReporter = require('../lib/reporter/lint-css');
    var report = {
      context: cssFilePath
    };
    var fileContents = require('fs').readFileSync(cssFilePath, 'utf-8');
    return expect(lintCssReporter.generateReport(report, fileContents)).to.be.fulfilled
    .then(function(){
      expect(report.numErrors).to.be.above(1);
    });
  });
});
