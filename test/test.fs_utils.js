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
  'http://devine.be',
  'http://bump-festival.be'
];
var testDefaultOutputPath = path.resolve('./output');
//

describe('fs_utils', function(){
  describe('#getHtmlFilesFromDirectory()', function(){
    it('should return all the html files inside a given directory & its subdirectories', function(){
      return expect(require('../lib/fs_utils').getHtmlFilesFromDirectory(testAssetsPath)).to.eventually.eql(testAssetsHtmlFilePaths);
    });
  });
  describe('#getUrlsFromList()', function(){
    it('should return the urls mentioned in a given file', function(){
      return expect(require('../lib/fs_utils').getUrlsFromList(testListPath)).to.eventually.eql(testListUrls);
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
  describe('#pathIsRemoteUrl', function(){
    it('should return false when specifying a path without protocl', function(){
      expect(require('../lib/fs_utils').pathIsRemoteUrl('/Applications/Utilities/')).to.be.false;
    });
    it('should return false when specifying a local url (file:///)', function(){
      expect(require('../lib/fs_utils').pathIsRemoteUrl('file:////Applications/Utilities/')).to.be.false;
    });
    it('should return true when specifying a http url', function(){
      expect(require('../lib/fs_utils').pathIsRemoteUrl('http://aboutme.be')).to.be.true;
    });
    it('should return true when specifying a https url', function(){
      expect(require('../lib/fs_utils').pathIsRemoteUrl('https://devine.be')).to.be.true;
    });
  });
  describe('#pathHasProtocol', function(){
    it('should return false when specifying a path without protocol', function(){
      expect(require('../lib/fs_utils').pathHasProtocol('/Applications/Utilities/')).to.be.false;
    });
    it('should return true when specifying a local url (file:///)', function(){
      expect(require('../lib/fs_utils').pathHasProtocol('file:////Applications/Utilities/')).to.be.true;
    });
    it('should return true when specifying a http url', function(){
      expect(require('../lib/fs_utils').pathHasProtocol('http://aboutme.be')).to.be.true;
    });
    it('should return true when specifying a https url', function(){
      expect(require('../lib/fs_utils').pathHasProtocol('https://devine.be')).to.be.true;
    });
  });
  describe('#downloadPromised', function(){
    beforeEach(done => {
      rimraf(testDefaultOutputPath, done);
    });
    afterEach(done => {
      rimraf(testDefaultOutputPath, done);
    });
    it('should download a binary file', function(){
      this.timeout(0);
      var remoteUrl = 'https://github.com/wouterverweirder/web-project-validator/archive/master.zip',
        localPath = path.resolve(testDefaultOutputPath, 'master.zip');
      return expect(require('../lib/fs_utils').downloadPromised(remoteUrl, localPath)).to.eventually.eql(localPath);
    });
  });
});
