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
var scrumbot = require('../index');

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
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
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

  it('rejects messages with invalid signature', function (done) {});
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwicG9zdHNweSIsInJlcXVpcmUiLCJjYWNoZSIsInJlc29sdmUiLCJleHBvcnRzIiwicG9zdCIsInVyaSIsIm9wdCIsImNiIiwic2NydW1ib3QiLCJ0b2tlbiIsInNpZ24iLCJleHBpcmVzSW4iLCJkZXNjcmliZSIsIm9hdXRoIiwiYXV0aCIsInRvIiwiZGVlcCIsImVxdWFsIiwidXNlciIsInBhc3MiLCJqc29uIiwiZm9ybSIsImdyYW50X3R5cGUiLCJzZXRJbW1lZGlhdGUiLCJ1bmRlZmluZWQiLCJzdGF0dXNDb2RlIiwiYm9keSIsImFjY2Vzc190b2tlbiIsIml0IiwiZG9uZSIsImNoZWNrcyIsImNoZWNrIiwid2ViYXBwIiwiZXJyIiwiYXBwIiwic2VydmVyIiwibGlzdGVuIiwiYWRkcmVzcyIsInBvcnQiLCJoZWFkZXJzIiwidHlwZSIsImNoYWxsZW5nZSIsInJlcyIsInJlc3BvbnNlIiwiY29udGVudCIsInVzZXJOYW1lIiwic3BhY2VJZCIsInZhbCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7NEJBQVlBLFk7O0FBQ1o7Ozs7QUFFQTtBQUNBLElBQUlDLHdDQUFKO0FBQ0FDLFFBQVFDLEtBQVIsQ0FBY0QsUUFBUUUsT0FBUixDQUFnQixTQUFoQixDQUFkLEVBQTBDQyxPQUExQyxHQUFvRDtBQUNsREMsUUFBTSxzQ0FBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLEVBQVg7QUFBQSxXQUFrQlIsUUFBUU0sR0FBUixFQUFhQyxHQUFiLEVBQWtCQyxFQUFsQixDQUFsQjtBQUFBO0FBRDRDLENBQXBEOztBQUlBO0FBQ0EsSUFBTUMsV0FBV1IsUUFBUSxVQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTVMsUUFBUVgsYUFBYVksSUFBYixDQUFrQixFQUFsQixFQUFzQixRQUF0QixFQUFnQyxFQUFFQyxXQUFXLElBQWIsRUFBaEMsQ0FBZDs7QUFFQUMsU0FBUyxxQkFBVCxFQUFnQyxZQUFNOztBQUVwQztBQUNBLE1BQU1DLFFBQVEsU0FBUkEsS0FBUSxDQUFDUixHQUFELEVBQU1DLEdBQU4sRUFBV0MsRUFBWCxFQUFrQjtBQUM5Qiw4Q0FBT0QsSUFBSVEsSUFBWCxFQUFpQkMsRUFBakIsQ0FBb0JDLElBQXBCLENBQXlCQyxLQUF6QixDQUErQjtBQUM3QkMsWUFBTSxXQUR1QjtBQUU3QkMsWUFBTTtBQUZ1QixLQUEvQjtBQUlBLDhDQUFPYixJQUFJYyxJQUFYLEVBQWlCTCxFQUFqQixDQUFvQkUsS0FBcEIsQ0FBMEIsSUFBMUI7QUFDQSw4Q0FBT1gsSUFBSWUsSUFBWCxFQUFpQk4sRUFBakIsQ0FBb0JDLElBQXBCLENBQXlCQyxLQUF6QixDQUErQjtBQUM3Qkssa0JBQVk7QUFEaUIsS0FBL0I7O0FBSUE7QUFDQUMsaUJBQWE7QUFBQSxhQUFNaEIsR0FBR2lCLFNBQUgsRUFBYztBQUMvQkMsb0JBQVksR0FEbUI7QUFFL0JDLGNBQU07QUFDSkMsd0JBQWNsQjtBQURWO0FBRnlCLE9BQWQsQ0FBTjtBQUFBLEtBQWI7QUFNRCxHQWpCRDs7QUFtQkFtQixLQUFHLHVCQUFILEVBQTRCLFVBQUNDLElBQUQsRUFBVTs7QUFFcEM7QUFDQSxRQUFJQyxTQUFTLENBQWI7QUFDQSxRQUFNQyxRQUFRLFNBQVJBLEtBQVEsR0FBTTtBQUNsQixVQUFHLEVBQUVELE1BQUYsS0FBYSxDQUFoQixFQUNFRDtBQUNILEtBSEQ7O0FBS0E5QixjQUFVLHlDQUFDTSxHQUFELEVBQU1DLEdBQU4sRUFBV0MsRUFBWCxFQUFrQjtBQUMxQjtBQUNBLFVBQUdGLFFBQVEsNENBQVgsRUFBeUQ7QUFDdkRRLGNBQU1SLEdBQU4sRUFBV0MsR0FBWCxFQUFnQkMsRUFBaEI7QUFDQXdCO0FBQ0E7QUFDRDtBQUNGLEtBUEQ7O0FBU0E7QUFDQXZCLGFBQVN3QixNQUFULENBQWdCLFdBQWhCLEVBQTZCLFlBQTdCLEVBQTJDLGFBQTNDLEVBQTBELFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ3RFLGdEQUFPRCxHQUFQLEVBQVlsQixFQUFaLENBQWVFLEtBQWYsQ0FBcUIsSUFBckI7QUFDQWM7QUFDRCxLQUhEO0FBSUQsR0F2QkQ7O0FBeUJFSCxLQUFHLG9DQUFILEVBQXlDLFVBQUNDLElBQUQsRUFBVTs7QUFFakQ7QUFDQSxRQUFJQyxTQUFTLENBQWI7QUFDQSxRQUFNQyxRQUFRLFNBQVJBLEtBQVEsR0FBTTtBQUNsQixVQUFHLEVBQUVELE1BQUYsS0FBYSxDQUFoQixFQUNFRDtBQUNILEtBSEQ7O0FBS0E5QixjQUFVLHlDQUFDTSxHQUFELEVBQU1DLEdBQU4sRUFBV0MsRUFBWCxFQUFrQjtBQUMxQjtBQUNBLFVBQUdGLFFBQVEsNENBQVgsRUFBeUQ7QUFDdkRRLGNBQU1SLEdBQU4sRUFBV0MsR0FBWCxFQUFnQkMsRUFBaEI7QUFDQXdCO0FBQ0E7QUFDRDtBQUNGLEtBUEQ7O0FBU0E7QUFDQXZCLGFBQVN3QixNQUFULENBQWdCLFdBQWhCLEVBQTZCLFlBQTdCLEVBQTJDLGFBQTNDLEVBQTBELFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ3RFLGdEQUFPRCxHQUFQLEVBQVlsQixFQUFaLENBQWVFLEtBQWYsQ0FBcUIsSUFBckI7O0FBRUE7QUFDQSxVQUFNa0IsU0FBU0QsSUFBSUUsTUFBSixDQUFXLENBQVgsQ0FBZjs7QUFFQTtBQUNBLGlEQUFLLHNCQUFzQkQsT0FBT0UsT0FBUCxHQUFpQkMsSUFBdkMsR0FBOEMsV0FBbkQsRUFBZ0U7O0FBRWhFQyxpQkFBUztBQUNMO0FBQ0EsOEJBQ0U7QUFIRyxTQUZ1RDtBQU85RG5CLGNBQU0sSUFQd0Q7QUFROURNLGNBQU07QUFDSmMsZ0JBQU0sY0FERjtBQUVKQyxxQkFBVztBQUZQO0FBUndELE9BQWhFLEVBWUcsVUFBQ1IsR0FBRCxFQUFNUyxHQUFOLEVBQWM7QUFDZixrREFBT1QsR0FBUCxFQUFZbEIsRUFBWixDQUFlRSxLQUFmLENBQXFCLElBQXJCO0FBQ0Esa0RBQU95QixJQUFJakIsVUFBWCxFQUF1QlYsRUFBdkIsQ0FBMEJFLEtBQTFCLENBQWdDLEdBQWhDOztBQUVBO0FBQ0Esa0RBQU95QixJQUFJaEIsSUFBSixDQUFTaUIsUUFBaEIsRUFBMEI1QixFQUExQixDQUE2QkUsS0FBN0IsQ0FBbUMsZUFBbkM7QUFDQSxrREFBT3lCLElBQUlILE9BQUosQ0FBWSxrQkFBWixDQUFQLEVBQXdDeEIsRUFBeEMsQ0FBMkNFLEtBQTNDO0FBQ0U7QUFDQSwwRUFGRjs7QUFJQWM7QUFDRCxPQXZCRDtBQXdCRCxLQS9CRDtBQWdDRCxHQW5ERDs7QUFxREFILEtBQUcseUNBQUgsRUFBOEMsVUFBQ0MsSUFBRCxFQUFVOztBQUV0RDtBQUNBLFFBQUlDLFNBQVMsQ0FBYjtBQUNBLFFBQU1DLFFBQVEsU0FBUkEsS0FBUSxHQUFNO0FBQ2xCLFVBQUcsRUFBRUQsTUFBRixLQUFhLENBQWhCLEVBQ0VEO0FBQ0gsS0FIRDs7QUFLQTlCLGNBQVUseUNBQUNNLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxFQUFYLEVBQWtCO0FBQzFCO0FBQ0EsVUFBR0YsUUFBUSw0Q0FBWCxFQUF5RDtBQUN2RFEsY0FBTVIsR0FBTixFQUFXQyxHQUFYLEVBQWdCQyxFQUFoQjtBQUNBd0I7QUFDQTtBQUNEO0FBQ0YsS0FQRDs7QUFTQTtBQUNBdkIsYUFBU3dCLE1BQVQsQ0FBZ0IsV0FBaEIsRUFBNkIsWUFBN0IsRUFBMkMsYUFBM0MsRUFBMEQsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDdEUsZ0RBQU9ELEdBQVAsRUFBWWxCLEVBQVosQ0FBZUUsS0FBZixDQUFxQixJQUFyQjs7QUFFQTtBQUNBLFVBQU1rQixTQUFTRCxJQUFJRSxNQUFKLENBQVcsQ0FBWCxDQUFmOztBQUVBO0FBQ0EsaURBQUssc0JBQXNCRCxPQUFPRSxPQUFQLEdBQWlCQyxJQUF2QyxHQUE4QyxXQUFuRCxFQUFnRTtBQUM5REMsaUJBQVM7QUFDUDtBQUNFO0FBQ0E7QUFISyxTQURxRDtBQU05RG5CLGNBQU0sSUFOd0Q7QUFPOURNLGNBQU07QUFDSmMsZ0JBQU0saUJBREY7QUFFSkksbUJBQVMsYUFGTDtBQUdKQyxvQkFBVSxNQUhOO0FBSUpDLG1CQUFTO0FBSkw7QUFQd0QsT0FBaEUsRUFhRyxVQUFDYixHQUFELEVBQU1jLEdBQU4sRUFBYztBQUNmLGtEQUFPZCxHQUFQLEVBQVlsQixFQUFaLENBQWVFLEtBQWYsQ0FBcUIsSUFBckI7O0FBRUE7QUFDQSxrREFBTzhCLElBQUl0QixVQUFYLEVBQXVCVixFQUF2QixDQUEwQkUsS0FBMUIsQ0FBZ0MsR0FBaEM7O0FBRUFjO0FBQ0QsT0FwQkQ7QUFxQkQsS0E1QkQ7QUE2QkQsR0FoREQ7O0FBa0RBSCxLQUFHLHlDQUFILEVBQThDLFVBQUNDLElBQUQsRUFBVSxDQUd2RCxDQUhEO0FBS0QsQ0EzSkgiLCJmaWxlIjoidGVzdC1zY3J1bWJvdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgeyBwb3N0IH0gZnJvbSAncmVxdWVzdCc7XG5cbi8vbW9jayByZXF1ZXN0IG1vZHVsZVxubGV0IHBvc3RzcHk7XG5yZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZSgncmVxdWVzdCcpXS5leHBvcnRzID0ge1xuICBwb3N0OiAodXJpLCBvcHQsIGNiKSA9PiBwb3N0c3B5KHVyaSwgb3B0LCBjYilcbn07XG5cbi8vIExvYWQgdGhlIHNjcnVtYm90IGFwcFxuY29uc3Qgc2NydW1ib3QgPSByZXF1aXJlKCcuLi9pbmRleCcpO1xuXG4vLyBHZW5lcmF0ZSBhIHRlc3QgT0F1dGggdG9rZW5cbmNvbnN0IHRva2VuID0ganNvbndlYnRva2VuLnNpZ24oe30sICdzZWNyZXQnLCB7IGV4cGlyZXNJbjogJzFoJyB9KTtcblxuZGVzY3JpYmUoJ3dhdHNvbndvcmstc2NydW1ib3QnLCAoKSA9PiB7XG5cbiAgLy8gTW9jayB0aGUgV2F0c29uIFdvcmsgT0F1dGggc2VydmljZVxuICBjb25zdCBvYXV0aCA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICBleHBlY3Qob3B0LmF1dGgpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgdXNlcjogJ3Rlc3RhcHBpZCcsXG4gICAgICBwYXNzOiAndGVzdHNlY3JldCdcbiAgICB9KTtcbiAgICBleHBlY3Qob3B0Lmpzb24pLnRvLmVxdWFsKHRydWUpO1xuICAgIGV4cGVjdChvcHQuZm9ybSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICBncmFudF90eXBlOiAnY2xpZW50X2NyZWRlbnRpYWxzJ1xuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIE9BdXRoIHRva2VuXG4gICAgc2V0SW1tZWRpYXRlKCgpID0+IGNiKHVuZGVmaW5lZCwge1xuICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgYm9keToge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IHRva2VuXG4gICAgICB9XG4gICAgfSkpO1xuICB9O1xuXG4gIGl0KCdhdXRoZW50aWNhdGVzIHRoZSBhcHAnLCAoZG9uZSkgPT4ge1xuXG4gICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgbGV0IGNoZWNrcyA9IDA7XG4gICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgZG9uZSgpO1xuICAgIH07XG5cbiAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgb2F1dGgodXJpLCBvcHQsIGNiKTtcbiAgICAgICAgY2hlY2soKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgdGhlIEVjaG8gV2ViIGFwcFxuICAgIHNjcnVtYm90LndlYmFwcCgndGVzdGFwcGlkJywgJ3Rlc3RzZWNyZXQnLCAndGVzdHdzZWNyZXQnLCAoZXJyLCBhcHApID0+IHtcbiAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICAgICAgY2hlY2soKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICAgIGl0KCdoYW5kbGVzIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzJywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG4gIFxuICAgICAgICAvLyBQb3N0IGEgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdCB0byB0aGUgYXBwXG4gICAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvc2NydW1ib3QnLCB7XG4gICAgICAgICAgXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgICAnWC1PVVRCT1VORC1UT0tFTic6XG4gICAgICAgICAgICAgICdmNTFmZjVjOTFlOTljNjNiNmZkZTllMzk2YmI2ZWEzMDIzNzI3Zjc0ZjE4NTNmMjlhYjU3MWNmZGFhYmE0YzAzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICB0eXBlOiAndmVyaWZpY2F0aW9uJyxcbiAgICAgICAgICAgIGNoYWxsZW5nZTogJ3Rlc3RjaGFsbGVuZ2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvLmVxdWFsKDIwMCk7XG4gIFxuICAgICAgICAgIC8vIEV4cGVjdCBjb3JyZWN0IGNoYWxsZW5nZSByZXNwb25zZSBhbmQgc2lnbmF0dXJlXG4gICAgICAgICAgZXhwZWN0KHJlcy5ib2R5LnJlc3BvbnNlKS50by5lcXVhbCgndGVzdGNoYWxsZW5nZScpO1xuICAgICAgICAgIGV4cGVjdChyZXMuaGVhZGVyc1sneC1vdXRib3VuZC10b2tlbiddKS50by5lcXVhbChcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgICAnODc2ZDFmOWRlMWIzNjUxNGQzMGJjZjQ4ZDhjNDczMWE2OTUwMDczMDg1NGE5NjRlMzE3NjQxNTlkNzViODhmMScpO1xuICBcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICBcbiAgICBpdCgncmVqZWN0cyBtZXNzYWdlcyB3aXRoIGludmFsaWQgc2lnbmF0dXJlJywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG4gIFxuICAgICAgICAvLyBQb3N0IGEgY2hhdCBtZXNzYWdlIHRvIHRoZSBhcHBcbiAgICAgICAgcG9zdCgnaHR0cDovL2xvY2FsaG9zdDonICsgc2VydmVyLmFkZHJlc3MoKS5wb3J0ICsgJy9zY3J1bWJvdCcsIHtcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1PVVRCT1VORC1UT0tFTic6XG4gICAgICAgICAgICAgIC8vIFRlc3QgYW4gaW52YWxpZCBib2R5IHNpZ25hdHVyZVxuICAgICAgICAgICAgICAnaW52YWxpZHNpZ25hdHVyZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UtY3JlYXRlZCcsXG4gICAgICAgICAgICBjb250ZW50OiAnSGVsbG8gdGhlcmUnLFxuICAgICAgICAgICAgdXNlck5hbWU6ICdKYW5lJyxcbiAgICAgICAgICAgIHNwYWNlSWQ6ICd0ZXN0c3BhY2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyLCB2YWwpID0+IHtcbiAgICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgICAgLy8gRXhwZWN0IHRoZSByZXF1ZXN0IHRvIGJlIHJlamVjdGVkXG4gICAgICAgICAgZXhwZWN0KHZhbC5zdGF0dXNDb2RlKS50by5lcXVhbCg0MDEpO1xuICBcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gICAgICBcblxuICAgIH0pO1xuXG4gIH0pO1xuIl19