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
      var CommandArr = ['/issue', '1234', '12', 'pipeline'];
      var UserCommand = '/issue 1234 12 pipeline';
      var RepoId = '1234';

      var ResultObj = {
        IsValid: true,
        Url: 'p1/repositories/1234/issues/12',
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType: "GetPipeline"
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
        IsGit: false,
        UrlType: 'EpicIssues'
      };

      var Result = BotService.getEpicUrl(UserCommand, CommandArr, RepoId);

      assert.notDeepEqual(Result, ResultObj);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwiYXNzZXJ0IiwicmVxdWlyZSIsIkJvdFNlcnZpY2UiLCJwb3N0c3B5IiwiY2FjaGUiLCJyZXNvbHZlIiwiZXhwb3J0cyIsInBvc3QiLCJ1cmkiLCJvcHQiLCJjYiIsInNjcnVtYm90IiwidG9rZW4iLCJzaWduIiwiZXhwaXJlc0luIiwiZGVzY3JpYmUiLCJvYXV0aCIsImF1dGgiLCJ0byIsImRlZXAiLCJlcXVhbCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwic2V0SW1tZWRpYXRlIiwidW5kZWZpbmVkIiwic3RhdHVzQ29kZSIsImJvZHkiLCJhY2Nlc3NfdG9rZW4iLCJpdCIsImRvbmUiLCJjaGVja3MiLCJjaGVjayIsIndlYmFwcCIsImVyciIsImFwcCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiLCJDb21tYW5kIiwiT3B0aW9ucyIsInJlcXVlc3QiLCJVQ29tbWFuZCIsIlJlc3VsdCIsImNoZWNrVmFsaWRJbnB1dCIsImdldENvbW1hbmQiLCJSZXN1bHRPYmoiLCJJc1ZhbGlkIiwiVXJsIiwiTWV0aG9kIiwiQm9keSIsInZhbGlkYXRlQ29tbWFuZHMiLCJkZWVwRXF1YWwiLCJDb21tYW5kQXJyIiwiVXNlckNvbW1hbmQiLCJSZXBvSWQiLCJJc0dpdCIsIlVybFR5cGUiLCJnZXRJc3N1ZVVybCIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJub3REZWVwRXF1YWwiLCJnZXRFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOzs0QkFBWUEsWTs7QUFDWjs7OztBQUVBLElBQUlDLFNBQVNDLFFBQVEsUUFBUixDQUFiO0FBQ0EsSUFBSUMsYUFB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LENBQW9CbEIsTUFBcEIsRUFBNEJHLFNBQTVCO0FBQ0QsS0FuQkQ7QUFzQkQsR0E3Q0Q7O0FBZ0RBM0MsV0FBUyxZQUFULEVBQXVCLFlBQVk7O0FBR2pDZ0IsT0FBRyx1Q0FBSCxFQUE0QyxZQUFZO0FBQ3RELFVBQUlrQyxhQUFhLENBQUMsUUFBRCxDQUFqQjtBQUNBLFVBQUlDLGNBQWMsUUFBbEI7QUFDQSxVQUFJQyxTQUFTLFFBQWI7O0FBRUEsVUFBSVQsWUFBWTtBQUNkQyxpQkFBUyxJQURLO0FBRWRDLGFBQUssNEJBRlM7QUFHZEMsZ0JBQVEsS0FITTtBQUlkQyxjQUFNLElBSlE7QUFLZE0sZUFBTyxLQUxPO0FBTWRDLGlCQUFRO0FBTk0sT0FBaEI7O0FBU0EsVUFBSWQsU0FBU3JELFdBQVd3RSxVQUFYLENBQXNCUixXQUF0QixFQUFtQ0QsVUFBbkMsRUFBK0NFLE1BQS9DLENBQWI7O0FBRUFuRSxhQUFPeUUsWUFBUCxDQUFvQmxCLE1BQXBCLEVBQTRCRyxTQUE1QjtBQUNELEtBakJEO0FBbUJELEdBdEJEO0FBeUJELENBaEtEIiwiZmlsZSI6InRlc3Qtc2NydW1ib3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcbmltcG9ydCAqIGFzIGpzb253ZWJ0b2tlbiBmcm9tICdqc29ud2VidG9rZW4nO1xuaW1wb3J0IHsgcG9zdCB9IGZyb20gJ3JlcXVlc3QnO1xuXG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgQm90U2VydmljZSA9IHJlcXVpcmUoJy4uL3NjcnVtX2JvYXJkJyk7XG5cbi8vbW9jayByZXF1ZXN0IG1vZHVsZVxubGV0IHBvc3RzcHk7XG5yZXF1aXJlLmNhY2hlW3JlcXVpcmUucmVzb2x2ZSgncmVxdWVzdCcpXS5leHBvcnRzID0ge1xuICBwb3N0OiAodXJpLCBvcHQsIGNiKSA9PiBwb3N0c3B5KHVyaSwgb3B0LCBjYilcbn07XG5cbi8vIExvYWQgdGhlIHNjcnVtYm90IGFwcFxuY29uc3Qgc2NydW1ib3QgPSByZXF1aXJlKCcuLi9pbmRleCcpO1xuXG4vLyBHZW5lcmF0ZSBhIHRlc3QgT0F1dGggdG9rZW5cbmNvbnN0IHRva2VuID0ganNvbndlYnRva2VuLnNpZ24oe30sICdzZWNyZXQnLCB7IGV4cGlyZXNJbjogJzFoJyB9KTtcblxuZGVzY3JpYmUoJ3dhdHNvbndvcmstc2NydW1ib3QnLCAoKSA9PiB7XG5cbiAgLy8gTW9jayB0aGUgV2F0c29uIFdvcmsgT0F1dGggc2VydmljZVxuICBjb25zdCBvYXV0aCA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICBleHBlY3Qob3B0LmF1dGgpLnRvLmRlZXAuZXF1YWwoe1xuICAgICAgdXNlcjogJ3Rlc3RhcHBpZCcsXG4gICAgICBwYXNzOiAndGVzdHNlY3JldCdcbiAgICB9KTtcbiAgICBleHBlY3Qob3B0Lmpzb24pLnRvLmVxdWFsKHRydWUpO1xuICAgIGV4cGVjdChvcHQuZm9ybSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICBncmFudF90eXBlOiAnY2xpZW50X2NyZWRlbnRpYWxzJ1xuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIE9BdXRoIHRva2VuXG4gICAgc2V0SW1tZWRpYXRlKCgpID0+IGNiKHVuZGVmaW5lZCwge1xuICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgYm9keToge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IHRva2VuXG4gICAgICB9XG4gICAgfSkpO1xuICB9O1xuXG4gIGl0KCdhdXRoZW50aWNhdGVzIHRoZSBhcHAnLCAoZG9uZSkgPT4ge1xuXG4gICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgbGV0IGNoZWNrcyA9IDA7XG4gICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICBpZigrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgZG9uZSgpO1xuICAgIH07XG5cbiAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgIGlmKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgb2F1dGgodXJpLCBvcHQsIGNiKTtcbiAgICAgICAgY2hlY2soKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgdGhlIEVjaG8gV2ViIGFwcFxuICAgIHNjcnVtYm90LndlYmFwcCgndGVzdGFwcGlkJywgJ3Rlc3RzZWNyZXQnLCAndGVzdHdzZWNyZXQnLCAoZXJyLCBhcHApID0+IHtcbiAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICAgICAgY2hlY2soKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICAgIGl0KCdoYW5kbGVzIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzJywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG4gIFxuICAgICAgICAvLyBQb3N0IGEgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdCB0byB0aGUgYXBwXG4gICAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvc2NydW1ib3QnLCB7XG4gICAgICAgICAgXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgICAnWC1PVVRCT1VORC1UT0tFTic6XG4gICAgICAgICAgICAgICdmNTFmZjVjOTFlOTljNjNiNmZkZTllMzk2YmI2ZWEzMDIzNzI3Zjc0ZjE4NTNmMjlhYjU3MWNmZGFhYmE0YzAzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICB0eXBlOiAndmVyaWZpY2F0aW9uJyxcbiAgICAgICAgICAgIGNoYWxsZW5nZTogJ3Rlc3RjaGFsbGVuZ2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvLmVxdWFsKDIwMCk7XG4gIFxuICAgICAgICAgIC8vIEV4cGVjdCBjb3JyZWN0IGNoYWxsZW5nZSByZXNwb25zZSBhbmQgc2lnbmF0dXJlXG4gICAgICAgICAgZXhwZWN0KHJlcy5ib2R5LnJlc3BvbnNlKS50by5lcXVhbCgndGVzdGNoYWxsZW5nZScpO1xuICAgICAgICAgIGV4cGVjdChyZXMuaGVhZGVyc1sneC1vdXRib3VuZC10b2tlbiddKS50by5lcXVhbChcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgICAnODc2ZDFmOWRlMWIzNjUxNGQzMGJjZjQ4ZDhjNDczMWE2OTUwMDczMDg1NGE5NjRlMzE3NjQxNTlkNzViODhmMScpO1xuICBcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICBcbiAgICBpdCgncmVqZWN0cyBtZXNzYWdlcyB3aXRoIGludmFsaWQgc2lnbmF0dXJlJywgKGRvbmUpID0+IHtcbiAgXG4gICAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICAgIGxldCBjaGVja3MgPSAwO1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gIFxuICAgICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG4gIFxuICAgICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG4gIFxuICAgICAgICAvLyBQb3N0IGEgY2hhdCBtZXNzYWdlIHRvIHRoZSBhcHBcbiAgICAgICAgcG9zdCgnaHR0cDovL2xvY2FsaG9zdDonICsgc2VydmVyLmFkZHJlc3MoKS5wb3J0ICsgJy9zY3J1bWJvdCcsIHtcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1PVVRCT1VORC1UT0tFTic6XG4gICAgICAgICAgICAgIC8vIFRlc3QgYW4gaW52YWxpZCBib2R5IHNpZ25hdHVyZVxuICAgICAgICAgICAgICAnaW52YWxpZHNpZ25hdHVyZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UtY3JlYXRlZCcsXG4gICAgICAgICAgICBjb250ZW50OiAnSGVsbG8gdGhlcmUnLFxuICAgICAgICAgICAgdXNlck5hbWU6ICdKYW5lJyxcbiAgICAgICAgICAgIHNwYWNlSWQ6ICd0ZXN0c3BhY2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LCAoZXJyLCB2YWwpID0+IHtcbiAgICAgICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgXG4gICAgICAgICAgLy8gRXhwZWN0IHRoZSByZXF1ZXN0IHRvIGJlIHJlamVjdGVkXG4gICAgICAgICAgZXhwZWN0KHZhbC5zdGF0dXNDb2RlKS50by5lcXVhbCg0MDEpO1xuICBcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuLypcbiAgICBpdCgncmVqZWN0cyBtZXNzYWdlcyB3aXRoIGludmFsaWQgc2lnbmF0dXJlJywgKGRvbmUpID0+IHtcbiAgICAgIFxuXG4gICAgfSk7XG4qL1xuICB9KTtcblxuICBcbiAgZGVzY3JpYmUoJ0JvdFNlcnZpY2UgVGVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgLypcbiAgICBkZXNjcmliZSgndGVzdHdlbCBUZXN0JywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgIGl0KCdJdCBTaG91bGQgUmV0dXJuIFdlbGNvbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFzc2VydC5lcXVhbChCb3RTZXJ2aWNlLnRlc3R3ZWwoKSwgJ1dlbGNvbWUnKTtcbiAgICAgIH0pO1xuICBcbiAgICB9KTtcbiAgKi9cbiAgXG4gICAgZGVzY3JpYmUoJ0NoZWNrIFZhbGlkIElucHV0JywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgIGl0KCdSZXR1cm5zIHRydWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kID0gJ0BzY3J1bWJvdCAvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBVQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5jaGVja1ZhbGlkSW5wdXQoT3B0aW9ucyk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCB0cnVlKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgICBpdCgnUmV0dXJucyBmYWxzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmQgPSAnQHJlcG9zIC9yZXBvIDEyMzQnO1xuICAgICAgICB2YXIgT3B0aW9ucyA9IHtcbiAgICAgICAgICByZXF1ZXN0OiBudWxsLFxuICAgICAgICAgIHJlc3BvbnNlOiBudWxsLFxuICAgICAgICAgIFVDb21tYW5kOiBDb21tYW5kXG4gICAgICAgIH07XG4gICAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmNoZWNrVmFsaWRJbnB1dChPcHRpb25zKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsIGZhbHNlKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICBkZXNjcmliZSgnR2V0IENvbW1hbmQnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgaXQoJ1JldHVybiBWYWxpZCBjb21tYW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVUNvbW1hbmQgPSAnQHNjcnVtYm90IC9yZXBvIDEyMzQnO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcvcmVwbyAxMjM0Jyk7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgICAgaXQoJ1JldHVybnMgQmxhbmsgSW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBVQ29tbWFuZCA9ICcnO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcnKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICBkZXNjcmliZSgnVmFsaWRhdGUgQ29tbWFuZHMnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgaXQoJ1JldHVybiBVcmwgT2JqZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZCA9ICcvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBDb21tYW5kOiBDb21tYW5kXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0T2JqID0ge1xuICAgICAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgICAgIFVybDogJycsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS52YWxpZGF0ZUNvbW1hbmRzKE9wdGlvbnMpO1xuICBcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gICAgfSk7XG4gIFxuICAgIGRlc2NyaWJlKCdHZXRJc3N1ZVVybCcsIGZ1bmN0aW9uICgpIHtcbiAgXG4gIFxuICAgICAgaXQoJ1JldHVybiBQaXBlbGluZSBVcmwgT2JqZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZEFyciA9IFsnL2lzc3VlJywgJzEyMzQnLCcxMicsICdwaXBlbGluZSddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2lzc3VlIDEyMzQgMTIgcGlwZWxpbmUnO1xuICAgICAgICB2YXIgUmVwb0lkID0gJzEyMzQnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2lzc3Vlcy8xMicsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOiBcIkdldFBpcGVsaW5lXCJcbiAgICAgICAgfTtcbiAgXG4gICAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgICAgaXQoJ1Bvc2l0aW9uIG51bWJlciBkaWZmZXJlbnQgdGhhbiBwYXNzZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gWycvaXNzdWUnLCAnMTInLCAnLXAnLCAnNDU2JywgJzE2J107XG4gICAgICAgIHZhciBVc2VyQ29tbWFuZCA9ICcvaXNzdWUgMTIgLXAgNDU2IDEnO1xuICAgICAgICB2YXIgUmVwb0lkID0gJzEyMzQnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2lzc3Vlcy8xMi9tb3ZlcycsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keToge1xuICAgICAgICAgICAgcGlwZWxpbmVfaWQ6ICc0NTYnLFxuICAgICAgICAgICAgcG9zaXRpb246ICcxJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgXG4gICAgICAgIGFzc2VydC5ub3REZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICBcbiAgICB9KTtcbiAgXG4gIFxuICAgIGRlc2NyaWJlKCdHZXRFcGljVXJsJywgZnVuY3Rpb24gKCkge1xuICBcbiAgXG4gICAgICBpdCgnUmV0dXJucyAgd2hlbiBub3QgZXF1YWwgcmVwb3NpdG9yeSBpZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9lcGljMSddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2VwaWMxJztcbiAgICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0MTEnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2VwaWNzJyxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0VwaWNJc3N1ZXMnXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0Lm5vdERlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgfSk7XG4iXX0=