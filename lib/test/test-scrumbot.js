/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_chai = require('chai');

var /*istanbul ignore next*/_jsonwebtoken = require('jsonwebtoken');

/*istanbul ignore next*/var jsonwebtoken = _interopRequireWildcard(_jsonwebtoken);

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var assert = require('assert');
var BotService = require('../scrum_board');

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
  /*
      it('rejects messages with invalid signature', (done) => {
        
  
      });
  */
});

describe('BotService Test', function () {
  /*
    describe('testwel Test', function () {
  
      it('It Should Return Welcome', function () {
        assert.equal(BotService.testwel(), 'Welcome');
      });
  
    });
  */

  describe('Check Valid Input', function () {

    it('Returns true', function () {
      var Command = '@scrumbot /repo 1234';
      var Options = {
        request: null,
        response: null,
        UCommand: Command
      };
      var Result = BotService.checkValidInput(Options);

      assert.equal(Result, true);
    });

    it('Returns false', function () {
      var Command = '@repos /repo 1234';
      var Options = {
        request: null,
        response: null,
        UCommand: Command
      };
      var Result = BotService.checkValidInput(Options);

      assert.equal(Result, false);
    });
  });

  describe('Get Command', function () {

    it('Return Valid command', function () {
      var UCommand = '@scrumbot /repo 1234';
      var Result = BotService.getCommand(UCommand);

      assert.equal(Result, '/repo 1234');
    });

    it('Returns Blank Input', function () {
      var UCommand = '';
      var Result = BotService.getCommand(UCommand);

      assert.equal(Result, '');
    });
  });

  describe('Validate Commands', function () {

    it('Return Url Object', function () {
      var Command = '/repo 1234';
      var Options = {
        request: null,
        response: null,
        Command: Command
      };

      var ResultObj = {
        IsValid: false,
        Url: '',
        Method: 'GET',
        Body: null
      };

      var Result = BotService.validateCommands(Options);

      assert.deepEqual(Result, ResultObj);
    });
  });

  describe('GetIssueUrl', function () {

    it('Return Pipeline Url Object', function () {
      var CommandArr = ['/issue', '12', 'pipeline'];
      var UserCommand = '/issue 12 pipeline';
      var RepoId = '1234';

      var ResultObj = {
        IsValid: true,
        Url: 'p1/repositories/1234/issues/12',
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      var Result = BotService.getIssueUrl(UserCommand, CommandArr, RepoId);

      assert.deepEqual(Result, ResultObj);
    });

    it('Position number different than passed', function () {
      var CommandArr = ['/issue', '12', '-p', '456', '16'];
      var UserCommand = '/issue 12 -p 456 1';
      var RepoId = '1234';

      var ResultObj = {
        IsValid: true,
        Url: 'p1/repositories/1234/issues/12/moves',
        Method: 'POST',
        Body: {
          pipeline_id: '456',
          position: '1'
        },
        IsGit: false
      };

      var Result = BotService.getIssueUrl(UserCommand, CommandArr, RepoId);

      assert.notDeepEqual(Result, ResultObj);
    });
  });

  describe('GetEpicUrl', function () {

    it('Returns  when not equal repository id', function () {
      var CommandArr = ['/epic1'];
      var UserCommand = '/epic1';
      var RepoId = '123411';

      var ResultObj = {
        IsValid: true,
        Url: 'p1/repositories/1234/epics',
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      var Result = BotService.getEpicUrl(UserCommand, CommandArr, RepoId);

      assert.notDeepEqual(Result, ResultObj);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwiYXNzZXJ0IiwicmVxdWlyZSIsIkJvdFNlcnZpY2UiLCJwb3N0c3B5IiwiY2FjaGUiLCJyZXNvbHZlIiwiZXhwb3J0cyIsInBvc3QiLCJ1cmkiLCJvcHQiLCJjYiIsInNjcnVtYm90IiwidG9rZW4iLCJzaWduIiwiZXhwaXJlc0luIiwiZGVzY3JpYmUiLCJvYXV0aCIsImF1dGgiLCJ0byIsImRlZXAiLCJlcXVhbCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwic2V0SW1tZWRpYXRlIiwidW5kZWZpbmVkIiwic3RhdHVzQ29kZSIsImJvZHkiLCJhY2Nlc3NfdG9rZW4iLCJpdCIsImRvbmUiLCJjaGVja3MiLCJjaGVjayIsIndlYmFwcCIsImVyciIsImFwcCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiLCJDb21tYW5kIiwiT3B0aW9ucyIsInJlcXVlc3QiLCJVQ29tbWFuZCIsIlJlc3VsdCIsImNoZWNrVmFsaWRJbnB1dCIsImdldENvbW1hbmQiLCJSZXN1bHRPYmoiLCJJc1ZhbGlkIiwiVXJsIiwiTWV0aG9kIiwiQm9keSIsInZhbGlkYXRlQ29tbWFuZHMiLCJkZWVwRXF1YWwiLCJDb21tYW5kQXJyIiwiVXNlckNvbW1hbmQiLCJSZXBvSWQiLCJJc0dpdCIsImdldElzc3VlVXJsIiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIm5vdERlZXBFcXVhbCIsImdldEVwaWNVcmwiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7OzRCQUFZQSxZOztBQUNaOzs7O0FBRUEsSUFBSUMsU0FBU0MsUUFBUSxRQUFSLENBQWI7QUFDQSxJQUFJQyxhQUFhRCxRQUFRLGdC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QUFzQkQsR0E1Q0Q7O0FBK0NBM0MsV0FBUyxZQUFULEVBQXVCLFlBQVk7O0FBR2pDZ0IsT0FBRyx1Q0FBSCxFQUE0QyxZQUFZO0FBQ3RELFVBQUlrQyxhQUFhLENBQUMsUUFBRCxDQUFqQjtBQUNBLFVBQUlDLGNBQWMsUUFBbEI7QUFDQSxVQUFJQyxTQUFTLFFBQWI7O0FBRUEsVUFBSVQsWUFBWTtBQUNkQyxpQkFBUyxJQURLO0FBRWRDLGFBQUssNEJBRlM7QUFHZEMsZ0JBQVEsS0FITTtBQUlkQyxjQUFNLElBSlE7QUFLZE0sZUFBTztBQUxPLE9BQWhCOztBQVFBLFVBQUliLFNBQVNyRCxXQUFXdUUsVUFBWCxDQUFzQlAsV0FBdEIsRUFBbUNELFVBQW5DLEVBQStDRSxNQUEvQyxDQUFiOztBQUVBbkUsYUFBT3dFLFlBQVAsQ0FBb0JqQixNQUFwQixFQUE0QkcsU0FBNUI7QUFDRCxLQWhCRDtBQWtCRCxHQXJCRDtBQXdCRCxDQTlKRCIsImZpbGUiOiJ0ZXN0LXNjcnVtYm90LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBqc29ud2VidG9rZW4gZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCB7IHBvc3QgfSBmcm9tICdyZXF1ZXN0JztcblxudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIEJvdFNlcnZpY2UgPSByZXF1aXJlKCcuLi9zY3J1bV9ib2FyZCcpO1xuXG4vL21vY2sgcmVxdWVzdCBtb2R1bGVcbmxldCBwb3N0c3B5O1xucmVxdWlyZS5jYWNoZVtyZXF1aXJlLnJlc29sdmUoJ3JlcXVlc3QnKV0uZXhwb3J0cyA9IHtcbiAgcG9zdDogKHVyaSwgb3B0LCBjYikgPT4gcG9zdHNweSh1cmksIG9wdCwgY2IpXG59O1xuXG4vLyBMb2FkIHRoZSBzY3J1bWJvdCBhcHBcbmNvbnN0IHNjcnVtYm90ID0gcmVxdWlyZSgnLi4vaW5kZXgnKTtcblxuLy8gR2VuZXJhdGUgYSB0ZXN0IE9BdXRoIHRva2VuXG5jb25zdCB0b2tlbiA9IGpzb253ZWJ0b2tlbi5zaWduKHt9LCAnc2VjcmV0JywgeyBleHBpcmVzSW46ICcxaCcgfSk7XG5cbmRlc2NyaWJlKCd3YXRzb253b3JrLXNjcnVtYm90JywgKCkgPT4ge1xuXG4gIC8vIE1vY2sgdGhlIFdhdHNvbiBXb3JrIE9BdXRoIHNlcnZpY2VcbiAgY29uc3Qgb2F1dGggPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgZXhwZWN0KG9wdC5hdXRoKS50by5kZWVwLmVxdWFsKHtcbiAgICAgIHVzZXI6ICd0ZXN0YXBwaWQnLFxuICAgICAgcGFzczogJ3Rlc3RzZWNyZXQnXG4gICAgfSk7XG4gICAgZXhwZWN0KG9wdC5qc29uKS50by5lcXVhbCh0cnVlKTtcbiAgICBleHBlY3Qob3B0LmZvcm0pLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgZ3JhbnRfdHlwZTogJ2NsaWVudF9jcmVkZW50aWFscydcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBPQXV0aCB0b2tlblxuICAgIHNldEltbWVkaWF0ZSgoKSA9PiBjYih1bmRlZmluZWQsIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiB0b2tlblxuICAgICAgfVxuICAgIH0pKTtcbiAgfTtcblxuICBpdCgnYXV0aGVudGljYXRlcyB0aGUgYXBwJywgKGRvbmUpID0+IHtcblxuICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgIGxldCBjaGVja3MgPSAwO1xuICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgaWYoKytjaGVja3MgPT09IDIpXG4gICAgICAgIGRvbmUoKTtcbiAgICB9O1xuXG4gICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICBpZih1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBFY2hvIFdlYiBhcHBcbiAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgIGNoZWNrKCk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgICBpdCgnaGFuZGxlcyBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0cycsIChkb25lKSA9PiB7XG4gIFxuICAgICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgICBsZXQgY2hlY2tzID0gMDtcbiAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgICBkb25lKCk7XG4gICAgICB9O1xuICBcbiAgICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9O1xuICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgV2ViIGFwcFxuICAgICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuICBcbiAgICAgICAgLy8gUG9zdCBhIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3QgdG8gdGhlIGFwcFxuICAgICAgICBwb3N0KCdodHRwOi8vbG9jYWxob3N0OicgKyBzZXJ2ZXIuYWRkcmVzcygpLnBvcnQgKyAnL3NjcnVtYm90Jywge1xuICAgICAgICAgIFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgICAnZjUxZmY1YzkxZTk5YzYzYjZmZGU5ZTM5NmJiNmVhMzAyMzcyN2Y3NGYxODUzZjI5YWI1NzFjZmRhYWJhNGMwMydcbiAgICAgICAgICB9LFxuICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgdHlwZTogJ3ZlcmlmaWNhdGlvbicsXG4gICAgICAgICAgICBjaGFsbGVuZ2U6ICd0ZXN0Y2hhbGxlbmdlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gICAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50by5lcXVhbCgyMDApO1xuICBcbiAgICAgICAgICAvLyBFeHBlY3QgY29ycmVjdCBjaGFsbGVuZ2UgcmVzcG9uc2UgYW5kIHNpZ25hdHVyZVxuICAgICAgICAgIGV4cGVjdChyZXMuYm9keS5yZXNwb25zZSkudG8uZXF1YWwoJ3Rlc3RjaGFsbGVuZ2UnKTtcbiAgICAgICAgICBleHBlY3QocmVzLmhlYWRlcnNbJ3gtb3V0Ym91bmQtdG9rZW4nXSkudG8uZXF1YWwoXG4gICAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJzg3NmQxZjlkZTFiMzY1MTRkMzBiY2Y0OGQ4YzQ3MzFhNjk1MDA3MzA4NTRhOTY0ZTMxNzY0MTU5ZDc1Yjg4ZjEnKTtcbiAgXG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgXG4gICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gIFxuICAgICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgICBsZXQgY2hlY2tzID0gMDtcbiAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgICBkb25lKCk7XG4gICAgICB9O1xuICBcbiAgICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9O1xuICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgV2ViIGFwcFxuICAgICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuICBcbiAgICAgICAgLy8gUG9zdCBhIGNoYXQgbWVzc2FnZSB0byB0aGUgYXBwXG4gICAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvc2NydW1ib3QnLCB7XG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgICAvLyBUZXN0IGFuIGludmFsaWQgYm9keSBzaWduYXR1cmVcbiAgICAgICAgICAgICAgJ2ludmFsaWRzaWduYXR1cmUnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlLWNyZWF0ZWQnLFxuICAgICAgICAgICAgY29udGVudDogJ0hlbGxvIHRoZXJlJyxcbiAgICAgICAgICAgIHVzZXJOYW1lOiAnSmFuZScsXG4gICAgICAgICAgICBzcGFjZUlkOiAndGVzdHNwYWNlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVyciwgdmFsKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gIFxuICAgICAgICAgIC8vIEV4cGVjdCB0aGUgcmVxdWVzdCB0byBiZSByZWplY3RlZFxuICAgICAgICAgIGV4cGVjdCh2YWwuc3RhdHVzQ29kZSkudG8uZXF1YWwoNDAxKTtcbiAgXG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbi8qXG4gICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gICAgICBcblxuICAgIH0pO1xuKi9cbiAgfSk7XG5cbiAgXG4gIGRlc2NyaWJlKCdCb3RTZXJ2aWNlIFRlc3QnLCBmdW5jdGlvbiAoKSB7XG4gIC8qXG4gICAgZGVzY3JpYmUoJ3Rlc3R3ZWwgVGVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgXG4gICAgICBpdCgnSXQgU2hvdWxkIFJldHVybiBXZWxjb21lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBhc3NlcnQuZXF1YWwoQm90U2VydmljZS50ZXN0d2VsKCksICdXZWxjb21lJyk7XG4gICAgICB9KTtcbiAgXG4gICAgfSk7XG4gICovXG4gIFxuICAgIGRlc2NyaWJlKCdDaGVjayBWYWxpZCBJbnB1dCcsIGZ1bmN0aW9uICgpIHtcbiAgXG4gICAgICBpdCgnUmV0dXJucyB0cnVlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZCA9ICdAc2NydW1ib3QgL3JlcG8gMTIzNCc7XG4gICAgICAgIHZhciBPcHRpb25zID0ge1xuICAgICAgICAgIHJlcXVlc3Q6IG51bGwsXG4gICAgICAgICAgcmVzcG9uc2U6IG51bGwsXG4gICAgICAgICAgVUNvbW1hbmQ6IENvbW1hbmRcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuY2hlY2tWYWxpZElucHV0KE9wdGlvbnMpO1xuICBcbiAgICAgICAgYXNzZXJ0LmVxdWFsKFJlc3VsdCwgdHJ1ZSk7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgICAgaXQoJ1JldHVybnMgZmFsc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kID0gJ0ByZXBvcyAvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBVQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5jaGVja1ZhbGlkSW5wdXQoT3B0aW9ucyk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCBmYWxzZSk7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgIH0pO1xuICBcbiAgXG4gICAgZGVzY3JpYmUoJ0dldCBDb21tYW5kJywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgIGl0KCdSZXR1cm4gVmFsaWQgY29tbWFuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFVDb21tYW5kID0gJ0BzY3J1bWJvdCAvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0Q29tbWFuZChVQ29tbWFuZCk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCAnL3JlcG8gMTIzNCcpO1xuICAgICAgfSk7XG4gIFxuICBcbiAgICAgIGl0KCdSZXR1cm5zIEJsYW5rIElucHV0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVUNvbW1hbmQgPSAnJztcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0Q29tbWFuZChVQ29tbWFuZCk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCAnJyk7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgIH0pO1xuICBcbiAgXG4gICAgZGVzY3JpYmUoJ1ZhbGlkYXRlIENvbW1hbmRzJywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgIGl0KCdSZXR1cm4gVXJsIE9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmQgPSAnL3JlcG8gMTIzNCc7XG4gICAgICAgIHZhciBPcHRpb25zID0ge1xuICAgICAgICAgIHJlcXVlc3Q6IG51bGwsXG4gICAgICAgICAgcmVzcG9uc2U6IG51bGwsXG4gICAgICAgICAgQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgICAgICBVcmw6ICcnLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbFxuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UudmFsaWRhdGVDb21tYW5kcyhPcHRpb25zKTtcbiAgXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICAgIH0pO1xuICBcbiAgICBkZXNjcmliZSgnR2V0SXNzdWVVcmwnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICBcbiAgICAgIGl0KCdSZXR1cm4gUGlwZWxpbmUgVXJsIE9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9pc3N1ZScsICcxMicsICdwaXBlbGluZSddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2lzc3VlIDEyIHBpcGVsaW5lJztcbiAgICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0JztcbiAgXG4gICAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6ICdwMS9yZXBvc2l0b3JpZXMvMTIzNC9pc3N1ZXMvMTInLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcbiAgXG4gICAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgICAgaXQoJ1Bvc2l0aW9uIG51bWJlciBkaWZmZXJlbnQgdGhhbiBwYXNzZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gWycvaXNzdWUnLCAnMTInLCAnLXAnLCAnNDU2JywgJzE2J107XG4gICAgICAgIHZhciBVc2VyQ29tbWFuZCA9ICcvaXNzdWUgMTIgLXAgNDU2IDEnO1xuICAgICAgICB2YXIgUmVwb0lkID0gJzEyMzQnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2lzc3Vlcy8xMi9tb3ZlcycsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keToge1xuICAgICAgICAgICAgcGlwZWxpbmVfaWQ6ICc0NTYnLFxuICAgICAgICAgICAgcG9zaXRpb246ICcxJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgXG4gICAgICAgIGFzc2VydC5ub3REZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICBcbiAgICB9KTtcbiAgXG4gIFxuICAgIGRlc2NyaWJlKCdHZXRFcGljVXJsJywgZnVuY3Rpb24gKCkge1xuICBcbiAgXG4gICAgICBpdCgnUmV0dXJucyAgd2hlbiBub3QgZXF1YWwgcmVwb3NpdG9yeSBpZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9lcGljMSddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2VwaWMxJztcbiAgICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0MTEnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2VwaWNzJyxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0Lm5vdERlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgfSk7XG4iXX0=