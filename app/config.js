require.config({
  shim: {
    "bootstrap" : { "deps": ["jquery"] },
    "jquery-ui" : {
      "exports": "$",
      "deps": ["jquery"]
    }
  },
  // make bower_components more sensible
  // expose jquery
  paths: {
    "bower_components": "../bower_components",
    "jquery": "../bower_components/jquery/dist/jquery",
    "jquery-ui": "../bower_components/jquery-ui/jquery-ui",
    "lodash": "../bower_components/lodash/lodash",
    "bootstrap": "../bower_components/bootstrap/dist/js/bootstrap",
    "Fuse": "../bower_components/fuse.js/src/fuse"
  },
  map: {
    "*": {
      "knockout": "../bower_components/knockout.js/knockout",
      "ko": "../bower_components/knockout.js/knockout"
    }
  }
});

// Use the debug version of knockout it development only
// When compiling with grunt require js will only look at the first
// require.config({}) found in this file
require.config({
  map: {
    "*": {
      "knockout": "../bower_components/knockout.js/knockout.debug",
      "ko": "../bower_components/knockout.js/knockout.debug"
    }
  }
});

if (!window.requireTestMode) {
  require(['main'], function(){ });
}
