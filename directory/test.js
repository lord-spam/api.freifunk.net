var assert = require('assert');
var http = require('http');
var https = require('https');
var url = require('url');

var getRemoteJson = function(name, uri, callback) {
  parsedUrl = url.parse(uri);
  assert(/^https?:/.test(parsedUrl.protocol), 'invalid protocol for ' + name + ' uri: ' + uri);

  var request = (parsedUrl.protocol === 'https:') ? https : http;

  request.get(uri, function(res) {
    assert.equal(res.statusCode, 200);

    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      data = JSON.parse(data);
      callback(data);
    });
  });
};


describe('All registered community JSON specs should validate against the spec file', function() {
  var JSV = require('JSV').JSV;
  var SCHEMA_PATH = __dirname + '/../specs/0.1.json';
  var schema = require(SCHEMA_PATH).schema;
  var env = JSV.createEnvironment('json-schema-draft-03');
  var directory = require('../directory/directory.json');
  var failed = [];

  this.timeout(5000);

  it('should validate', function(done) {
    var count = 0;
    for(var item in directory) {
      ++count;
      getRemoteJson(item, directory[item], function(data) {
        var report = env.validate(data, schema);

        if(report.errors.length > 0) {
          failed.push({
            name: item,
            url: directory[item],
            errors: report.errors
          });
        }
        if(--count === 0) {
          done();
        }
      });
    }
  });

  after(function(done) {
    if(failed.length > 0) {
      done('failed to validate:\n' + 
        JSON.stringify(failed, null, 2));
    } else {
      done();
    }
  });
});
