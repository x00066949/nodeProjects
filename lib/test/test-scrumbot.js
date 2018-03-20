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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3Qtc2NydW1ib3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwiYXNzZXJ0IiwicmVxdWlyZSIsIkJvdFNlcnZpY2UiLCJwb3N0c3B5IiwiY2FjaGUiLCJyZXNvbHZlIiwiZXhwb3J0cyIsInBvc3QiLCJ1cmkiLCJvcHQiLCJjYiIsInNjcnVtYm90IiwidG9rZW4iLCJzaWduIiwiZXhwaXJlc0luIiwiZGVzY3JpYmUiLCJvYXV0aCIsImF1dGgiLCJ0byIsImRlZXAiLCJlcXVhbCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwic2V0SW1tZWRpYXRlIiwidW5kZWZpbmVkIiwic3RhdHVzQ29kZSIsImJvZHkiLCJhY2Nlc3NfdG9rZW4iLCJpdCIsImRvbmUiLCJjaGVja3MiLCJjaGVjayIsIndlYmFwcCIsImVyciIsImFwcCIsInNlcnZlciIsImxpc3RlbiIsImFkZHJlc3MiLCJwb3J0IiwiaGVhZGVycyIsInR5cGUiLCJjaGFsbGVuZ2UiLCJyZXMiLCJyZXNwb25zZSIsImNvbnRlbnQiLCJ1c2VyTmFtZSIsInNwYWNlSWQiLCJ2YWwiLCJDb21tYW5kIiwiT3B0aW9ucyIsInJlcXVlc3QiLCJVQ29tbWFuZCIsIlJlc3VsdCIsImNoZWNrVmFsaWRJbnB1dCIsImdldENvbW1hbmQiLCJSZXN1bHRPYmoiLCJJc1ZhbGlkIiwiVXJsIiwiTWV0aG9kIiwiQm9keSIsIklzR2l0IiwidmFsaWRhdGVDb21tYW5kcyIsImRlZXBFcXVhbCIsIkNvbW1hbmRBcnIiLCJVc2VyQ29tbWFuZCIsIlJlcG9JZCIsIlVybFR5cGUiLCJnZXRJc3N1ZVVybCIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJub3REZWVwRXF1YWwiLCJnZXRFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOzs0QkFBWUEsWTs7QUFDWjs7OztBQUVBLElBQUlDLFNBQVNDLFFBQVEsUUFBUixDQUFiO0FBQ0EsSUFBSUMsYUFB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QyxjQUFNLElBSlE7QUFLZEMsZUFBTyxLQUxPO0FBTWRNLGlCQUFRO0FBTk0sT0FBaEI7O0FBU0EsVUFBSWQsU0FBU3JELFdBQVd3RSxVQUFYLENBQXNCUCxXQUF0QixFQUFtQ0QsVUFBbkMsRUFBK0NFLE1BQS9DLENBQWI7O0FBRUFwRSxhQUFPaUUsU0FBUCxDQUFpQlYsTUFBakIsRUFBeUJHLFNBQXpCO0FBQ0QsS0FqQkQ7QUFtQkQsR0FuREQ7QUFzREQsQ0F6U0QiLCJmaWxlIjoidGVzdC1zY3J1bWJvdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgeyBwb3N0IH0gZnJvbSAncmVxdWVzdCc7XG5cbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBCb3RTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2NydW1fYm9hcmQnKTtcblxuLy9tb2NrIHJlcXVlc3QgbW9kdWxlXG5sZXQgcG9zdHNweTtcbnJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKCdyZXF1ZXN0JyldLmV4cG9ydHMgPSB7XG4gIHBvc3Q6ICh1cmksIG9wdCwgY2IpID0+IHBvc3RzcHkodXJpLCBvcHQsIGNiKVxufTtcblxuLy8gTG9hZCB0aGUgc2NydW1ib3QgYXBwXG5jb25zdCBzY3J1bWJvdCA9IHJlcXVpcmUoJy4uL2luZGV4Jyk7XG5cbi8vIEdlbmVyYXRlIGEgdGVzdCBPQXV0aCB0b2tlblxuY29uc3QgdG9rZW4gPSBqc29ud2VidG9rZW4uc2lnbih7fSwgJ3NlY3JldCcsIHsgZXhwaXJlc0luOiAnMWgnIH0pO1xuXG5kZXNjcmliZSgnd2F0c29ud29yay1zY3J1bWJvdCcsICgpID0+IHtcblxuICAvLyBNb2NrIHRoZSBXYXRzb24gV29yayBPQXV0aCBzZXJ2aWNlXG4gIGNvbnN0IG9hdXRoID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgIGV4cGVjdChvcHQuYXV0aCkudG8uZGVlcC5lcXVhbCh7XG4gICAgICB1c2VyOiAndGVzdGFwcGlkJyxcbiAgICAgIHBhc3M6ICd0ZXN0c2VjcmV0J1xuICAgIH0pO1xuICAgIGV4cGVjdChvcHQuanNvbikudG8uZXF1YWwodHJ1ZSk7XG4gICAgZXhwZWN0KG9wdC5mb3JtKS50by5kZWVwLmVxdWFsKHtcbiAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gT0F1dGggdG9rZW5cbiAgICBzZXRJbW1lZGlhdGUoKCkgPT4gY2IodW5kZWZpbmVkLCB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogdG9rZW5cbiAgICAgIH1cbiAgICB9KSk7XG4gIH07XG5cbiAgaXQoJ2F1dGhlbnRpY2F0ZXMgdGhlIGFwcCcsIChkb25lKSA9PiB7XG5cbiAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICBsZXQgY2hlY2tzID0gMDtcbiAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICBkb25lKCk7XG4gICAgfTtcblxuICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAvLyBFeHBlY3QgYSBjYWxsIHRvIGdldCBhbiBPQXV0aCB0b2tlbiBmb3IgdGhlIGFwcFxuICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICBjaGVjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIENyZWF0ZSB0aGUgRWNobyBXZWIgYXBwXG4gICAgc2NydW1ib3Qud2ViYXBwKCd0ZXN0YXBwaWQnLCAndGVzdHNlY3JldCcsICd0ZXN0d3NlY3JldCcsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gICAgICBjaGVjaygpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gICAgaXQoJ2hhbmRsZXMgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHMnLCAoZG9uZSkgPT4ge1xuICBcbiAgICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgICAgbGV0IGNoZWNrcyA9IDA7XG4gICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgaWYoKytjaGVja3MgPT09IDIpXG4gICAgICAgICAgZG9uZSgpO1xuICAgICAgfTtcbiAgXG4gICAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgICAvLyBFeHBlY3QgYSBjYWxsIHRvIGdldCBhbiBPQXV0aCB0b2tlbiBmb3IgdGhlIGFwcFxuICAgICAgICBpZih1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgICAgb2F1dGgodXJpLCBvcHQsIGNiKTtcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgXG4gICAgICAvLyBDcmVhdGUgdGhlIFdlYiBhcHBcbiAgICAgIHNjcnVtYm90LndlYmFwcCgndGVzdGFwcGlkJywgJ3Rlc3RzZWNyZXQnLCAndGVzdHdzZWNyZXQnLCAoZXJyLCBhcHApID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gIFxuICAgICAgICAvLyBMaXN0ZW4gb24gYW4gZXBoZW1lcmFsIHBvcnRcbiAgICAgICAgY29uc3Qgc2VydmVyID0gYXBwLmxpc3RlbigwKTtcbiAgXG4gICAgICAgIC8vIFBvc3QgYSBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0IHRvIHRoZSBhcHBcbiAgICAgICAgcG9zdCgnaHR0cDovL2xvY2FsaG9zdDonICsgc2VydmVyLmFkZHJlc3MoKS5wb3J0ICsgJy9zY3J1bWJvdCcsIHtcbiAgICAgICAgICBcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgLy8gU2lnbmF0dXJlIG9mIHRoZSB0ZXN0IGJvZHkgd2l0aCB0aGUgV2ViaG9vayBzZWNyZXRcbiAgICAgICAgICAgICdYLU9VVEJPVU5ELVRPS0VOJzpcbiAgICAgICAgICAgICAgJ2Y1MWZmNWM5MWU5OWM2M2I2ZmRlOWUzOTZiYjZlYTMwMjM3MjdmNzRmMTg1M2YyOWFiNTcxY2ZkYWFiYTRjMDMnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHR5cGU6ICd2ZXJpZmljYXRpb24nLFxuICAgICAgICAgICAgY2hhbGxlbmdlOiAndGVzdGNoYWxsZW5nZSdcbiAgICAgICAgICB9XG4gICAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICAgICAgICAgIGV4cGVjdChyZXMuc3RhdHVzQ29kZSkudG8uZXF1YWwoMjAwKTtcbiAgXG4gICAgICAgICAgLy8gRXhwZWN0IGNvcnJlY3QgY2hhbGxlbmdlIHJlc3BvbnNlIGFuZCBzaWduYXR1cmVcbiAgICAgICAgICBleHBlY3QocmVzLmJvZHkucmVzcG9uc2UpLnRvLmVxdWFsKCd0ZXN0Y2hhbGxlbmdlJyk7XG4gICAgICAgICAgZXhwZWN0KHJlcy5oZWFkZXJzWyd4LW91dGJvdW5kLXRva2VuJ10pLnRvLmVxdWFsKFxuICAgICAgICAgICAgLy8gU2lnbmF0dXJlIG9mIHRoZSB0ZXN0IGJvZHkgd2l0aCB0aGUgV2ViaG9vayBzZWNyZXRcbiAgICAgICAgICAgICc4NzZkMWY5ZGUxYjM2NTE0ZDMwYmNmNDhkOGM0NzMxYTY5NTAwNzMwODU0YTk2NGUzMTc2NDE1OWQ3NWI4OGYxJyk7XG4gIFxuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIFxuICAgIGl0KCdyZWplY3RzIG1lc3NhZ2VzIHdpdGggaW52YWxpZCBzaWduYXR1cmUnLCAoZG9uZSkgPT4ge1xuICBcbiAgICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgICAgbGV0IGNoZWNrcyA9IDA7XG4gICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgaWYoKytjaGVja3MgPT09IDIpXG4gICAgICAgICAgZG9uZSgpO1xuICAgICAgfTtcbiAgXG4gICAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgICAvLyBFeHBlY3QgYSBjYWxsIHRvIGdldCBhbiBPQXV0aCB0b2tlbiBmb3IgdGhlIGFwcFxuICAgICAgICBpZih1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgICAgb2F1dGgodXJpLCBvcHQsIGNiKTtcbiAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgXG4gICAgICAvLyBDcmVhdGUgdGhlIFdlYiBhcHBcbiAgICAgIHNjcnVtYm90LndlYmFwcCgndGVzdGFwcGlkJywgJ3Rlc3RzZWNyZXQnLCAndGVzdHdzZWNyZXQnLCAoZXJyLCBhcHApID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gIFxuICAgICAgICAvLyBMaXN0ZW4gb24gYW4gZXBoZW1lcmFsIHBvcnRcbiAgICAgICAgY29uc3Qgc2VydmVyID0gYXBwLmxpc3RlbigwKTtcbiAgXG4gICAgICAgIC8vIFBvc3QgYSBjaGF0IG1lc3NhZ2UgdG8gdGhlIGFwcFxuICAgICAgICBwb3N0KCdodHRwOi8vbG9jYWxob3N0OicgKyBzZXJ2ZXIuYWRkcmVzcygpLnBvcnQgKyAnL3NjcnVtYm90Jywge1xuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdYLU9VVEJPVU5ELVRPS0VOJzpcbiAgICAgICAgICAgICAgLy8gVGVzdCBhbiBpbnZhbGlkIGJvZHkgc2lnbmF0dXJlXG4gICAgICAgICAgICAgICdpbnZhbGlkc2lnbmF0dXJlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICB0eXBlOiAnbWVzc2FnZS1jcmVhdGVkJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdIZWxsbyB0aGVyZScsXG4gICAgICAgICAgICB1c2VyTmFtZTogJ0phbmUnLFxuICAgICAgICAgICAgc3BhY2VJZDogJ3Rlc3RzcGFjZSdcbiAgICAgICAgICB9XG4gICAgICAgIH0sIChlcnIsIHZhbCkgPT4ge1xuICAgICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICBcbiAgICAgICAgICAvLyBFeHBlY3QgdGhlIHJlcXVlc3QgdG8gYmUgcmVqZWN0ZWRcbiAgICAgICAgICBleHBlY3QodmFsLnN0YXR1c0NvZGUpLnRvLmVxdWFsKDQwMSk7XG4gIFxuICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4vKlxuICAgIGl0KCdyZWplY3RzIG1lc3NhZ2VzIHdpdGggaW52YWxpZCBzaWduYXR1cmUnLCAoZG9uZSkgPT4ge1xuICAgICAgXG5cbiAgICB9KTtcbiovXG4gIH0pO1xuXG4gIFxuICBkZXNjcmliZSgnQm90U2VydmljZSBUZXN0JywgZnVuY3Rpb24gKCkge1xuICAvKlxuICAgIGRlc2NyaWJlKCd0ZXN0d2VsIFRlc3QnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgaXQoJ0l0IFNob3VsZCBSZXR1cm4gV2VsY29tZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXNzZXJ0LmVxdWFsKEJvdFNlcnZpY2UudGVzdHdlbCgpLCAnV2VsY29tZScpO1xuICAgICAgfSk7XG4gIFxuICAgIH0pO1xuICAqL1xuICBcbiAgICBkZXNjcmliZSgnQ2hlY2sgVmFsaWQgSW5wdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvKiBcbiAgICAgIEdpdmVuOiB2YWxpZCBjb21tYW5kXG4gICAgICBXSEVOOiBjb21tYW5kID0gQHNjcnVtYm90IC9yZXBvIDEyMzRcbiAgICAgIFRIRU46IFJlc3VsdCA9ICcvcmVwbyAxMjM0J1xuICAgICAgKi8gICBcbiAgICAgIGl0KCdSZXR1cm5zIHRydWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kID0gJ0BzY3J1bWJvdCAvcmVwbyAxMjM0JztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBVQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5jaGVja1ZhbGlkSW5wdXQoT3B0aW9ucyk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCB0cnVlKTtcbiAgICAgIH0pO1xuICBcbiAgICAgIC8qIFxuICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IGNvbW1hbmQgPSBAc2NydW1ib3QgL3JlcG8gMTIzNFxuICAgICAgVEhFTjogUmVzdWx0ID0gJy9yZXBvIDEyMzQnXG4gICAgICAqLyAgIFxuICAgICAgaXQoJ1JldHVybnMgZmFsc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kID0gJ0ByZXBvcyAvcmVwbyBoZWxsb3dvcmxkJztcbiAgICAgICAgdmFyIE9wdGlvbnMgPSB7XG4gICAgICAgICAgcmVxdWVzdDogbnVsbCxcbiAgICAgICAgICByZXNwb25zZTogbnVsbCxcbiAgICAgICAgICBVQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5jaGVja1ZhbGlkSW5wdXQoT3B0aW9ucyk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCBmYWxzZSk7XG4gICAgICB9KTtcbiAgXG4gIFxuICAgIH0pO1xuICBcbiAgXG4gICAgZGVzY3JpYmUoJ0dldCBDb21tYW5kJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAvKiBcbiAgICAgIEdpdmVuOiB2YWxpZCBjb21tYW5kXG4gICAgICBXSEVOOiBjb21tYW5kID0gQHNjcnVtYm90IC9yZXBvIDEyMzRcbiAgICAgIFRIRU46IFJlc3VsdCA9ICcvcmVwbyAxMjM0J1xuICAgICAgKi8gIFxuICAgICAgaXQoJ1JldHVybiBWYWxpZCBjb21tYW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVUNvbW1hbmQgPSAnQHNjcnVtYm90IC9yZXBvIDEyMzQnO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcvcmVwbyAxMjM0Jyk7XG4gICAgICB9KTtcbiAgXG4gICAgICAvKiBcbiAgICAgIEdpdmVuOiBpbnZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IGNvbW1hbmQgPSAnJ1xuICAgICAgVEhFTjogUmVzdWx0ID0gJydcbiAgICAgICovICBcbiAgICAgIGl0KCdSZXR1cm5zIEJsYW5rIElucHV0IGZvciBibGFuayBjb21tYW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVUNvbW1hbmQgPSAnJztcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0Q29tbWFuZChVQ29tbWFuZCk7XG4gIFxuICAgICAgICBhc3NlcnQuZXF1YWwoUmVzdWx0LCAnJyk7XG4gICAgICB9KTtcblxuICAgICAgLyogXG4gICAgICBHaXZlbjogaW52YWxpZCBjb21tYW5kXG4gICAgICBXSEVOOiBjb21tYW5kID0gdW5kZWZpbmVkXG4gICAgICBUSEVOOiBSZXN1bHQgPSAnJ1xuICAgICAgKi9cbiAgICAgIGl0KCdSZXR1cm5zIEJsYW5rIElucHV0IGZvciB1bmRlZmluZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBVQ29tbWFuZCA9ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcnKTtcbiAgICAgIH0pO1xuXG4gICAgICAvKiBcbiAgICAgIEdpdmVuOiBpbnZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IGNvbW1hbmQgPSBudWxsXG4gICAgICBUSEVOOiBSZXN1bHQgPSAnJ1xuICAgICAgKi9cbiAgICAgIGl0KCdSZXR1cm5zIEJsYW5rIElucHV0IGZvciBudWxsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVUNvbW1hbmQgPSBudWxsO1xuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRDb21tYW5kKFVDb21tYW5kKTtcbiAgXG4gICAgICAgIGFzc2VydC5lcXVhbChSZXN1bHQsICcnKTtcbiAgICAgIH0pO1xuICBcbiAgXG4gICAgfSk7XG4gIFxuICBcbiAgICBkZXNjcmliZSgnVmFsaWRhdGUgQ29tbWFuZHMnLCBmdW5jdGlvbiAoKSB7XG4gIFxuICAgICAgLyogXG4gICAgICAgIEdpdmVuOiB2YWxpZCBjb21tYW5kXG4gICAgICAgIFdIRU46IGNvcnJlY3Qgc3ludGF4ID0gL3JlcG8gaGVsbG9cbiAgICAgICAgVEhFTjogSXNnaXQgPSB0cnVlLCBJc1ZhbGlkID0gdHJ1ZVxuICAgICAgKi9cbiAgICAgIGl0KCdSZXR1cm4gVXJsIE9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmQgPSAnL3JlcG8gaGVsbG8nO1xuICAgICAgICB2YXIgT3B0aW9ucyA9IHtcbiAgICAgICAgICByZXF1ZXN0OiBudWxsLFxuICAgICAgICAgIHJlc3BvbnNlOiBudWxsLFxuICAgICAgICAgIENvbW1hbmQ6IENvbW1hbmRcbiAgICAgICAgfTtcbiAgXG4gICAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6ICdyZXBvcy94MDAwNjY5NDkvaGVsbG8nLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogdHJ1ZVxuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UudmFsaWRhdGVDb21tYW5kcyhPcHRpb25zKTtcbiAgXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICAgIC8vfSk7XG5cbiAgICAvKiBcbiAgICAgIEdpdmVuOiBpbnZhbGlkIGNvbW1hbmRcbiAgICAgIFdIRU46IHdyb24gcmVwbyBzeW50YXhcbiAgICAgIFRIRU46IFJlc3V0T2JqLklzVmFsaWQgPSBmYWxzZVxuICAgICovXG4gICAgICBpdCgnVGVzdCB3cm9uZyByZXBvIHN5bnRheCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmQgPSAnL3JyciBoZWxsbyc7XG4gICAgICAgIHZhciBPcHRpb25zID0ge1xuICAgICAgICAgIHJlcXVlc3Q6IG51bGwsXG4gICAgICAgICAgcmVzcG9uc2U6IG51bGwsXG4gICAgICAgICAgQ29tbWFuZDogQ29tbWFuZFxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBSZXN1bHRPYmogPSB7XG4gICAgICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICAgICAgVXJsOiAnJyxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UudmFsaWRhdGVDb21tYW5kcyhPcHRpb25zKTtcblxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnR2V0SXNzdWVVcmwnLCBmdW5jdGlvbiAoKSB7XG4gIFxuXG4gICAgLyogXG4gICAgICBHaXZlbjogdmFsaWQgY29tbWFuZFxuICAgICAgV0hFTjogL2lzc3VlIDEyMzQgMTIgcGlwZWxpbmVcbiAgICAgIFRIRU46IFVybFR5cGUgPSBHZXRQaXBlbGluZVxuICAgICovXG4gIFxuICAgICAgaXQoJ1JldHVybiBQaXBlbGluZSBVcmwgT2JqZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZEFyciA9IFsnL2lzc3VlJywgJzEyMzQnLCcxMicsICdwaXBlbGluZSddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2lzc3VlIDEyMzQgMTIgcGlwZWxpbmUnO1xuICAgICAgICB2YXIgUmVwb0lkID0gJzEyMzQnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2lzc3Vlcy8xMicsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOiBcIkdldFBpcGVsaW5lXCJcbiAgICAgICAgfTtcbiAgXG4gICAgICAgIHZhciBSZXN1bHQgPSBCb3RTZXJ2aWNlLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgICBcbiAgICAgIC8qIFxuICAgICAgICBHaXZlbjogaW52YWxpZCBjb21tYW5kXG4gICAgICAgIFdIRU46IC9pc3N1ZSAxMjM0IDEyIHBpcGVcbiAgICAgICAgVEhFTjogVXJsVHlwZSA9IFwiXCIsIElzVmFsaWQgPSBmYWxzZVxuICAgICAgKi9cbiAgICAgIGl0KCdSZXR1cm4gUGlwZWxpbmUgVXJsIE9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBbJy9pc3N1ZScsICcxMjM0JywnMTInLCAncGlwZSddO1xuICAgICAgICB2YXIgVXNlckNvbW1hbmQgPSAnL2lzc3VlIDEyMzQgMTIgcGlwZSc7XG4gICAgICAgIHZhciBSZXBvSWQgPSAnMTIzNCc7XG4gIFxuICAgICAgICB2YXIgUmVzdWx0T2JqID0ge1xuICAgICAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgICAgIFVybDogJycsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuICBcbiAgICAgICAgdmFyIFJlc3VsdCA9IEJvdFNlcnZpY2UuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG4gIFxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKFJlc3VsdCwgUmVzdWx0T2JqKTtcbiAgICAgIH0pO1xuXG4gICAgICAvKiBcbiAgICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgICAgV0hFTjogL2lzc3VlICsgbW92ZSBwaXBlbGluZSBcbiAgICAgICAgVEhFTjogVXJsVHlwZSA9IFwiXCIsIElzVmFsaWQgPSB0cnVlXG4gICAgICAqL1xuICAgICAgaXQoJ1Bvc2l0aW9uIG51bWJlciBkaWZmZXJlbnQgdGhhbiBwYXNzZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gWycvaXNzdWUnLCAnMTInLCAnLXAnLCAnNDU2JywgJzE2J107XG4gICAgICAgIHZhciBVc2VyQ29tbWFuZCA9ICcvaXNzdWUgMTIgLXAgNDU2IDEnO1xuICAgICAgICB2YXIgUmVwb0lkID0gJzEyMzQnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2lzc3Vlcy8xMi9tb3ZlcycsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keToge1xuICAgICAgICAgICAgcGlwZWxpbmVfaWQ6ICc0NTYnLFxuICAgICAgICAgICAgcG9zaXRpb246ICcxJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgXG4gICAgICAgIGFzc2VydC5ub3REZWVwRXF1YWwoUmVzdWx0LCBSZXN1bHRPYmopO1xuICAgICAgfSk7XG4gIFxuICBcbiAgICB9KTtcbiAgXG4gIFxuICAgIGRlc2NyaWJlKCdHZXRFcGljVXJsJywgZnVuY3Rpb24gKCkge1xuICBcbiAgICAgICAvKiBcbiAgICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgICAgV0hFTjogcmVwbyBpZCBkbyBub3QgbWF0Y2hcbiAgICAgICAgVEhFTjogVXJsVHlwZSAhPSBcIkVwaWNJc3N1ZXNcIiwgSXNWYWxpZCAhPSB0cnVlXG4gICAgICAqL1xuICAgICAgaXQoJ1JldHVybnMgbm9uIG1hdGNoaW5nIHJlc3VsdHMgd2hlbiBub3QgcmVwb3NpdG9yeSBpZCBkb250IG1hdGNoJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29tbWFuZEFyciA9IFsnL2VwaWMnLCcxJ107XG4gICAgICAgIHZhciBVc2VyQ29tbWFuZCA9ICcvZXBpYyAxJztcbiAgICAgICAgdmFyIFJlcG9JZCA9ICcxMjM0MTEnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2VwaWNzJyxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0VwaWNJc3N1ZXMnXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0Lm5vdERlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcbiAgXG4gICAgICAvKiBcbiAgICAgICAgR2l2ZW46IHZhbGlkIGNvbW1hbmRcbiAgICAgICAgV0hFTjogL2VwaWMgMVxuICAgICAgICBUSEVOOiBVcmxUeXBlID0gXCJFcGljSXNzdWVzXCIsIElzVmFsaWQgPSB0cnVlXG4gICAgICAqL1xuXG4gICAgICBpdCgnV29ya3MgaWYgZXBpYyByZXF1ZXN0IG1hdGNoZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gWycvZXBpYycsJzEnXTtcbiAgICAgICAgdmFyIFVzZXJDb21tYW5kID0gJy9lcGljIDEnO1xuICAgICAgICB2YXIgUmVwb0lkID0gJzEyMzQnO1xuICBcbiAgICAgICAgdmFyIFJlc3VsdE9iaiA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8xMjM0L2VwaWNzJyxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0VwaWNJc3N1ZXMnXG4gICAgICAgIH07XG4gIFxuICAgICAgICB2YXIgUmVzdWx0ID0gQm90U2VydmljZS5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICBcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChSZXN1bHQsIFJlc3VsdE9iaik7XG4gICAgICB9KTtcblxuICAgIH0pO1xuICBcbiAgXG4gIH0pO1xuIl19