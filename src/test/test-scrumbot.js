import { expect } from 'chai';
import * as jsonwebtoken from 'jsonwebtoken';
import { post } from 'request';

var assert = require('assert');
var BotService = require('../scrum_board');

//mock request module
let postspy;
require.cache[require.resolve('request')].exports = {
  post: (uri, opt, cb) => postspy(uri, opt, cb)
};

// Load the scrumbot app
const scrumbot = require('../index');

// Generate a test OAuth token
const token = jsonwebtoken.sign({}, 'secret', { expiresIn: '1h' });

describe('watsonwork-scrumbot', () => {

  // Mock the Watson Work OAuth service
  const oauth = (uri, opt, cb) => {
    expect(opt.auth).to.deep.equal({
      user: 'testappid',
      pass: 'testsecret'
    });
    expect(opt.json).to.equal(true);
    expect(opt.form).to.deep.equal({
      grant_type: 'client_credentials'
    });

    // Return OAuth token
    setImmediate(() => cb(undefined, {
      statusCode: 200,
      body: {
        access_token: token
      }
    }));
  };

  it('authenticates the app', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if (++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);
      check();
    });
  });

  it('handles Webhook challenge requests', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if (++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Web app
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      const server = app.listen(0);

      // Post a Webhook challenge request to the app
      post('http://localhost:' + server.address().port + '/scrumbot', {

        headers: {
          // Signature of the test body with the Webhook secret
          'X-OUTBOUND-TOKEN':
            'f51ff5c91e99c63b6fde9e396bb6ea3023727f74f1853f29ab571cfdaaba4c03'
        },
        json: true,
        body: {
          type: 'verification',
          challenge: 'testchallenge'
        }
      }, (err, res) => {
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

  it('rejects messages with invalid signature', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if (++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Web app
    scrumbot.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      const server = app.listen(0);

      // Post a chat message to the app
      post('http://localhost:' + server.address().port + '/scrumbot', {
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
      }, (err, val) => {
        expect(err).to.equal(null);

        // Expect the request to be rejected
        expect(val.statusCode).to.equal(401);

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
        Body: null,

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
