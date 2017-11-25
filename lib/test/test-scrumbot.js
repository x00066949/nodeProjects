/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_chai = require('chai');

var /*istanbul ignore next*/_jsonwebtoken = require('jsonwebtoken');

/*istanbul ignore next*/var jsonwebtoken = _interopRequireWildcard(_jsonwebtoken);

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//mock request module
var postspy = /*istanbul ignore next*/void 0;
require.cache[require.resolve('request')].exports = {
  post: function /*istanbul ignore next*/post(uri, opt, cb) /*istanbul ignore next*/{
    return postspy(uri, opt, cb);
  }
};

// Load the scrumbot app
var echo = require('../index');

// Generate a test OAuth token
var token = jsonwebtoken.sign({}, 'secret', { expiresIn: '1h' });

describe('watsonwork-scrumbot', function () {

  // Mock the Watson Work OAuth service
  var oauth = function oauth(uri, opt, cb) {
    /*istanbul ignore next*/(0, _chai.expect)(opt.auth).to.deep.equal({
      user: 'testappid',
      pass: 'testsecret'
    });
    /*istanbul ignore next*/(0, _chai.expect)(opt.json).to.equal(true);
    /*istanbul ignore next*/(0, _chai.expect)(opt.form).to.deep.equal({
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

  it('authenticates the app', function (done) {

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

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);
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
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

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
        /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);
        /*istanbul ignore next*/(0, _chai.expect)(res.statusCode).to.equal(200);

        // Expect correct challenge response and signature
        /*istanbul ignore next*/(0, _chai.expect)(res.body.response).to.equal('testchallenge');
        /*istanbul ignore next*/(0, _chai.expect)(res.headers['x-outbound-token']).to.equal(
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
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

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
        /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

        // Expect the request to be rejected
        /*istanbul ignore next*/(0, _chai.expect)(val.statusCode).to.equal(401);

        check();
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwicG9zdHNweSIsInJlcXVpcmUiLCJjYWNoZSIsInJlc29sdmUiLCJleHBvcnRzIiwicG9zdCIsInVyaSIsIm9wdCIsImNiIiwiZWNobyIsInRva2VuIiwic2lnbiIsImV4cGlyZXNJbiIsImRlc2NyaWJlIiwib2F1dGgiLCJhdXRoIiwidG8iLCJkZWVwIiwiZXF1YWwiLCJ1c2VyIiwicGFzcyIsImpzb24iLCJmb3JtIiwiZ3JhbnRfdHlwZSIsInNldEltbWVkaWF0ZSIsInVuZGVmaW5lZCIsInN0YXR1c0NvZGUiLCJib2R5IiwiYWNjZXNzX3Rva2VuIiwiaXQiLCJkb25lIiwiY2hlY2tzIiwiY2hlY2siLCJ3ZWJhcHAiLCJlcnIiLCJhcHAiLCJzY3J1bWJvdCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7OzRCQUFZQSxZOztBQUNaOzs7O0FBRUE7QUFDQSxJQUFJQyx3Q0FBSjtBQUNBQyxRQUFRQyxLQUFSLENBQWNELFFBQVFFLE9BQVIsQ0FBZ0IsU0FBaEIsQ0FBZCxFQUEwQ0MsT0FBMUMsR0FBb0Q7QUFDbERDLFFBQU0sc0NBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxFQUFYO0FBQUEsV0FBa0JSLFFBQVFNLEdBQVIsRUFBYUMsR0FBYixFQUFrQkMsRUFBbEIsQ0FBbEI7QUFBQTtBQUQ0QyxDQUFwRDs7QUFJQTtBQUNBLElBQU1DLE9BQU9SLFFBQVEsVUFBUixDQUFiOztBQUVBO0FBQ0EsSUFBTVMsUUFBUVgsYUFBYVksSUFBYixDQUFrQixFQUFsQixFQUFzQixRQUF0QixFQUFnQyxFQUFFQyxXQUFXLElBQWIsRUFBaEMsQ0FBZDs7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QkFBVSxNQUhOO0FBSUpDLG1CQUFTO0FBSkw7QUFQd0QsT0FBaEUsRUFhRyxVQUFDZCxHQUFELEVBQU1lLEdBQU4sRUFBYztBQUNmLGtEQUFPZixHQUFQLEVBQVlsQixFQUFaLENBQWVFLEtBQWYsQ0FBcUIsSUFBckI7O0FBRUE7QUFDQSxrREFBTytCLElBQUl2QixVQUFYLEVBQXVCVixFQUF2QixDQUEwQkUsS0FBMUIsQ0FBZ0MsR0FBaEM7O0FBRUFjO0FBQ0QsT0FwQkQ7QUFxQkQsS0E1QkQ7QUE2QkQsR0FoREQ7QUFpREQsQ0FySkgiLCJmaWxlIjoidGVzdC1zY3J1bWJvdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgeyBwb3N0IH0gZnJvbSAncmVxdWVzdCc7XG5cbi8vbW9jayByZXF1ZXN0IG1vZHVsZVxubGV0IHBvc3RzcHk7XG5yZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZSgncmVxdWVzdCcpXS5leHBvcnRzID0ge1xuICBwb3N0OiAodXJpLCBvcHQsIGNiKSA9PiBwb3N0c3B5KHVyaSwgb3B0LCBjYilcbn07XG5cbi8vIExvYWQgdGhlIHNjcnVtYm90IGFwcFxuY29uc3QgZWNobyA9IHJlcXVpcmUoJy4uL2luZGV4Jyk7XG5cbi8vIEdlbmVyYXRlIGEgdGVzdCBPQXV0aCB0b2tlblxuY29uc3QgdG9rZW4gPSBqc29ud2VidG9rZW4uc2lnbih7fSwgJ3NlY3JldCcsIHsgZXhwaXJlc0luOiAnMWgnIH0pO1xuXG5kZXNjcmliZSgnd2F0c29ud29yay1zY3J1bWJvdCcsICgpID0+IHtcblxuICAvLyBNb2NrIHRoZSBXYXRzb24gV29yayBPQXV0aCBzZXJ2aWNlXG4gIGNvbnN0IG9hdXRoID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgIGV4cGVjdChvcHQuYXV0aCkudG8uZGVlcC5lcXVhbCh7XG4gICAgICB1c2VyOiAndGVzdGFwcGlkJyxcbiAgICAgIHBhc3M6ICd0ZXN0c2VjcmV0J1xuICAgIH0pO1xuICAgIGV4cGVjdChvcHQuanNvbikudG8uZXF1YWwodHJ1ZSk7XG4gICAgZXhwZWN0KG9wdC5mb3JtKS50by5kZWVwLmVxdWFsKHtcbiAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gT0F1dGggdG9rZW5cbiAgICBzZXRJbW1lZGlhdGUoKCkgPT4gY2IodW5kZWZpbmVkLCB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogdG9rZW5cbiAgICAgIH1cbiAgICB9KSk7XG4gIH07XG5cbiAgaXQoJ2F1dGhlbnRpY2F0ZXMgdGhlIGFwcCcsIChkb25lKSA9PiB7XG5cbiAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICBsZXQgY2hlY2tzID0gMDtcbiAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICBkb25lKCk7XG4gICAgfTtcblxuICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAvLyBFeHBlY3QgYSBjYWxsIHRvIGdldCBhbiBPQXV0aCB0b2tlbiBmb3IgdGhlIGFwcFxuICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICBjaGVjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIENyZWF0ZSB0aGUgRWNobyBXZWIgYXBwXG4gICAgZWNoby53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgIGNoZWNrKCk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgICBpdCgnaGFuZGxlcyBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0cycsIChkb25lKSA9PiB7XG4gIFxuICAgICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgICBsZXQgY2hlY2tzID0gMDtcbiAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgICBkb25lKCk7XG4gICAgICB9O1xuICBcbiAgICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9O1xuICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgV2ViIGFwcFxuICAgICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuICBcbiAgICAgICAgLy8gUG9zdCBhIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3QgdG8gdGhlIGFwcFxuICAgICAgICBwb3N0KCdodHRwOi8vbG9jYWxob3N0OicgKyBzZXJ2ZXIuYWRkcmVzcygpLnBvcnQgKyAnL3NjcnVtYm90Jywge1xuICAgICAgICAgIFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgICAnZjUxZmY1YzkxZTk5YzYzYjZmZGU5ZTM5NmJiNmVhMzAyMzcyN2Y3NGYxODUzZjI5YWI1NzFjZmRhYWJhNGMwMydcbiAgICAgICAgICB9LFxuICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgdHlwZTogJ3ZlcmlmaWNhdGlvbicsXG4gICAgICAgICAgICBjaGFsbGVuZ2U6ICd0ZXN0Y2hhbGxlbmdlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gICAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50by5lcXVhbCgyMDApO1xuICBcbiAgICAgICAgICAvLyBFeHBlY3QgY29ycmVjdCBjaGFsbGVuZ2UgcmVzcG9uc2UgYW5kIHNpZ25hdHVyZVxuICAgICAgICAgIGV4cGVjdChyZXMuYm9keS5yZXNwb25zZSkudG8uZXF1YWwoJ3Rlc3RjaGFsbGVuZ2UnKTtcbiAgICAgICAgICBleHBlY3QocmVzLmhlYWRlcnNbJ3gtb3V0Ym91bmQtdG9rZW4nXSkudG8uZXF1YWwoXG4gICAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJzg3NmQxZjlkZTFiMzY1MTRkMzBiY2Y0OGQ4YzQ3MzFhNjk1MDA3MzA4NTRhOTY0ZTMxNzY0MTU5ZDc1Yjg4ZjEnKTtcbiAgXG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgXG4gICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gIFxuICAgICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgICBsZXQgY2hlY2tzID0gMDtcbiAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgICBkb25lKCk7XG4gICAgICB9O1xuICBcbiAgICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9O1xuICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgV2ViIGFwcFxuICAgICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuICBcbiAgICAgICAgLy8gUG9zdCBhIGNoYXQgbWVzc2FnZSB0byB0aGUgYXBwXG4gICAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvc2NydW1ib3QnLCB7XG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgICAvLyBUZXN0IGFuIGludmFsaWQgYm9keSBzaWduYXR1cmVcbiAgICAgICAgICAgICAgJ2ludmFsaWRzaWduYXR1cmUnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlLWNyZWF0ZWQnLFxuICAgICAgICAgICAgY29udGVudDogJ0hlbGxvIHRoZXJlJyxcbiAgICAgICAgICAgIHVzZXJOYW1lOiAnSmFuZScsXG4gICAgICAgICAgICBzcGFjZUlkOiAndGVzdHNwYWNlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVyciwgdmFsKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gIFxuICAgICAgICAgIC8vIEV4cGVjdCB0aGUgcmVxdWVzdCB0byBiZSByZWplY3RlZFxuICAgICAgICAgIGV4cGVjdCh2YWwuc3RhdHVzQ29kZSkudG8uZXF1YWwoNDAxKTtcbiAgXG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4iXX0=