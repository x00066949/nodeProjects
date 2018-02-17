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

  describe('testwel Test', function () {

    it('It Should Return Welcome', function () {
      assert.equal(BotService.testwel(), 'Welcome');
    });
  });

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

  // describe('Get Repo Url', function () {


  //   it('Return Repository Url Object', function () {
  //     var CommandArr = ['/repo', '1234'];
  //     var UserCommand = '/repo 1234';

  //     var ResultObj = {
  //       IsValid: true,
  //       Url: 'repos/codesciencesol/1234',
  //       Method: 'GET',
  //       Body: null,
  //       IsGit: true
  //     };

  //     //var Result = BotService.getRepoUrl(UserCommand,CommandArr);

  //     //assert.equal(Result, ResultObj);
  //   });


  // });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwiYXNzZXJ0IiwicmVxdWlyZSIsIkJvdFNlcnZpY2UiLCJwb3N0c3B5IiwiY2FjaGUiLCJyZXNvbHZlIiwiZXhwb3J0cyIsInBvc3QiLCJ1cmkiLCJvcHQiLCJjYiIsInNjcnVtYm90IiwidG9rZW4iLCJzaWduIiwiZXhwaXJlc0luIiwiZGVzY3JpYmUiLCJvYXV0aCIsImF1dGgiLCJ0byIsImRlZXAiLCJlcXVhbCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwic2V0SW1tZWRpYXRlIiwidW5kZWZpbmVkIiwic3RhdHVzQ29kZSIsImJvZHkiLCJhY2Nlc3NfdG9rZW4iLCJpdCIsImRvbmUiLCJjaGVja3MiLCJjaGVjayIsIndlYmFwcCIsImVyciIsImFwcCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiLCJ0ZXN0d2VsIiwiQ29tbWFuZCIsIk9wdGlvbnMiLCJyZXF1ZXN0IiwiVUNvbW1hbmQiLCJSZXN1bHQiLCJjaGVja1ZhbGlkSW5wdXQiLCJnZXRDb21tYW5kIiwiUmVzdWx0T2JqIiwiSXNWYWxpZCIsIlVybCIsIk1ldGhvZCIsIkJvZHkiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiZGVlcEVxdWFsIiwiQ29tbWFuZEFyciIsIlVzZXJDb21tYW5kIiwiUmVwb0lkIiwiSXNHaXQiLCJnZXRJc3N1ZVVybCIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJub3REZWVwRXF1YWwiLCJnZXRFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOzs0QkFBWUEsWTs7QUFDWjs7OztBQUVBLElBQUlDLFNBQVNDLFFBQVEsUUFBUixDQUFiO0FBQ0EsSUFBSUMsYUFB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Z0JBQVEsTUFITTtBQUlkQyxjQUFNO0FBQ0pRLHVCQUFhLEtBRFQ7QUFFSkMsb0JBQVU7QUFGTixTQUpRO0FBUWRILGVBQU87QUFSTyxPQUFoQjs7QUFXQSxVQUFJYixTQUFTdEQsV0FBV29FLFdBQVgsQ0FBdUJILFdBQXZCLEVBQW9DRCxVQUFwQyxFQUFnREUsTUFBaEQsQ0FBYjs7QUFFQXBFLGFBQU95RSxZQUFQLENBQW9CakIsTUFBcEIsRUFBNEJHLFNBQTVCO0FBQ0QsS0FuQkQ7QUFzQkQsR0E1Q0Q7O0FBK0NBNUMsV0FBUyxZQUFULEVBQXVCLFlBQVk7O0FBR2pDZ0IsT0FBRyx1Q0FBSCxFQUE0QyxZQUFZO0FBQ3RELFVBQUltQyxhQUFhLENBQUMsUUFBRCxDQUFqQjtBQUNBLFVBQUlDLGNBQWMsUUFBbEI7QUFDQSxVQUFJQyxTQUFTLFFBQWI7O0FBRUEsVUFBSVQsWUFBWTtBQUNkQyxpQkFBUyxJQURLO0FBRWRDLGFBQUssNEJBRlM7QUFHZEMsZ0JBQVEsS0FITTtBQUlkQyxjQUFNLElBSlE7QUFLZE0sZUFBTztBQUxPLE9BQWhCOztBQVFBLFVBQUliLFNBQVN0RCxXQUFXd0UsVUFBWCxDQUFzQlAsV0FBdEIsRUFBbUNELFVBQW5DLEVBQStDRSxNQUEvQyxDQUFiOztBQUVBcEUsYUFBT3lFLFlBQVAsQ0FBb0JqQixNQUFwQixFQUE0QkcsU0FBNUI7QUFDRCxLQWhCRDtBQWtCRCxHQXJCRDtBQXdCRCxDQXRMRCIsImZpbGUiOiJ0ZXN0LXNjcnVtYm90LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBqc29ud2VidG9rZW4gZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCB7IHBvc3QgfSBmcm9tICdyZXF1ZXN0JztcblxudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xudmFyIEJvdFNlcnZpY2UgPSByZXF1aXJlKCcuLi9zY3J1bV9ib2FyZCcpO1xuXG4vL21vY2sgcmVxdWVzdCBtb2R1bGVcbmxldCBwb3N0c3B5O1xucmVxdWlyZS5jYWNoZVtyZXF1aXJlLnJlc29sdmUoJ3JlcXVlc3QnKV0uZXhwb3J0cyA9IHtcbiAgcG9zdDogKHVyaSwgb3B0LCBjYikgPT4gcG9zdHNweSh1cmksIG9wdCwgY2IpXG59O1xuXG4vLyBMb2FkIHRoZSBzY3J1bWJvdCBhcHBcbmNvbnN0IHNjcnVtYm90ID0gcmVxdWlyZSgnLi4vaW5kZXgnKTtcblxuLy8gR2VuZXJhdGUgYSB0ZXN0IE9BdXRoIHRva2VuXG5jb25zdCB0b2tlbiA9IGpzb253ZWJ0b2tlbi5zaWduKHt9LCAnc2VjcmV0JywgeyBleHBpcmVzSW46ICcxaCcgfSk7XG5cbmRlc2NyaWJlKCd3YXRzb253b3JrLXNjcnVtYm90JywgKCkgPT4ge1xuXG4gIC8vIE1vY2sgdGhlIFdhdHNvbiBXb3JrIE9BdXRoIHNlcnZpY2VcbiAgY29uc3Qgb2F1dGggPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgZXhwZWN0KG9wdC5hdXRoKS50by5kZWVwLmVxdWFsKHtcbiAgICAgIHVzZXI6ICd0ZXN0YXBwaWQnLFxuICAgICAgcGFzczogJ3Rlc3RzZWNyZXQnXG4gICAgfSk7XG4gICAgZXhwZWN0KG9wdC5qc29uKS50by5lcXVhbCh0cnVlKTtcbiAgICBleHBlY3Qob3B0LmZvcm0pLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgZ3JhbnRfdHlwZTogJ2NsaWVudF9jcmVkZW50aWFscydcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBPQXV0aCB0b2tlblxuICAgIHNldEltbWVkaWF0ZSgoKSA9PiBjYih1bmRlZmluZWQsIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiB0b2tlblxuICAgICAgfVxuICAgIH0pKTtcbiAgfTtcblxuICBpdCgnYXV0aGVudGljYXRlcyB0aGUgYXBwJywgKGRvbmUpID0+IHtcblxuICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgIGxldCBjaGVja3MgPSAwO1xuICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgaWYoKytjaGVja3MgPT09IDIpXG4gICAgICAgIGRvbmUoKTtcbiAgICB9O1xuXG4gICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICBpZih1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBFY2hvIFdlYiBhcHBcbiAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgIGNoZWNrKCk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgICBpdCgnaGFuZGxlcyBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0cycsIChkb25lKSA9PiB7XG4gIFxuICAgICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgICBsZXQgY2hlY2tzID0gMDtcbiAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgICBkb25lKCk7XG4gICAgICB9O1xuICBcbiAgICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9O1xuICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgV2ViIGFwcFxuICAgICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuICBcbiAgICAgICAgLy8gUG9zdCBhIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3QgdG8gdGhlIGFwcFxuICAgICAgICBwb3N0KCdodHRwOi8vbG9jYWxob3N0OicgKyBzZXJ2ZXIuYWRkcmVzcygpLnBvcnQgKyAnL3NjcnVtYm90Jywge1xuICAgICAgICAgIFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgICAnZjUxZmY1YzkxZTk5YzYzYjZmZGU5ZTM5NmJiNmVhMzAyMzcyN2Y3NGYxODUzZjI5YWI1NzFjZmRhYWJhNGMwMydcbiAgICAgICAgICB9LFxuICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgdHlwZTogJ3ZlcmlmaWNhdGlvbicsXG4gICAgICAgICAgICBjaGFsbGVuZ2U6ICd0ZXN0Y2hhbGxlbmdlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gICAgICAgICAgZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50by5lcXVhbCgyMDApO1xuICBcbiAgICAgICAgICAvLyBFeHBlY3QgY29ycmVjdCBjaGFsbGVuZ2UgcmVzcG9uc2UgYW5kIHNpZ25hdHVyZVxuICAgICAgICAgIGV4cGVjdChyZXMuYm9keS5yZXNwb25zZSkudG8uZXF1YWwoJ3Rlc3RjaGFsbGVuZ2UnKTtcbiAgICAgICAgICBleHBlY3QocmVzLmhlYWRlcnNbJ3gtb3V0Ym91bmQtdG9rZW4nXSkudG8uZXF1YWwoXG4gICAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJzg3NmQxZjlkZTFiMzY1MTRkMzBiY2Y0OGQ4YzQ3MzFhNjk1MDA3MzA4NTRhOTY0ZTMxNzY0MTU5ZDc1Yjg4ZjEnKTtcbiAgXG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgXG4gICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gIFxuICAgICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgICBsZXQgY2hlY2tzID0gMDtcbiAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgICBkb25lKCk7XG4gICAgICB9O1xuICBcbiAgICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9O1xuICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgV2ViIGFwcFxuICAgICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuICBcbiAgICAgICAgLy8gUG9zdCBhIGNoYXQgbWVzc2FnZSB0byB0aGUgYXBwXG4gICAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvc2NydW1ib3QnLCB7XG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgICAvLyBUZXN0IGFuIGludmFsaWQgYm9keSBzaWduYXR1cmVcbiAgICAgICAgICAgICAgJ2ludmFsaWRzaWduYXR1cmUnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlLWNyZWF0ZWQnLFxuICAgICAgICAgICAgY29udGVudDogJ0hlbGxvIHRoZXJlJyxcbiAgICAgICAgICAgIHVzZXJOYW1lOiAnSmFuZScsXG4gICAgICAgICAgICBzcGFjZUlkOiAndGVzdHNwYWNlJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVyciwgdmFsKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gIFxuICAgICAgICAgIC8vIEV4cGVjdCB0aGUgcmVxdWVzdCB0byBiZSByZWplY3RlZFxuICAgICAgICAgIGV4cGVjdCh2YWwuc3RhdHVzQ29kZSkudG8uZXF1YWwoNDAxKTtcbiAgXG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbi8qXG4gICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gICAgICBcblxuICAgIH0pO1xuKi9cbiAgfSk7XG5cbiAgXG4gIGRlc2NyaWJlKCdCb3RTZXJ2aWNlIFRlc3QnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgIGRlc2NyaWJlKCd0ZXN0d2VsIFRlc3QnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgaXQoJ0l0IFNob3VsZCBSZXR1cm4gV2VsY29tZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXNzZXJ0LmVxdWFsKEJvdFNlcnZpY2UudGVzdHdlbCgpLCAnV2VsY29tZScpO1xuICAgICAgfSk7XG4gIFxuICAgIH0pO1xuICBcbiAgXG4gICAgZGVzY3JpYmUoJ0NoZWNrIFZhbGlkIElucHV0JywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgIGl0KCdSZXR1cm5zIHRydWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kID0gJ0BzY3J1bWJvdCAvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBVQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5jaGVja1ZhbGlkSW5wdXQoT3B0aW9ucyk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCB0cnVlKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgICBpdCgnUmV0dXJucyBmYWxzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmQgPSAnQHJlcG9zIC9yZXBvIDEyMzQnO1xuICAgICAgICB2YXIgT3B0aW9ucyA9IHtcbiAgICAgICAgICByZXF1ZXN0OiBudWxsLFxuICAgICAgICAgIHJlc3BvbnNlOiBudWxsLFxuICAgICAgICAgIFVDb21tYW5kOiBDb21tYW5kXG4gICAgICAgIH07XG4gICAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmNoZWNrVmFsaWRJbnB1dChPcHRpb25zKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsIGZhbHNlKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICBkZXNjcmliZSgnR2V0IENvbW1hbmQnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgaXQoJ1JldHVybiBWYWxpZCBjb21tYW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVUNvbW1hbmQgPSAnQHNjcnVtYm90IC9yZXBvIDEyMzQnO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcvcmVwbyAxMjM0Jyk7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgICAgaXQoJ1JldHVybnMgQmxhbmsgSW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBVQ29tbWFuZCA9ICcnO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcnKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICBkZXNjcmliZSgnVmFsaWRhdGUgQ29tbWFuZHMnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgaXQoJ1JldHVybiBVcmwgT2JqZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZCA9ICcvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBDb21tYW5kOiBDb21tYW5kXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0T2JqID0ge1xuICAgICAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgICAgIFVybDogJycsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS52YWxpZGF0ZUNvbW1hbmRzKE9wdGlvbnMpO1xuICBcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICAvLyBkZXNjcmliZSgnR2V0IFJlcG8gVXJsJywgZnVuY3Rpb24gKCkge1xuICBcbiAgXG4gICAgLy8gICBpdCgnUmV0dXJuIFJlcG9zaXRvcnkgVXJsIE9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9yZXBvJywgJzEyMzQnXTtcbiAgICAvLyAgICAgdmFyIFVzZXJDb21tYW5kID0gJy9yZXBvIDEyMzQnO1xuICBcbiAgICAvLyAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAvLyAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgIC8vICAgICAgIFVybDogJ3JlcG9zL2NvZGVzY2llbmNlc29sLzEyMzQnLFxuICAgIC8vICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgLy8gICAgICAgQm9keTogbnVsbCxcbiAgICAvLyAgICAgICBJc0dpdDogdHJ1ZVxuICAgIC8vICAgICB9O1xuICBcbiAgICAvLyAgICAgLy92YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLENvbW1hbmRBcnIpO1xuICBcbiAgICAvLyAgICAgLy9hc3NlcnQuZXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgIC8vICAgfSk7XG4gIFxuICBcbiAgICAvLyB9KTtcbiAgXG4gICAgZGVzY3JpYmUoJ0dldElzc3VlVXJsJywgZnVuY3Rpb24gKCkge1xuICBcbiAgXG4gICAgICBpdCgnUmV0dXJuIFBpcGVsaW5lIFVybCBPYmplY3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gWycvaXNzdWUnLCAnMTInLCAncGlwZWxpbmUnXTtcbiAgICAgICAgdmFyIFVzZXJDb21tYW5kID0gJy9pc3N1ZSAxMiBwaXBlbGluZSc7XG4gICAgICAgIHZhciBSZXBvSWQgPSAnMTIzNCc7XG4gIFxuICAgICAgICB2YXIgUmVzdWx0T2JqID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiAncDEvcmVwb3NpdG9yaWVzLzEyMzQvaXNzdWVzLzEyJyxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICBcbiAgICAgIGl0KCdQb3NpdGlvbiBudW1iZXIgZGlmZmVyZW50IHRoYW4gcGFzc2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZEFyciA9IFsnL2lzc3VlJywgJzEyJywgJy1wJywgJzQ1NicsICcxNiddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2lzc3VlIDEyIC1wIDQ1NiAxJztcbiAgICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0JztcbiAgXG4gICAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6ICdwMS9yZXBvc2l0b3JpZXMvMTIzNC9pc3N1ZXMvMTIvbW92ZXMnLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IHtcbiAgICAgICAgICAgIHBpcGVsaW5lX2lkOiAnNDU2JyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnMSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG4gIFxuICAgICAgICBhc3NlcnQubm90RGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICBkZXNjcmliZSgnR2V0RXBpY1VybCcsIGZ1bmN0aW9uICgpIHtcbiAgXG4gIFxuICAgICAgaXQoJ1JldHVybnMgIHdoZW4gbm90IGVxdWFsIHJlcG9zaXRvcnkgaWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gWycvZXBpYzEnXTtcbiAgICAgICAgdmFyIFVzZXJDb21tYW5kID0gJy9lcGljMSc7XG4gICAgICAgIHZhciBSZXBvSWQgPSAnMTIzNDExJztcbiAgXG4gICAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6ICdwMS9yZXBvc2l0b3JpZXMvMTIzNC9lcGljcycsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgXG4gICAgICAgIGFzc2VydC5ub3REZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICAgIH0pO1xuICBcbiAgXG4gIH0pO1xuIl19