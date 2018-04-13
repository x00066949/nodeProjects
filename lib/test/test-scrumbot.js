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
    /* 
    Given: valid command
    WHEN: command = @scrumbot /repo 1234
    THEN: Result = '/repo 1234'
    */
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

    /* 
    Given: valid command
    WHEN: command = @scrumbot /repo 1234
    THEN: Result = '/repo 1234'
    */
    it('Returns false', function () {
      var Command = '@repos /repo helloworld';
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

    /* 
    Given: valid command
    WHEN: command = @scrumbot /repo 1234
    THEN: Result = '/repo 1234'
    */
    it('Return Valid command', function () {
      var UCommand = '@scrumbot /repo 1234';
      var Result = BotService.getCommand(UCommand);

      assert.equal(Result, '/repo 1234');
    });

    /* 
    Given: invalid command
    WHEN: command = ''
    THEN: Result = ''
    */
    it('Returns Blank Input for blank command', function () {
      var UCommand = '';
      var Result = BotService.getCommand(UCommand);

      assert.equal(Result, '');
    });

    /* 
    Given: invalid command
    WHEN: command = undefined
    THEN: Result = ''
    */
    it('Returns Blank Input for undefined', function () {
      var UCommand = 'undefined';
      var Result = BotService.getCommand(UCommand);

      assert.equal(Result, '');
    });

    /* 
    Given: invalid command
    WHEN: command = null
    THEN: Result = ''
    */
    it('Returns Blank Input for null', function () {
      var UCommand = null;
      var Result = BotService.getCommand(UCommand);

      assert.equal(Result, '');
    });
  });

  describe('Validate Commands', function () {

    /* 
      Given: valid command
      WHEN: correct syntax = /repo hello
      THEN: Isgit = true, IsValid = true
    */
    it('Return Url Object', function () {
      var Command = '/repo hello';
      var Options = {
        request: null,
        response: null,
        Command: Command
      };

      var ResultObj = {
        IsValid: true,
        Url: 'repos/x00066949/hello',
        Method: 'GET',
        Body: null,
        IsGit: true
      };

      var Result = BotService.validateCommands(Options);

      assert.deepEqual(Result, ResultObj);
    });

    //});

    /* 
      Given: invalid command
      WHEN: wron repo syntax
      THEN: ResutObj.IsValid = false
    */
    it('Test wrong repo syntax', function () {
      var Command = '/rrr hello';
      var Options = {
        request: null,
        response: null,
        Command: Command
      };

      var ResultObj = {
        IsValid: true,
        Url: 'wrongCommand',
        Method: 'GET',
        Body: null

      };

      var Result = BotService.validateCommands(Options);

      assert.deepEqual(Result, ResultObj);
    });
  });

  describe('GetIssueUrl', function () {

    /* 
      Given: valid command
      WHEN: /issue 1234 12 pipeline
      THEN: UrlType = GetPipeline
    */

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

    /* 
      Given: invalid command
      WHEN: /issue 1234 12 pipe
      THEN: UrlType = "", IsValid = false
    */
    it('Return Pipeline Url Object', function () {
      var CommandArr = ['/issue', '1234', '12', 'pipe'];
      var UserCommand = '/issue 1234 12 pipe';
      var RepoId = '1234';

      var ResultObj = {
        IsValid: false,
        Url: '',
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      var Result = BotService.getIssueUrl(UserCommand, CommandArr, RepoId);

      assert.deepEqual(Result, ResultObj);
    });

    /* 
      Given: valid command
      WHEN: /issue + move pipeline 
      THEN: UrlType = "", IsValid = true
    */
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

    /* 
     Given: valid command
     WHEN: repo id do not match
     THEN: UrlType != "EpicIssues", IsValid != true
    */
    it('Returns non matching results when not repository id dont match', function () {
      var CommandArr = ['/epic', '1'];
      var UserCommand = '/epic 1';
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

    /* 
      Given: valid command
      WHEN: /epic 1
      THEN: UrlType = "EpicIssues", IsValid = true
    */

    it('Works if epic request matches', function () {
      var CommandArr = ['/epic', '1'];
      var UserCommand = '/epic 1';
      var RepoId = '1234';

      var ResultObj = {
        IsValid: true,
        Url: 'p1/repositories/1234/epics',
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType: 'EpicIssues'
      };

      var Result = BotService.getEpicUrl(UserCommand, CommandArr, RepoId);

      assert.deepEqual(Result, ResultObj);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwiYXNzZXJ0IiwicmVxdWlyZSIsIkJvdFNlcnZpY2UiLCJwb3N0c3B5IiwiY2FjaGUiLCJyZXNvbHZlIiwiZXhwb3J0cyIsInBvc3QiLCJ1cmkiLCJvcHQiLCJjYiIsInNjcnVtYm90IiwidG9rZW4iLCJzaWduIiwiZXhwaXJlc0luIiwiZGVzY3JpYmUiLCJvYXV0aCIsImF1dGgiLCJ0byIsImRlZXAiLCJlcXVhbCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwic2V0SW1tZWRpYXRlIiwidW5kZWZpbmVkIiwic3RhdHVzQ29kZSIsImJvZHkiLCJhY2Nlc3NfdG9rZW4iLCJpdCIsImRvbmUiLCJjaGVja3MiLCJjaGVjayIsIndlYmFwcCIsImVyciIsImFwcCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiLCJDb21tYW5kIiwiT3B0aW9ucyIsInJlcXVlc3QiLCJVQ29tbWFuZCIsIlJlc3VsdCIsImNoZWNrVmFsaWRJbnB1dCIsImdldENvbW1hbmQiLCJSZXN1bHRPYmoiLCJJc1ZhbGlkIiwiVXJsIiwiTWV0aG9kIiwiQm9keSIsIklzR2l0IiwidmFsaWRhdGVDb21tYW5kcyIsImRlZXBFcXVhbCIsIkNvbW1hbmRBcnIiLCJVc2VyQ29tbWFuZCIsIlJlcG9JZCIsIlVybFR5cGUiLCJnZXRJc3N1ZVVybCIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJub3REZWVwRXF1YWwiLCJnZXRFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOzs0QkFBWUEsWTs7QUFDWjs7OztBQUVBLElBQUlDLFNBQVNDLFFBQVEsUUFBUixDQUFiO0FBQ0EsSUFBSUMsYUFB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QyxjQUFNLElBSlE7QUFLZEMsZUFBTyxLQUxPO0FBTWRNLGlCQUFTO0FBTkssT0FBaEI7O0FBU0EsVUFBSWQsU0FBU3JELFdBQVd3RSxVQUFYLENBQXNCUCxXQUF0QixFQUFtQ0QsVUFBbkMsRUFBK0NFLE1BQS9DLENBQWI7O0FBRUFwRSxhQUFPaUUsU0FBUCxDQUFpQlYsTUFBakIsRUFBeUJHLFNBQXpCO0FBQ0QsS0FqQkQ7QUFtQkQsR0FuREQ7QUFzREQsQ0F6U0QiLCJmaWxlIjoidGVzdC1zY3J1bWJvdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgeyBwb3N0IH0gZnJvbSAncmVxdWVzdCc7XG5cbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBCb3RTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2NydW1fYm9hcmQnKTtcblxuLy9tb2NrIHJlcXVlc3QgbW9kdWxlXG5sZXQgcG9zdHNweTtcbnJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKCdyZXF1ZXN0JyldLmV4cG9ydHMgPSB7XG4gIHBvc3Q6ICh1cmksIG9wdCwgY2IpID0+IHBvc3RzcHkodXJpLCBvcHQsIGNiKVxufTtcblxuLy8gTG9hZCB0aGUgc2NydW1ib3QgYXBwXG5jb25zdCBzY3J1bWJvdCA9IHJlcXVpcmUoJy4uL2luZGV4Jyk7XG5cbi8vIEdlbmVyYXRlIGEgdGVzdCBPQXV0aCB0b2tlblxuY29uc3QgdG9rZW4gPSBqc29ud2VidG9rZW4uc2lnbih7fSwgJ3NlY3JldCcsIHsgZXhwaXJlc0luOiAnMWgnIH0pO1xuXG5kZXNjcmliZSgnd2F0c29ud29yay1zY3J1bWJvdCcsICgpID0+IHtcblxuICAvLyBNb2NrIHRoZSBXYXRzb24gV29yayBPQXV0aCBzZXJ2aWNlXG4gIGNvbnN0IG9hdXRoID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgIGV4cGVjdChvcHQuYXV0aCkudG8uZGVlcC5lcXVhbCh7XG4gICAgICB1c2VyOiAndGVzdGFwcGlkJyxcbiAgICAgIHBhc3M6ICd0ZXN0c2VjcmV0J1xuICAgIH0pO1xuICAgIGV4cGVjdChvcHQuanNvbikudG8uZXF1YWwodHJ1ZSk7XG4gICAgZXhwZWN0KG9wdC5mb3JtKS50by5kZWVwLmVxdWFsKHtcbiAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gT0F1dGggdG9rZW5cbiAgICBzZXRJbW1lZGlhdGUoKCkgPT4gY2IodW5kZWZpbmVkLCB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogdG9rZW5cbiAgICAgIH1cbiAgICB9KSk7XG4gIH07XG5cbiAgaXQoJ2F1dGhlbnRpY2F0ZXMgdGhlIGFwcCcsIChkb25lKSA9PiB7XG5cbiAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICBsZXQgY2hlY2tzID0gMDtcbiAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgIGlmICgrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgZG9uZSgpO1xuICAgIH07XG5cbiAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgIGlmICh1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBFY2hvIFdlYiBhcHBcbiAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgIGNoZWNrKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdoYW5kbGVzIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzJywgKGRvbmUpID0+IHtcblxuICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgIGxldCBjaGVja3MgPSAwO1xuICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgaWYgKCsrY2hlY2tzID09PSAyKVxuICAgICAgICBkb25lKCk7XG4gICAgfTtcblxuICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAvLyBFeHBlY3QgYSBjYWxsIHRvIGdldCBhbiBPQXV0aCB0b2tlbiBmb3IgdGhlIGFwcFxuICAgICAgaWYgKHVyaSA9PT0gJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicpIHtcbiAgICAgICAgb2F1dGgodXJpLCBvcHQsIGNiKTtcbiAgICAgICAgY2hlY2soKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgdGhlIFdlYiBhcHBcbiAgICBzY3J1bWJvdC53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcblxuICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuXG4gICAgICAvLyBQb3N0IGEgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdCB0byB0aGUgYXBwXG4gICAgICBwb3N0KCdodHRwOi8vbG9jYWxob3N0OicgKyBzZXJ2ZXIuYWRkcmVzcygpLnBvcnQgKyAnL3NjcnVtYm90Jywge1xuXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICdYLU9VVEJPVU5ELVRPS0VOJzpcbiAgICAgICAgICAgICdmNTFmZjVjOTFlOTljNjNiNmZkZTllMzk2YmI2ZWEzMDIzNzI3Zjc0ZjE4NTNmMjlhYjU3MWNmZGFhYmE0YzAzJ1xuICAgICAgICB9LFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdHlwZTogJ3ZlcmlmaWNhdGlvbicsXG4gICAgICAgICAgY2hhbGxlbmdlOiAndGVzdGNoYWxsZW5nZSdcbiAgICAgICAgfVxuICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICAgICAgICBleHBlY3QocmVzLnN0YXR1c0NvZGUpLnRvLmVxdWFsKDIwMCk7XG5cbiAgICAgICAgLy8gRXhwZWN0IGNvcnJlY3QgY2hhbGxlbmdlIHJlc3BvbnNlIGFuZCBzaWduYXR1cmVcbiAgICAgICAgZXhwZWN0KHJlcy5ib2R5LnJlc3BvbnNlKS50by5lcXVhbCgndGVzdGNoYWxsZW5nZScpO1xuICAgICAgICBleHBlY3QocmVzLmhlYWRlcnNbJ3gtb3V0Ym91bmQtdG9rZW4nXSkudG8uZXF1YWwoXG4gICAgICAgICAgLy8gU2lnbmF0dXJlIG9mIHRoZSB0ZXN0IGJvZHkgd2l0aCB0aGUgV2ViaG9vayBzZWNyZXRcbiAgICAgICAgICAnODc2ZDFmOWRlMWIzNjUxNGQzMGJjZjQ4ZDhjNDczMWE2OTUwMDczMDg1NGE5NjRlMzE3NjQxNTlkNzViODhmMScpO1xuXG4gICAgICAgIGNoZWNrKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG5cbiAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICBsZXQgY2hlY2tzID0gMDtcbiAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgIGlmICgrK2NoZWNrcyA9PT0gMilcbiAgICAgICAgZG9uZSgpO1xuICAgIH07XG5cbiAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHBcbiAgICAgIGlmICh1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBXZWIgYXBwXG4gICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG5cbiAgICAgIC8vIExpc3RlbiBvbiBhbiBlcGhlbWVyYWwgcG9ydFxuICAgICAgY29uc3Qgc2VydmVyID0gYXBwLmxpc3RlbigwKTtcblxuICAgICAgLy8gUG9zdCBhIGNoYXQgbWVzc2FnZSB0byB0aGUgYXBwXG4gICAgICBwb3N0KCdodHRwOi8vbG9jYWxob3N0OicgKyBzZXJ2ZXIuYWRkcmVzcygpLnBvcnQgKyAnL3NjcnVtYm90Jywge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgLy8gVGVzdCBhbiBpbnZhbGlkIGJvZHkgc2lnbmF0dXJlXG4gICAgICAgICAgICAnaW52YWxpZHNpZ25hdHVyZSdcbiAgICAgICAgfSxcbiAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHR5cGU6ICdtZXNzYWdlLWNyZWF0ZWQnLFxuICAgICAgICAgIGNvbnRlbnQ6ICdIZWxsbyB0aGVyZScsXG4gICAgICAgICAgdXNlck5hbWU6ICdKYW5lJyxcbiAgICAgICAgICBzcGFjZUlkOiAndGVzdHNwYWNlJ1xuICAgICAgICB9XG4gICAgICB9LCAoZXJyLCB2YWwpID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG5cbiAgICAgICAgLy8gRXhwZWN0IHRoZSByZXF1ZXN0IHRvIGJlIHJlamVjdGVkXG4gICAgICAgIGV4cGVjdCh2YWwuc3RhdHVzQ29kZSkudG8uZXF1YWwoNDAxKTtcblxuICAgICAgICBjaGVjaygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICAvKlxuICAgICAgaXQoJ3JlamVjdHMgbWVzc2FnZXMgd2l0aCBpbnZhbGlkIHNpZ25hdHVyZScsIChkb25lKSA9PiB7XG4gICAgICAgIFxuICBcbiAgICAgIH0pO1xuICAqL1xufSk7XG5cblxuZGVzY3JpYmUoJ0JvdFNlcnZpY2UgVGVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgLypcbiAgICBkZXNjcmliZSgndGVzdHdlbCBUZXN0JywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgIGl0KCdJdCBTaG91bGQgUmV0dXJuIFdlbGNvbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFzc2VydC5lcXVhbChCb3RTZXJ2aWNlLnRlc3R3ZWwoKSwgJ1dlbGNvbWUnKTtcbiAgICAgIH0pO1xuICBcbiAgICB9KTtcbiAgKi9cblxuICBkZXNjcmliZSgnQ2hlY2sgVmFsaWQgSW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgLyogXG4gICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICBXSEVOOiBjb21tYW5kID0gQHNjcnVtYm90IC9yZXBvIDEyMzRcbiAgICBUSEVOOiBSZXN1bHQgPSAnL3JlcG8gMTIzNCdcbiAgICAqL1xuICAgIGl0KCdSZXR1cm5zIHRydWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgQ29tbWFuZCA9ICdAc2NydW1ib3QgL3JlcG8gMTIzNCc7XG4gICAgICB2YXIgT3B0aW9ucyA9IHtcbiAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgcmVzcG9uc2U6IG51bGwsXG4gICAgICAgIFVDb21tYW5kOiBDb21tYW5kXG4gICAgICB9O1xuICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuY2hlY2tWYWxpZElucHV0KE9wdGlvbnMpO1xuXG4gICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCB0cnVlKTtcbiAgICB9KTtcblxuICAgIC8qIFxuICAgIEdpdmVuOiB2YWxpZCBjb21tYW5kXG4gICAgV0hFTjogY29tbWFuZCA9IEBzY3J1bWJvdCAvcmVwbyAxMjM0XG4gICAgVEhFTjogUmVzdWx0ID0gJy9yZXBvIDEyMzQnXG4gICAgKi9cbiAgICBpdCgnUmV0dXJucyBmYWxzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBDb21tYW5kID0gJ0ByZXBvcyAvcmVwbyBoZWxsb3dvcmxkJztcbiAgICAgIHZhciBPcHRpb25zID0ge1xuICAgICAgICByZXF1ZXN0OiBudWxsLFxuICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgVUNvbW1hbmQ6IENvbW1hbmRcbiAgICAgIH07XG4gICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5jaGVja1ZhbGlkSW5wdXQoT3B0aW9ucyk7XG5cbiAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsIGZhbHNlKTtcbiAgICB9KTtcblxuXG4gIH0pO1xuXG5cbiAgZGVzY3JpYmUoJ0dldCBDb21tYW5kJywgZnVuY3Rpb24gKCkge1xuXG4gICAgLyogXG4gICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICBXSEVOOiBjb21tYW5kID0gQHNjcnVtYm90IC9yZXBvIDEyMzRcbiAgICBUSEVOOiBSZXN1bHQgPSAnL3JlcG8gMTIzNCdcbiAgICAqL1xuICAgIGl0KCdSZXR1cm4gVmFsaWQgY29tbWFuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBVQ29tbWFuZCA9ICdAc2NydW1ib3QgL3JlcG8gMTIzNCc7XG4gICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcblxuICAgICAgYXNzZXJ0LmVxdWFsKFJlc3VsdCwgJy9yZXBvIDEyMzQnKTtcbiAgICB9KTtcblxuICAgIC8qIFxuICAgIEdpdmVuOiBpbnZhbGlkIGNvbW1hbmRcbiAgICBXSEVOOiBjb21tYW5kID0gJydcbiAgICBUSEVOOiBSZXN1bHQgPSAnJ1xuICAgICovXG4gICAgaXQoJ1JldHVybnMgQmxhbmsgSW5wdXQgZm9yIGJsYW5rIGNvbW1hbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgVUNvbW1hbmQgPSAnJztcbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldENvbW1hbmQoVUNvbW1hbmQpO1xuXG4gICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCAnJyk7XG4gICAgfSk7XG5cbiAgICAvKiBcbiAgICBHaXZlbjogaW52YWxpZCBjb21tYW5kXG4gICAgV0hFTjogY29tbWFuZCA9IHVuZGVmaW5lZFxuICAgIFRIRU46IFJlc3VsdCA9ICcnXG4gICAgKi9cbiAgICBpdCgnUmV0dXJucyBCbGFuayBJbnB1dCBmb3IgdW5kZWZpbmVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIFVDb21tYW5kID0gJ3VuZGVmaW5lZCc7XG4gICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcblxuICAgICAgYXNzZXJ0LmVxdWFsKFJlc3VsdCwgJycpO1xuICAgIH0pO1xuXG4gICAgLyogXG4gICAgR2l2ZW46IGludmFsaWQgY29tbWFuZFxuICAgIFdIRU46IGNvbW1hbmQgPSBudWxsXG4gICAgVEhFTjogUmVzdWx0ID0gJydcbiAgICAqL1xuICAgIGl0KCdSZXR1cm5zIEJsYW5rIElucHV0IGZvciBudWxsJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIFVDb21tYW5kID0gbnVsbDtcbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldENvbW1hbmQoVUNvbW1hbmQpO1xuXG4gICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCAnJyk7XG4gICAgfSk7XG5cblxuICB9KTtcblxuXG4gIGRlc2NyaWJlKCdWYWxpZGF0ZSBDb21tYW5kcycsIGZ1bmN0aW9uICgpIHtcblxuICAgIC8qIFxuICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IGNvcnJlY3Qgc3ludGF4ID0gL3JlcG8gaGVsbG9cbiAgICAgIFRIRU46IElzZ2l0ID0gdHJ1ZSwgSXNWYWxpZCA9IHRydWVcbiAgICAqL1xuICAgIGl0KCdSZXR1cm4gVXJsIE9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBDb21tYW5kID0gJy9yZXBvIGhlbGxvJztcbiAgICAgIHZhciBPcHRpb25zID0ge1xuICAgICAgICByZXF1ZXN0OiBudWxsLFxuICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgQ29tbWFuZDogQ29tbWFuZFxuICAgICAgfTtcblxuICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiAncmVwb3MveDAwMDY2OTQ5L2hlbGxvJyxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IHRydWVcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLnZhbGlkYXRlQ29tbWFuZHMoT3B0aW9ucyk7XG5cbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgIH0pO1xuXG4gICAgLy99KTtcblxuICAgIC8qIFxuICAgICAgR2l2ZW46IGludmFsaWQgY29tbWFuZFxuICAgICAgV0hFTjogd3JvbiByZXBvIHN5bnRheFxuICAgICAgVEhFTjogUmVzdXRPYmouSXNWYWxpZCA9IGZhbHNlXG4gICAgKi9cbiAgICBpdCgnVGVzdCB3cm9uZyByZXBvIHN5bnRheCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBDb21tYW5kID0gJy9ycnIgaGVsbG8nO1xuICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgIHJlcXVlc3Q6IG51bGwsXG4gICAgICAgIHJlc3BvbnNlOiBudWxsLFxuICAgICAgICBDb21tYW5kOiBDb21tYW5kXG4gICAgICB9O1xuXG4gICAgICB2YXIgUmVzdWx0T2JqID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6ICd3cm9uZ0NvbW1hbmQnLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuXG4gICAgICB9O1xuXG4gICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS52YWxpZGF0ZUNvbW1hbmRzKE9wdGlvbnMpO1xuXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICB9KTtcblxuICB9KTtcblxuICBkZXNjcmliZSgnR2V0SXNzdWVVcmwnLCBmdW5jdGlvbiAoKSB7XG5cblxuICAgIC8qIFxuICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IC9pc3N1ZSAxMjM0IDEyIHBpcGVsaW5lXG4gICAgICBUSEVOOiBVcmxUeXBlID0gR2V0UGlwZWxpbmVcbiAgICAqL1xuXG4gICAgaXQoJ1JldHVybiBQaXBlbGluZSBVcmwgT2JqZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9pc3N1ZScsICcxMjM0JywgJzEyJywgJ3BpcGVsaW5lJ107XG4gICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2lzc3VlIDEyMzQgMTIgcGlwZWxpbmUnO1xuICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0JztcblxuICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiAncDEvcmVwb3NpdG9yaWVzLzEyMzQvaXNzdWVzLzEyJyxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiBcIkdldFBpcGVsaW5lXCJcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICB9KTtcblxuICAgIC8qIFxuICAgICAgR2l2ZW46IGludmFsaWQgY29tbWFuZFxuICAgICAgV0hFTjogL2lzc3VlIDEyMzQgMTIgcGlwZVxuICAgICAgVEhFTjogVXJsVHlwZSA9IFwiXCIsIElzVmFsaWQgPSBmYWxzZVxuICAgICovXG4gICAgaXQoJ1JldHVybiBQaXBlbGluZSBVcmwgT2JqZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9pc3N1ZScsICcxMjM0JywgJzEyJywgJ3BpcGUnXTtcbiAgICAgIHZhciBVc2VyQ29tbWFuZCA9ICcvaXNzdWUgMTIzNCAxMiBwaXBlJztcbiAgICAgIHZhciBSZXBvSWQgPSAnMTIzNCc7XG5cbiAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgICBVcmw6ICcnLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgICBhc3NlcnQuZGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICB9KTtcblxuICAgIC8qIFxuICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IC9pc3N1ZSArIG1vdmUgcGlwZWxpbmUgXG4gICAgICBUSEVOOiBVcmxUeXBlID0gXCJcIiwgSXNWYWxpZCA9IHRydWVcbiAgICAqL1xuICAgIGl0KCdQb3NpdGlvbiBudW1iZXIgZGlmZmVyZW50IHRoYW4gcGFzc2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9pc3N1ZScsICcxMicsICctcCcsICc0NTYnLCAnMTYnXTtcbiAgICAgIHZhciBVc2VyQ29tbWFuZCA9ICcvaXNzdWUgMTIgLXAgNDU2IDEnO1xuICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0JztcblxuICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiAncDEvcmVwb3NpdG9yaWVzLzEyMzQvaXNzdWVzLzEyL21vdmVzJyxcbiAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIEJvZHk6IHtcbiAgICAgICAgICBwaXBlbGluZV9pZDogJzQ1NicsXG4gICAgICAgICAgcG9zaXRpb246ICcxJ1xuICAgICAgICB9LFxuICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgICBhc3NlcnQubm90RGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICB9KTtcblxuXG4gIH0pO1xuXG5cbiAgZGVzY3JpYmUoJ0dldEVwaWNVcmwnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAvKiBcbiAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgV0hFTjogcmVwbyBpZCBkbyBub3QgbWF0Y2hcbiAgICAgVEhFTjogVXJsVHlwZSAhPSBcIkVwaWNJc3N1ZXNcIiwgSXNWYWxpZCAhPSB0cnVlXG4gICAqL1xuICAgIGl0KCdSZXR1cm5zIG5vbiBtYXRjaGluZyByZXN1bHRzIHdoZW4gbm90IHJlcG9zaXRvcnkgaWQgZG9udCBtYXRjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBDb21tYW5kQXJyID0gWycvZXBpYycsICcxJ107XG4gICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2VwaWMgMSc7XG4gICAgICB2YXIgUmVwb0lkID0gJzEyMzQxMSc7XG5cbiAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2VwaWNzJyxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnRXBpY0lzc3VlcydcbiAgICAgIH07XG5cbiAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldEVwaWNVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICAgIGFzc2VydC5ub3REZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgIH0pO1xuXG4gICAgLyogXG4gICAgICBHaXZlbjogdmFsaWQgY29tbWFuZFxuICAgICAgV0hFTjogL2VwaWMgMVxuICAgICAgVEhFTjogVXJsVHlwZSA9IFwiRXBpY0lzc3Vlc1wiLCBJc1ZhbGlkID0gdHJ1ZVxuICAgICovXG5cbiAgICBpdCgnV29ya3MgaWYgZXBpYyByZXF1ZXN0IG1hdGNoZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgQ29tbWFuZEFyciA9IFsnL2VwaWMnLCAnMSddO1xuICAgICAgdmFyIFVzZXJDb21tYW5kID0gJy9lcGljIDEnO1xuICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0JztcblxuICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiAncDEvcmVwb3NpdG9yaWVzLzEyMzQvZXBpY3MnLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdFcGljSXNzdWVzJ1xuICAgICAgfTtcblxuICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgfSk7XG5cbiAgfSk7XG5cblxufSk7XG4iXX0=