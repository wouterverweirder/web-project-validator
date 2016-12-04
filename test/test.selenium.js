var chai = require('chai'),
  path = require('path');

chai.use(require('chai-as-promised'));
chai.use(require('chai-fs'));

var expect = require('chai').expect;

//change this to the name of your local selenium jar file
var seleniumBaseName = 'selenium-server-standalone-3.0.1.jar';
//change this to the latest selenium release number
var latestRemoteSeleniumVersion = 3;
var latestRemoteSeleniumUrl = 'http://selenium-release.storage.googleapis.com/3.0/' + seleniumBaseName;

describe('selenium', function(){
  var selenium = require('../lib/selenium');
  var seleniumPath = path.resolve(__dirname, '..', 'bin', seleniumBaseName);
  describe('#getLatestGeckoDriverUrl', function(){
    it('should return the release url for the latest geckodriver', function(){
      this.timeout(0);
      return expect(selenium.getLatestGeckoDriverUrl()).to.be.fulfilled;
    });
  });
  describe('#getLatestSeleniumVersionFromRemote', function(){
    it('should return the latest version from selenium index', function(){
      this.timeout(0);
      return expect(selenium.getLatestSeleniumVersionFromRemote()).to.be.fulfilled.and.eventually.eql(latestRemoteSeleniumVersion);
    });
  });
  describe('#getLatestSeleniumStandaloneUrl', function(){
    it('should return the download url for latest selenium standalone', function(){
      this.timeout(0);
      return expect(selenium.getLatestSeleniumStandaloneUrl()).to.be.fulfilled.and.eventually.eql(latestRemoteSeleniumUrl);
    });
  });
  describe('#downloadSeleniumWhenNeeded', function(){
    it('should download selenium when theres no local file', function(){
      this.timeout(0);
      return expect(selenium.downloadSeleniumWhenNeeded()).to.be.fulfilled;
    })
  });
  describe('#resolveLocalJar', function() {
    it('should give us the path to our local selenium jar', function(){
      return expect(selenium.resolveLocalJar()).to.be.fulfilled.and.eventually.eql(seleniumPath);
    });
  });
  describe('#start', function(){
    it('should start selenium via a Promise', function(){
      return expect(selenium.start()).to.be.fulfilled.and.eventually.be.true;
    });
  });
  describe('#stop', function(){
    it('should stop selenium via a Promise', function(){
      return expect(selenium.stop()).to.be.fulfilled.and.eventually.be.true;
    });
  });
});
