var phantom = require('phantom'), _ph;
var startPromise;

var start = function() {
  if(!startPromise) {
    startPromise = new Promise(function(resolve, reject){
      phantom.create("--web-security=no", "--ignore-ssl-errors=yes", {
        port: 12345,
        onStdout: function() {},
        onStderr: function() {},
      }, function (ph) {
        console.log("Phantom Bridge Initiated");
        _ph = ph;
        resolve(_ph);
      });
    });
  }
  return startPromise;
};

var stop = function() {
  if(startPromise) {
    startPromise = null;
  }
  if(_ph) {
    _ph.exit();
    _ph = null;
  }
};

module.exports = {
  start: start,
  stop: stop
};
