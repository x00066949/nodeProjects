/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.process_requests = undefined;

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/var request = _interopRequireWildcard(_request);

var /*istanbul ignore next*/_util = require('util');

/*istanbul ignore next*/var util = _interopRequireWildcard(_util);

var /*istanbul ignore next*/_bodyParser = require('body-parser');

/*istanbul ignore next*/var bparser = _interopRequireWildcard(_bodyParser);

var /*istanbul ignore next*/_crypto = require('crypto');

var /*istanbul ignore next*/_http = require('http');

/*istanbul ignore next*/var http = _interopRequireWildcard(_http);

var /*istanbul ignore next*/_https = require('https');

/*istanbul ignore next*/var https = _interopRequireWildcard(_https);

var /*istanbul ignore next*/_watson = require('./watson');

/*istanbul ignore next*/var oauth = _interopRequireWildcard(_watson);

var /*istanbul ignore next*/_scrum_board = require('./scrum_board');

/*istanbul ignore next*/var board = _interopRequireWildcard(_scrum_board);

var /*istanbul ignore next*/_issue_events = require('./issue_events');

/*istanbul ignore next*/var events = _interopRequireWildcard(_issue_events);

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var path = require('path');
var rp = require('request-promise');
var requireEnv = require("require-environment-variables");

// Setup debug log
var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');
var eventType;

var process_requests = /*istanbul ignore next*/exports.process_requests = function process_requests(appId, token, cb) /*istanbul ignore next*/{
  return function (req, res) {
    log(" 001 : " + eventType);
    //log("token : "+token)
    log("app id " + appId);

    if (eventType === 'WW') {
      // Respond to the Webhook right away, as the response message will
      // be sent asynchronously
      res.status(201).end();

      // Only handle message-created Webhook events, and ignore the app's
      // own messages
      if (req.body.userId === appId) {
        console.log('error %o', req.body);
        return;
      }
      if (res.statusCode !== 201) {
        log(res);
        return;
      }

      log("Processing slash command");

      if (!req) throw new Error('no request provided');

      log(req.body);

      if (req.body.type === 'message-annotation-added' /*&& req.body.annotationPayload.targetAppId === appId*/) {
          var command = JSON.parse(req.body.annotationPayload).actionId;
          //log("action id "+req.body.annotationPayload.actionId);
          log("command " + command);

          if (!command) log("no command to process");

          if (command === '/issue pipeline') {
            log("using dialog");
            dialog(req.body.spaceId, token(), req.body.userId, req.body.annotationPayload.targetDialogId, function (err, res) {
              if (!err) log('sent dialog to %s', req.body.spaceId);
            });
          }

          // message represents the message coming in from WW to be processed by the App
          var message = '@scrumbot ' + command;

          board.getScrumData({ request: req, response: res, UserInput: message }).then(function (to_post) {

            log("space id " + req.body.spaceId);
            log("data got = " + to_post);

            send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
              if (!err) log('Sent message to space %s', req.body.spaceId);
            });
          }).catch(function (err) {
            log("unable to send message to space" + err);
          });
        };
    } else if (eventType === 'EL') {
      res.status(201).end();

      log("EL token : " + oauth.oToken());

      //var toks = oauth.oToken;
      log(" 002 : " + eventType);

      if (res.statusCode !== 201) {
        log(res);
        return;
      }

      log("Processing github event");

      if (!req) throw new Error('no request provided');

      log(req.body);

      var promise = parseResponse(req, res);
      promise.then(function (to_post) {

        log("data got = " + to_post);

        send(5, to_post, oauth.oToken(), function (err, res) {
          if (!err) log('Sent message to space ');
        });
      });

      //return;
    } else {

      res.status(401).end();
      return;
    }
  };
};

// Send an app message to the conversation in a space
var send = function send(spaceId, text, tok, cb) {

  request.post('https://api.watsonwork.ibm.com/v1/spaces/' + '5a09b234e4b090bcd7fcf3b2' + '/messages', {
    headers: {
      Authorization: 'Bearer ' + tok
    },
    json: true,
    // An App message can specify a color, a title, markdown text and
    // an 'actor' useful to show where the message is coming from
    body: {
      type: 'appMessage',
      version: 1.0,
      annotations: [{
        type: 'generic',
        version: 1.0,

        color: '#6CB7FB',
        title: 'github issue tracker',
        text: text,

        //text : 'Hello \n World ',
        actor: {
          name: 'github issue app'
        }
      }]
    }
  }, function (err, res) {
    if (err || res.statusCode !== 201) {
      log('Error sending message %o', err || res.statusCode);
      cb(err || new Error(res.statusCode));
      return;
    }
    log('Send result %d, %o', res.statusCode, res.body);
    cb(null, res.body);
  });
};

//dialog boxes
var dialog = function dialog(spaceId, tok, userId, dialogId, cb) {

  log("trying to build dialog boxes");

  var q = /*istanbul ignore next*/'';

  request.post('https://api.watsonwork.ibm.com/graphql', {

    headers: {
      'jwt': tok,
      'Content-Type': 'application/graphql',
      'x-graphql-view': 'PUBLIC, BETA'
    },
    json: true,
    body: /*istanbul ignore next*/'mutation createSpace { createSpace(input: { title: "Space title",  members: [' + userId + ']}){ space { ' + spaceId + '}'

  }, function (err, res) {
    if (err || res.statusCode !== 201) {
      log('failed err: ' + err);
      console.dir(res, { depth: null });
      log('Error creating dialog %o', err || res.statusCode);
      cb(err || new Error(res.statusCode));
      return;
    }
    log('Send result %d, %o', res.statusCode, res.body);
    cb(null, res.body);
  });
};

//get content of notification from github
//export const 
var parseResponse = function parseResponse(req, res) {
  log('parseresponse');
  //var req = options.request;
  //var res = options.response;

  var UrlOptions = {
    uri: MainUrl + RepositoryUrl,
    qs: {},
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };

  return rp(UrlOptions).then(function () {

    var FinalMessage = '';

    if (req.get('X-Github-Event') === 'issue_comment') {

      log('action: ' + req.body.action);

      FinalMessage = 'A Comment has just been ';

      if (req.body.action === 'created') {
        FinalMessage += 'added to issue #' + req.body.issue.id + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
      } else {
        FinalMessage += req.body.action + ' action not coded yet...coming soon';
      }
    } else {
      log('Event type: ' + req.get('X-Github-Event'));
      FinalMessage = 'Not a comment on an issue';
    }

    /* var FinalData = {
       "UserId": "Map",
       "Message": FinalMessage
     };*/

    log(FinalMessage);
    return FinalMessage;
  });
};

// Verify Watson Work request signature
var verify = /*istanbul ignore next*/exports.verify = function verify(wsecret) /*istanbul ignore next*/{
  return function (req, res, buf, encoding) {
    if (req.get('X-OUTBOUND-TOKEN') === /*istanbul ignore next*/(0, _crypto.createHmac)('sha256', wsecret).update(buf).digest('hex')) {

      eventType = 'WW';
      log("from WW");
      return;
    } else if (req.get('X-HUB-SIGNATURE') === "sha1=" + /*istanbul ignore next*/(0, _crypto.createHmac)('sha1', wsecret).update(buf).digest('hex')) {

      eventType = 'EL';
      log("github event");
      return;
    } else {
      log("Not event from WW or github");
      console.dir(req, { depth: null });
      log('Invalid request signature');

      var err = new Error('Invalid request signature');
      err.status = 401;
      throw err;
    }
  };
};

// Handle Watson Work Webhook challenge requests
var challenge = /*istanbul ignore next*/exports.challenge = function challenge(wsecret) /*istanbul ignore next*/{
  return function (req, res, next) {
    if (req.body.type === 'verification') {
      log('Got Webhook verification challenge %o', req.body);
      var body = JSON.stringify({
        response: req.body.challenge
      });
      res.set('X-OUTBOUND-TOKEN', /*istanbul ignore next*/(0, _crypto.createHmac)('sha256', wsecret).update(body).digest('hex'));
      res.type('json').send(body);
      return;
    }
    next();
  };
};

// Create Express Web app
var webapp = /*istanbul ignore next*/exports.webapp = function webapp(appId, secret, wsecret, cb, eventType) {
  // Authenticate the app and get an OAuth token
  oauth.run(appId, secret, function (err, token) {
    if (err) {
      cb(err);
      return;
    }

    log("tok : " + token);
    // Return the Express Web app
    cb(null, express()

    // Configure Express route for the app Webhook
    .post('/scrumbot',

    // Verify Watson Work request signature and parse request body
    bparser.json({
      type: '*/*',
      verify: verify(wsecret)
    }),

    // Handle Watson Work Webhook challenge requests
    challenge(wsecret),

    // Handle Watson Work messages
    //scrumbot(appId, token)));

    //handle slash commands
    process_requests(appId, token)));
  });
};

