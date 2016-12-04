var chai = require('chai'),
  path = require('path');

chai.use(require('chai-as-promised'));
chai.use(require('chai-fs'));

var expect = require('chai').expect;

//change this to the name of your local selenium jar file
var seleniumBaseName = 'selenium-server-standalone-3.0.1.jar';

describe('selenium', function(){
  var selenium = require('../lib/selenium');
  var seleniumPath = path.resolve(__dirname, '..', seleniumBaseName);
  describe('#resolveLocalJar', function() {
    it('should give us the path to our local selenium jar', function(){
      return expect(selenium.resolveLocalJar()).to.eventually.eql(seleniumPath);
    });
  });
  describe('#start', function(){
    it('should start selenium via a Promise', function(){
      return expect(selenium.start()).to.eventually.be.true;
    });
  });
  describe('#stop', function(){
    it('should stop selenium via a Promise', function(){
      return expect(selenium.stop()).to.eventually.be.true;
    });
  });
});
