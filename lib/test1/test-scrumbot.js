/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_jsonwebtoken = require('jsonwebtoken');

/*istanbul ignore next*/var jsonwebtoken = _interopRequireWildcard(_jsonwebtoken);

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var chai = require('chai');
var expect = chai.expect;

// Load the app
var scrumbot = require('../index');


// mock the request module
var postspy = /*istanbul ignore next*/void 0;
require.cache[require.resolve('request')].exports = {
  post: function /*istanbul ignore next*/post(uri, opt, cb) /*istanbul ignore next*/{
    return postspy(uri, opt, cb);
  }
};

describe('watson workspace scrumbot', function () {

  // Mock the Watson Work OAuth service
  var oauth = function oauth(uri, opt, cb) {
    expect(opt.auth).to.deep.equal({
      user: 'testappid',
      pass: 'testsecret'
    });
    expect(opt.json).to.equal(true);
    expect(opt.form).to.deep.equal({
      grant_type: 'client_credentials'
    });

    // Return OAuth token
    setImmediate(function () /*istanbul ignore next*/{
      return cb(undefined, {
        statusCode: 200,
        body: {
          access_token: token
        }
      });
    });
  };

  it('authenticates the scrumbot', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 2) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the scrumbot Web app
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      expect(err).to.equal(null);
      check();
    });
  });

  it('handles Webhook challenge requests', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 2) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Web app
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      var server = app.listen(0);

      // Post a Webhook challenge request to the app
      /*istanbul ignore next*/(0, _request.post)('http://localhost:' + server.address().port + '/scrumbot', {

        headers: {
          // Signature of the test body with the Webhook secret
          'X-OUTBOUND-TOKEN': 'f51ff5c91e99c63b6fde9e396bb6ea3023727f74f1853f29ab571cfdaaba4c03'
        },
        json: true,
        body: {
          type: 'verification',
          challenge: 'testchallenge'
        }
      }, function (err, res) {
        expect(err).to.equal(null);
        expect(res.statusCode).to.equal(200);

        // Expect correct challenge response and signature
        expect(res.body.response).to.equal('testchallenge');
        expect(res.headers['x-outbound-token']).to.equal(
        // Signature of the test body with the Webhook secret
        '876d1f9de1b36514d30bcf48d8c4731a69500730854a964e31764159d75b88f1');

        check();
      });
    });
  });

  it('rejects messages with invalid signature', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 2) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Web app
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      var server = app.listen(0);

      // Post a chat message to the app
      /*istanbul ignore next*/(0, _request.post)('http://localhost:' + server.address().port + '/scrumbot', {
        headers: {
          'X-OUTBOUND-TOKEN':
          // Test an invalid body signature
          'invalidsignature'
        },
        json: true,
        body: {
          type: 'message-created',
          content: 'Hello there',
          userName: 'Jane',
          spaceId: 'testspace'
        }
      }, function (err, val) {
        expect(err).to.equal(null);

        // Expect the request to be rejected
        expect(val.statusCode).to.equal(401);

        check();
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0MS90ZXN0LXNjcnVtYm90LmpzIl0sIm5hbWVzIjpbImpzb253ZWJ0b2tlbiIsImNoYWkiLCJyZXF1aXJlIiwiZXhwZWN0Iiwic2NydW1ib3QiLCJwb3N0c3B5IiwiY2FjaGUiLCJyZXNvbHZlIiwiZXhwb3J0cyIsInBvc3QiLCJ1cmkiLCJvcHQiLCJjYiIsImRlc2NyaWJlIiwib2F1dGgiLCJhdXRoIiwidG8iLCJkZWVwIiwiZXF1YWwiLCJ1c2VyIiwicGFzcyIsImpzb24iLCJmb3JtIiwiZ3JhbnRfdHlwZSIsInNldEltbWVkaWF0ZSIsInVuZGVmaW5lZCIsInN0YXR1c0NvZGUiLCJib2R5IiwiYWNjZXNzX3Rva2VuIiwidG9rZW4iLCJpdCIsImRvbmUiLCJjaGVja3MiLCJjaGVjayIsIndlYmFwcCIsImVyciIsImFwcCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiXSwibWFwcGluZ3MiOiI7O0FBS0E7OzRCQUFZQSxZOztBQUNaOzs7O0FBTkEsSUFBSUMsT0FBT0MsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJQyxTQUFTRixLQUFLRSxNQUFsQjs7QUFFQTtBQUNBLElBQUlDLFdBQVdGLFFBQVEsVUFBUixDQUFmOzs7QUFJQTtBQUNBLElBQUlHLHdDQUFKO0FBQ0FILFFBQVFJLEtBQVIsQ0FBY0osUUFBUUssT0FBUixDQUFnQixTQUFoQixDQUFkLEVBQTBDQyxPQUExQyxHQUFvRDtBQUNsREMsUUFBTSxzQ0FBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLEVBQVg7QUFBQSxXQUFrQlAsUUFBUUssR0FBUixFQUFhQyxHQUFiLEVBQWtCQyxFQUFsQixDQUFsQjtBQUFBO0FBRDRDLENBQXBEOztBQUlBQyxTQUFTLDJCQUFULEVBQXNDLFlBQU07O0FBRXhDO0FBQ0EsTUFB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LE9BQWhFLEVBYUcsVUFBQ2IsR0FBRCxFQUFNYyxHQUFOLEVBQWM7QUFDZjlDLGVBQU9nQyxHQUFQLEVBQVluQixFQUFaLENBQWVFLEtBQWYsQ0FBcUIsSUFBckI7O0FBRUE7QUFDQWYsZUFBTzhDLElBQUl2QixVQUFYLEVBQXVCVixFQUF2QixDQUEwQkUsS0FBMUIsQ0FBZ0MsR0FBaEM7O0FBRUFlO0FBQ0QsT0FwQkQ7QUFxQkQsS0E1QkQ7QUE2QkQsR0FoREQ7QUFpREQsQ0FySkgiLCJmaWxlIjoidGVzdC1zY3J1bWJvdC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBjaGFpID0gcmVxdWlyZSgnY2hhaScpO1xudmFyIGV4cGVjdCA9IGNoYWkuZXhwZWN0OyBcblxuLy8gTG9hZCB0aGUgYXBwXG52YXIgc2NydW1ib3QgPSByZXF1aXJlKCcuLi9pbmRleCcpO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgeyBwb3N0IH0gZnJvbSAncmVxdWVzdCc7XG5cbi8vIG1vY2sgdGhlIHJlcXVlc3QgbW9kdWxlXG5sZXQgcG9zdHNweTtcbnJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKCdyZXF1ZXN0JyldLmV4cG9ydHMgPSB7XG4gIHBvc3Q6ICh1cmksIG9wdCwgY2IpID0+IHBvc3RzcHkodXJpLCBvcHQsIGNiKVxufTtcblxuZGVzY3JpYmUoJ3dhdHNvbiB3b3Jrc3BhY2Ugc2NydW1ib3QnLCAoKSA9PiB7XG4gIFxuICAgIC8vIE1vY2sgdGhlIFdhdHNvbiBXb3JrIE9BdXRoIHNlcnZpY2VcbiAgICBjb25zdCBvYXV0aCA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgIGV4cGVjdChvcHQuYXV0aCkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIHVzZXI6ICd0ZXN0YXBwaWQnLFxuICAgICAgICBwYXNzOiAndGVzdHNlY3JldCdcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KG9wdC5qc29uKS50by5lcXVhbCh0cnVlKTtcbiAgICAgIGV4cGVjdChvcHQuZm9ybSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgICB9KTtcbiAgXG4gICAgICAvLyBSZXR1cm4gT0F1dGggdG9rZW5cbiAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiBjYih1bmRlZmluZWQsIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgYWNjZXNzX3Rva2VuOiB0b2tlblxuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfTtcbiAgXG4gICAgaXQoJ2F1dGhlbnRpY2F0ZXMgdGhlIHNjcnVtYm90JywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBzY3J1bWJvdCBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICAgICAgICBjaGVjaygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIFxuICAgIGl0KCdoYW5kbGVzIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzJywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG4gIFxuICAgICAgICAvLyBQb3N0IGEgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdCB0byB0aGUgYXBwXG4gICAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvc2NydW1ib3QnLCB7XG4gICAgICAgICAgXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgICAnWC1PVVRCT1VORC1UT0tFTic6XG4gICAgICAgICAgICAgICdmNTFmZjVjOTFlOTljNjNiNmZkZTllMzk2YmI2ZWEzMDIzNzI3Zjc0ZjE4NTNmMjlhYjU3MWNmZGFhYmE0YzAzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICB0eXBlOiAndmVyaWZpY2F0aW9uJyxcbiAgICAgICAgICAgIGNoYWxsZW5nZTogJ3Rlc3RjaGFsbGVuZ2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvLmVxdWFsKDIwMCk7XG4gIFxuICAgICAgICAgIC8vIEV4cGVjdCBjb3JyZWN0IGNoYWxsZW5nZSByZXNwb25zZSBhbmQgc2lnbmF0dXJlXG4gICAgICAgICAgZXhwZWN0KHJlcy5ib2R5LnJlc3BvbnNlKS50by5lcXVhbCgndGVzdGNoYWxsZW5nZScpO1xuICAgICAgICAgIGV4cGVjdChyZXMuaGVhZGVyc1sneC1vdXRib3VuZC10b2tlbiddKS50by5lcXVhbChcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgICAnODc2ZDFmOWRlMWIzNjUxNGQzMGJjZjQ4ZDhjNDczMWE2OTUwMDczMDg1NGE5NjRlMzE3NjQxNTlkNzViODhmMScpO1xuICBcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICBcbiAgICBpdCgncmVqZWN0cyBtZXNzYWdlcyB3aXRoIGludmFsaWQgc2lnbmF0dXJlJywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG4gIFxuICAgICAgICAvLyBQb3N0IGEgY2hhdCBtZXNzYWdlIHRvIHRoZSBhcHBcbiAgICAgICAgcG9zdCgnaHR0cDovL2xvY2FsaG9zdDonICsgc2VydmVyLmFkZHJlc3MoKS5wb3J0ICsgJy9zY3J1bWJvdCcsIHtcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1PVVRCT1VORC1UT0tFTic6XG4gICAgICAgICAgICAgIC8vIFRlc3QgYW4gaW52YWxpZCBib2R5IHNpZ25hdHVyZVxuICAgICAgICAgICAgICAnaW52YWxpZHNpZ25hdHVyZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UtY3JlYXRlZCcsXG4gICAgICAgICAgICBjb250ZW50OiAnSGVsbG8gdGhlcmUnLFxuICAgICAgICAgICAgdXNlck5hbWU6ICdKYW5lJyxcbiAgICAgICAgICAgIHNwYWNlSWQ6ICd0ZXN0c3BhY2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyLCB2YWwpID0+IHtcbiAgICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgICAgLy8gRXhwZWN0IHRoZSByZXF1ZXN0IHRvIGJlIHJlamVjdGVkXG4gICAgICAgICAgZXhwZWN0KHZhbC5zdGF0dXNDb2RlKS50by5lcXVhbCg0MDEpO1xuICBcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiJdfQ==