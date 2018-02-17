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
      if(++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
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
        if(++checks === 2)
          done();
      };
  
      postspy = (uri, opt, cb) => {
        // Expect a call to get an OAuth token for the app
        if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
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
        if(++checks === 2)
          done();
      };
  
      postspy = (uri, opt, cb) => {
        // Expect a call to get an OAuth token for the app
        if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
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
