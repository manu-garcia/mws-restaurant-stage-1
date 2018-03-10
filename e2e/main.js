
var path = require('path');

describe('Main page', function() {

  it('Should be testeable', function() {
    
    expect(true).toBe(true);

  });

  it ('Should match url', function () {
    
    browser.get('http://localhost:8080/');

    expect(browser.getCurrentUrl()).toEqual('http://localhost:8080/');

  });

});