// App main entry point
var main = function main(argv, env, cb) {

  // Create Express Web app
  webapp(env.SCRUMBOT_APPID, env.SCRUMBOT_SECRET, env.SCRUMBOT_WEBHOOK_SECRET, function (err, app) {

    if (err) {
      cb(err);
      log("an error occoured " + err);

      return;
    }

    if (env.PORT) {
      log('HTTP server listening on port %d', env.PORT);

      http.createServer(app).listen(env.PORT, cb);

      //default page
      app.get('/', function (request, response) {
        response.redirect('http://workspace.ibm.com');
      });
    } else
      // Listen on the configured HTTPS port, default to 443
      ssl.conf(env, function (err, conf) {
        if (err) {
          cb(err);
          return;
        }
        var port = env.SSLPORT || 443;
        log('HTTPS server listening on port %d', port);
        // https.createServer(conf, app).listen(port, cb);
      });
  });
};

if (require.main === module) {
  main(process.argv, process.env, function (err) {

    if (err) {
      console.log('Error starting app:', err);
      return;
    }

    log('App started');
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsImRpciIsImRlcHRoIiwiVXJsT3B0aW9ucyIsInVyaSIsIk1haW5VcmwiLCJSZXBvc2l0b3J5VXJsIiwicXMiLCJGaW5hbE1lc3NhZ2UiLCJnZXQiLCJhY3Rpb24iLCJpc3N1ZSIsImlkIiwicmVwb3NpdG9yeSIsImNvbW1lbnQiLCJ1c2VyIiwibG9naW4iLCJodG1sX3VybCIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFFWjs7Ozs7Ozs7QUFaQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBWUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBY0MsRUFBZDtBQUFBLFNBQXFCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFhO0FBQ2hFUCxRQUFJLFlBQVVDLFNBQWQ7QUFDQTtBQUNBRCxRQUFJLFlBQVdHLEtBQWY7O0FBR0EsUUFBSUYsY0FBYyxJQUFsQixFQUF1QjtBQUNuQjtBQUNGO0FBQ0FNLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjs7QUFFRTtBQUNBO0FBQ0EsVUFBSUgsSUFBSUksSUFBSixDQUFT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ZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbixjYikgPT4gKHJlcSwgcmVzKSA9PntcbiAgbG9nKFwiIDAwMSA6IFwiK2V2ZW50VHlwZSlcbiAgLy9sb2coXCJ0b2tlbiA6IFwiK3Rva2VuKVxuICBsb2coXCJhcHAgaWQgXCIrIGFwcElkKVxuICBcblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKXtcbiAgICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gICAgXG4gICAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgICAvLyBvd24gbWVzc2FnZXNcbiAgICAgIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIFxuICAgICAgfVxuICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKHJlcyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICBcbiAgICAgIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcbiAgICBcbiAgICAgIGlmKCFyZXEpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuICAgIFxuICAgICAgbG9nKHJlcS5ib2R5KTtcbiAgICBcbiAgICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gICAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgICAgbG9nKFwiY29tbWFuZCBcIitjb21tYW5kKTtcbiAgICBcbiAgICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcbiAgICAgICAgXG4gICAgXG4gICAgICAgIGlmKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKXtcbiAgICAgICAgICBsb2coXCJ1c2luZyBkaWFsb2dcIilcbiAgICAgICAgICBkaWFsb2cocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgICAgICByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXREaWFsb2dJZCxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcrY29tbWFuZDtcbiAgICBcbiAgICBcbiAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6bWVzc2FnZX0pLnRoZW4oKHRvX3Bvc3QpPT57XG4gICAgICAgICAgXG4gICAgICAgICAgbG9nKFwic3BhY2UgaWQgXCIrcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiK3RvX3Bvc3QpO1xuICAgIFxuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICAgICAgbG9nKFwidW5hYmxlIHRvIHNlbmQgbWVzc2FnZSB0byBzcGFjZVwiICsgZXJyKTtcbiAgICAgICAgfSlcbiAgICAgIH07XG5cbiAgfWVsc2UgaWYoZXZlbnRUeXBlID09PSAnRUwnKXtcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICBsb2coXCJFTCB0b2tlbiA6IFwiK29hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIrZXZlbnRUeXBlKVxuICAgICAgXG4gICAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2cocmVzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIFxuICAgICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG4gICAgXG4gICAgICBpZighcmVxKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcbiAgICBcbiAgICAgIGxvZyhyZXEuYm9keSk7XG4gIFxuICAgICAgdmFyIHByb21pc2UgPSBwYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KT0+e1xuICAgICAgICBcbiAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcbiAgXG4gICAgICAgIHNlbmQoNSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgIHRvX3Bvc3QsXG4gICAgICAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgICAvL3JldHVybjtcbiAgICBcbiAgfWVsc2V7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuICAgIFxuICB9XG4gIFxuICBcblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyAnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIC8vdGV4dCA6ICdIZWxsbyBcXG4gV29ybGQgJyxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vL2RpYWxvZyBib3hlc1xuY29uc3QgZGlhbG9nID0gKHNwYWNlSWQsIHRvaywgdXNlcklkLCBkaWFsb2dJZCxjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXNcIilcblxuICB2YXIgcSA9IGBgXG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcse1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOnRvayxcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9ncmFwaHFsJyAsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IGBtdXRhdGlvbiBjcmVhdGVTcGFjZSB7IGNyZWF0ZVNwYWNlKGlucHV0OiB7IHRpdGxlOiBcXFwiU3BhY2UgdGl0bGVcXFwiLCAgbWVtYmVyczogWyR7dXNlcklkfV19KXsgc3BhY2UgeyAke3NwYWNlSWR9fWBcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJytlcnIpXG4gICAgICAgIGNvbnNvbGUuZGlyKHJlcyx7ZGVwdGg6bnVsbH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApO1xufTtcblxuLy9nZXQgY29udGVudCBvZiBub3RpZmljYXRpb24gZnJvbSBnaXRodWJcbi8vZXhwb3J0IGNvbnN0IFxudmFyIHBhcnNlUmVzcG9uc2UgPSAoZnVuY3Rpb24gKHJlcSAsIHJlcykge1xuICBsb2coJ3BhcnNlcmVzcG9uc2UnKVxuICAvL3ZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gIC8vdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG5cbiAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICBxczoge1xuICAgIH0sXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgIH0sXG4gICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gIH07XG5cbiAgcmV0dXJuIHJwKFVybE9wdGlvbnMpLnRoZW4oZnVuY3Rpb24oKXtcblxuICAgIHZhciBGaW5hbE1lc3NhZ2U9Jyc7XG4gICAgXG4gICAgICBpZihyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpID09PSAnaXNzdWVfY29tbWVudCcgKXtcbiAgICBcbiAgICAgICAgICBsb2coJ2FjdGlvbjogJytyZXEuYm9keS5hY3Rpb24pXG4gICAgXG4gICAgICAgICAgRmluYWxNZXNzYWdlID0gJ0EgQ29tbWVudCBoYXMganVzdCBiZWVuICdcbiAgICBcbiAgICAgICAgICBpZihyZXEuYm9keS5hY3Rpb24gPT09ICdjcmVhdGVkJyl7XG4gICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSAnYWRkZWQgdG8gaXNzdWUgIycrcmVxLmJvZHkuaXNzdWUuaWQrJyBpbiByZXBvc2l0b3J5ICcgK3JlcS5ib2R5LnJlcG9zaXRvcnkubmFtZSsnIHdpdGggSUQgOiAnK3JlcS5ib2R5LnJlcG9zaXRvcnkuaWQrJyBieSB1c2VyICcrcmVxLmJvZHkuY29tbWVudC51c2VyLmxvZ2luKydcXG4gVGhlIGNvbW1lbnQgY2FuIGJlIGZvdW5kIGhlcmUgOiAnK3JlcS5ib2R5LmNvbW1lbnQuaHRtbF91cmwrJy4gXFxuIFRoZSBjb250ZW50IG9mIHRoZSBjb21tZW50IGlzIDogXFxuJytyZXEuYm9keS5jb21tZW50LmJvZHk7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSByZXEuYm9keS5hY3Rpb24rJyBhY3Rpb24gbm90IGNvZGVkIHlldC4uLmNvbWluZyBzb29uJ1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgICAgbG9nKCdFdmVudCB0eXBlOiAnK3JlcS5nZXQoJ1gtR2l0aHViLUV2ZW50JykpXG4gICAgICAgICAgRmluYWxNZXNzYWdlID0gJ05vdCBhIGNvbW1lbnQgb24gYW4gaXNzdWUnXG4gICAgICB9XG4gICAgXG4gICAgIC8qIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICAgIFwiTWVzc2FnZVwiOiBGaW5hbE1lc3NhZ2VcbiAgICAgIH07Ki9cbiAgICBcbiAgICAgIGxvZyhGaW5hbE1lc3NhZ2UpXG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlO1xuICB9KTtcblxufSk7XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpICkge1xuICAgICAgXG4gICAgICBldmVudFR5cGU9J1dXJ1xuICAgICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgICAgcmV0dXJuO1xuICAgICBcbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICBcInNoYTE9XCIrY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4Jykpe1xuXG4gICAgZXZlbnRUeXBlPSdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfWVsc2V7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLHtkZXB0aDpudWxsfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuICAgIFxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcInRvayA6IFwiK3Rva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcbiAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19