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

describe('fs_utils', function(){
  describe('#getInputTypeFromArgument()', function(){
    //(url, file, folder or list)
    it('should return url for an http:// url', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('http://blog.aboutme.be')).to.eventually.eql('url');
    });
    it('should return url for an https:// url', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('https://blog.aboutme.be')).to.eventually.eql('url');
    });
    it('should return file for an absolute path to an html file', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument(testAssetsHtmlFilePaths[0])).to.eventually.eql('file');
    });
    it('should return file for a relative path (no ./ prefix) to an html file', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('test_assets/project_1/index.html')).to.eventually.eql('file');
    });
    it('should return file for a relative path (with ./ prefix) to an html file', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('./test_assets/project_1/index.html')).to.eventually.eql('file');
    });
    it('should return folder for an absolute path to folder', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument(testAssetsPath)).to.eventually.eql('folder');
    });
    it('should return folder for a relative path (no ./ prefix, no / suffix) to folder', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('test_assets')).to.eventually.eql('folder');
    });
    it('should return folder for a relative path (with ./ prefix, no / suffix) to folder', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('./test_assets')).to.eventually.eql('folder');
    });
    it('should return folder for a relative path (no ./ prefix, with / suffix) to folder', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('test_assets/')).to.eventually.eql('folder');
    });
    it('should return folder for a relative path (with ./ prefix, with / suffix) to folder', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('./test_assets/')).to.eventually.eql('folder');
    });
    it('should return list for an absolute path to a url list', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument(testListPath)).to.eventually.eql('list');
    });
    it('should return list for a relative path (no ./ prefix) to a url list', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('test_assets/urls.txt')).to.eventually.eql('list');
    });
    it('should return list for a relative path (with ./ prefix) to a url list', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('./test_assets/urls.txt')).to.eventually.eql('list');
    });
    it('should return false for a non existing file', function(){
      return expect(require('../lib/fs_utils').getInputTypeFromArgument('lorem ipsum dolor sit amet file doesnt exist')).to.eventually.eql(false);
    });
  });
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
      expect(require('../lib/fs_utils').pathIsRemoteUrl('https://aboutme.be')).to.be.true;
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
      expect(require('../lib/fs_utils').pathHasProtocol('https://aboutme.be')).to.be.true;
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
