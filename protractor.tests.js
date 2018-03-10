var SpecReporter = require('jasmine-spec-reporter').SpecReporter;

console.log('Run webdriver: webdriver-manager start --versions.chrome 2.35');

var config = {

  seleniumAddress: 'http://localhost:4444/wd/hub',
  
  specs: [
    
    './e2e/main.js',

  ],

  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': [
        'no-sandbox',
        // 'headless',
        'disable-gpu'
      ]
    }
  },
  chromeOnly: true,
  framework: 'jasmine',

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 60 * 1000
    // isVerbose: true,
    // includeStackTrace: true
  },

  onPrepare: function () {
    
    // We are not using angular
    browser.ignoreSynchronization = true;

    jasmine.getEnv().addReporter(new SpecReporter({
      spec: {
        displayStacktrace: true
      }
    }));

  }
};

module.exports = { 
  config: config
};
