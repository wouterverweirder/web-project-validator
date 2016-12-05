var chai = require('chai'),
  path = require('path'),
  rimraf = require('rimraf');

chai.use(require('chai-as-promised'));
chai.use(require('chai-fs'));

var expect = require('chai').expect;

//tests global variables
var htmlToTest = path.resolve(__dirname, '..', 'test_assets', 'project_3_outline', 'index.html')
//end tests global variables

describe('outline-html', function(){
  var outlineHtml = require('../lib/reporter/outline-html');
  var jsdomWindow = false;
  before(function(done){
    //outlineReport, jsdomWindow) {
    var jsdom = require('jsdom');
    var env = {
      file: htmlToTest,
      scripts: [],
      done: function (error, window) {
        if(error) {
          throw error;
        }
        jsdomWindow = window;
        done();
      }
    };
    jsdom.env(env);
  });
  it('should create an outline report', function(){
    return expect(outlineHtml.generateReport({}, jsdomWindow)).to.be.fulfilled
    .then(function(report){
      expect(report).to.have.property('children');
      expect(report).to.have.property('numErrors');
      expect(report.numErrors).to.be.eql(3);
      expect(report.children).to.be.array;
      expect(report.children[0]).to.have.property('title');
      expect(report.children[0]).to.have.property('tagName');
      expect(report.children[0]).to.have.property('identification');
      expect(report.children[0]).to.have.property('children');
      expect(report.children[0].title).to.be.false;
      expect(report.children[0].tagName).to.be.eql('body');
      expect(report.children[0].identification).to.be.false;
      expect(report.children[0].children[0].title).to.be.false;
      expect(report.children[0].children[0].tagName).to.be.eql('section');
      expect(report.children[0].children[0].identification).to.be.false;
      expect(report.children[0].children[0].children[0].title).to.be.eql('Article title');
      expect(report.children[0].children[0].children[0].tagName).to.be.eql('article');
      expect(report.children[0].children[0].children[0].identification).to.be.eql('#article-with-title-and-id');
      expect(report.children[0].children[0].children[1].title).to.be.false;
      expect(report.children[0].children[0].children[1].tagName).to.be.eql('article');
      expect(report.children[0].children[0].children[1].identification).to.be.eql('.article-with-class');
      // const util = require('util');
      // console.log(util.inspect(report, {showHidden: false, depth: null}));
    });
  });
});
