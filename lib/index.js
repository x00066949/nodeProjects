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

            send(req.body.spaceId, util.format('Hey %s, : %s', req.body.userName, to_post), token(), function (err, res) {
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
    uri: 'https://api.github.com/',
    qs: {},
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };

  return rp(UrlOptions).then(function () {

    var FinalMessage = '';

    //COMMENTS
    if (req.get('X-Github-Event') === 'issue_comment') {

      log('action: ' + req.body.action);

      FinalMessage = 'A Comment has just been ';

      if (req.body.action === 'created') {
        FinalMessage += 'added to issue #' + req.body.issue.number + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
      } else if (req.body.action === 'edited') {
        FinalMessage += 'edited under issue #' + req.body.issue.number + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
      } else if (req.body.action === 'deleted') {
        FinalMessage += 'deleted under issue #' + req.body.issue.number + ' by user ' + req.body.comment.user.login + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id;
      } else {
        FinalMessage += req.body.action + ' action not coded yet...coming soon';
      }
    }
    //ISSUES
    else if (req.get('X-Github-Event') === 'issues') {
        log('action: ' + req.body.action);

        FinalMessage = 'An issue has just been ';

        if (req.body.action === 'opened') {
          FinalMessage += 'opened in repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\nIssue Details:\nIssue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n Issue opened by : ' + req.body.issue.user.login + '\n The Issue can be found here : ' + req.body.issue.html_url + '.';
        } else if (req.body.action === 'closed') {
          FinalMessage += 'closed. ' + '\nIssue Details:\nIssue Number : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n Issue closed by : ' + req.body.issue.user.login + '\nIn repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '.';
        } else if (req.body.action === 'reopened') {
          FinalMessage += 'reopened in repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\n Issue Re-opened by : ' + req.body.issue.user.login + '\nIssue Details:\nIssue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n The Issue can be found here : ' + req.body.issue.html_url + '.';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsImRpciIsImRlcHRoIiwiVXJsT3B0aW9ucyIsInVyaSIsInFzIiwiRmluYWxNZXNzYWdlIiwiZ2V0IiwiYWN0aW9uIiwiaXNzdWUiLCJudW1iZXIiLCJyZXBvc2l0b3J5IiwiaWQiLCJjb21tZW50IiwidXNlciIsImxvZ2luIiwiaHRtbF91cmwiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJlbnYiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIiwicHJvY2VzcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLE07O0FBRVo7Ozs7Ozs7O0FBWkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQVlBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1NLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjtBQUNBLElBQUlDLFNBQUo7O0FBRU8sSUFBTUMsc0VBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSLEVBQWVDLEVBQWY7QUFBQSxTQUFzQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYztBQUNsRVAsUUFBSSxZQUFZQyxTQUFoQjtBQUNBO0FBQ0FELFFBQUksWUFBWUcsS0FBaEI7O0FBR0EsUUFBSUYsY0FBYyxJQUFsQixFQUF3QjtBQUN0QjtBQUNBO0FBQ0FNLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjs7QUFFQTtBQUNBO0FBQ0EsVUFBSUgsSUFBSUksSUFBSixDQUFTQyxNQUFULEtBQW9CUixLQUF4QixFQUErQjtBQUM3QlMsZ0JBQVFaLEdBQVIsQ0FBWSxVQUFaLEVBQXdCTSxJQUFJSSxJQUE1QjtBQUNBO0FBRUQ7QUFDRCxVQUFJSCxJQUFJTSxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCYixZQUFJTyxHQUFKO0FBQ0E7QUFDRDs7QUFFRFAsVUFBSSwwQkFBSjs7QUFFQSxVQUFJLENBQUNNLEdBQUwsRUFDRSxNQUFNLElBQUlRLEtBQUosQ0FBVSxxQkFBVixDQUFOOztBQUVGZCxVQUFJTSxJQUFJSSxJQUFSOztBQUVBLFVBQUlKLElBQUlJLElBQUosQ0FBU0ssSUFBVCxLQUFrQiwwQkFBdEIsQ0FBaUQsdURBQWpELEVBQTBHO0FBQ3hHLGNBQUlDLFVBQVVDLEtBQUtDLEtBQUwsQ0FBV1osSUFBSUksSUFBSixDQUFTUyxpQkFBcEIsRUFBdUNDLFFBQXJEO0FBQ0E7QUFDQXBCLGNBQUksYUFBYWdCLE9BQWpCOztBQUVBLGNBQUksQ0FBQ0EsT0FBTCxFQUNFaEIsSUFBSSx1QkFBSjs7QUFHRixjQUFJZ0IsWUFBWSxpQkFBaEIsRUFBbUM7QUFDakNoQixnQkFBSSxjQUFKO0FBQ0FxQixtQkFBT2YsSUFBSUksSUFBSixDQUFTWSxPQUFoQixFQUNFbEIsT0FERixFQUVFRSxJQUFJSSxJQUFKLENBQVNDLE1BRlgsRUFHRUwsSUFBSUksSUFBSixDQUFTUyxpQkFBVCxDQUEyQkksY0FIN0IsRUFNRSxVQUFDQyxHQUFELEVBQU1qQixHQUFOLEVBQWM7QUFDWixrQkFBSSxDQUFDaUIsR0FBTCxFQUNFeEIsSUFBSSxtQkFBSixFQUF5Qk0sSUFBSUksSUFBSixDQUFTWSxPQUFsQztBQUNILGFBVEg7QUFZRDs7QUFFRDtBQUNBLGNBQUlHLFVBQVUsZUFBZVQsT0FBN0I7O0FBR0F6QixnQkFBTW1DLFlBQU4sQ0FBbUIsRUFBRXpDLFNBQVNxQixHQUFYLEVBQWdCcUIsVUFBVXBCLEdBQTFCLEVBQStCcUIsV0FBV0gsT0FBMUMsRUFBbkIsRUFBd0VJLElBQXhFLENBQTZFLFVBQUNDLE9BQUQsRUFBYTs7QUFFeEY5QixnQkFBSSxjQUFjTSxJQUFJSSxJQUFKLENBQVNZLE9BQTNCO0FBQ0F0QixnQkFBSSxnQkFBZ0I4QixPQUFwQjs7QUFFQUMsaUJBQUt6QixJQUFJSSxJQUFKLENBQVNZLE9BQWQsRUFDRXBDLEtBQUs4QyxNQUFMLENBQ0UsY0FERixFQUVFMUIsSUFBSUksSUFBSixDQUFTdUIsUUFGWCxFQUVxQkgsT0FGckIsQ0FERixFQUlFMUIsT0FKRixFQUtFLFVBQUNvQixHQUFELEVBQU1qQixHQUFOLEVBQWM7QUFDWixrQkFBSSxDQUFDaUIsR0FBTCxFQUNFeEIsSUFBSSwwQkFBSixFQUFnQ00sSUFBSUksSUFBSixDQUFTWSxPQUF6QztBQUNILGFBUkg7QUFTRCxXQWRELEVBY0dZLEtBZEgsQ0FjUyxVQUFDVixHQUFELEVBQVM7QUFDaEJ4QixnQkFBSSxvQ0FBb0N3QixHQUF4QztBQUNELFdBaEJEO0FBaUJEO0FBRUYsS0F4RUQsTUF3RU8sSUFBSXZCLGNBQWMsSUFBbEIsRUFBd0I7QUFDN0JNLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjs7QUFFQVQsVUFBSSxnQkFBZ0JWLE1BQU02QyxNQUFOLEVBQXBCOztBQUVBO0FBQ0FuQyxVQUFJLFlBQVlDLFNBQWhCOztBQUVBLFVBQUlNLElBQUlNLFVBQUosS0FBbUIsR0FBdkIsRUFBNEI7QUFDMUJiLFlBQUlPLEdBQUo7QUFDQTtBQUNEOztBQUVEUCxVQUFJLHlCQUFKOztBQUVBLFVBQUksQ0FBQ00sR0FBTCxFQUNFLE1BQU0sSUFBSVEsS0FBSixDQUFVLHFCQUFWLENBQU47O0FBRUZkLFVBQUlNLElBQUlJLElBQVI7O0FBRUEsVUFBSTBCLFVBQVVDLGNBQWMvQixHQUFkLEVBQW1CQyxHQUFuQixDQUFkO0FBQ0E2QixjQUFRUCxJQUFSLENBQWEsVUFBQ0MsT0FBRCxFQUFhOztBQUV4QjlCLFlBQUksZ0JBQWdCOEIsT0FBcEI7O0FBRUFDLGFBQUssQ0FBTCxFQUVFRCxPQUZGLEVBR0V4QyxNQUFNNkMsTUFBTixFQUhGLEVBSUUsVUFBQ1gsR0FBRCxFQUFNakIsR0FBTixFQUFjO0FBQ1osY0FBSSxDQUFDaUIsR0FBTCxFQUNFeEIsSUFBSSx3QkFBSjtBQUNILFNBUEg7QUFRRCxPQVpEOztBQWNBO0FBRUQsS0FyQ00sTUFxQ0E7O0FBRUxPLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjtBQUNBO0FBRUQ7QUFJRixHQTVIK0I7QUFBQSxDQUF6Qjs7QUE4SFA7QUFDQSxJQUFNc0IsT0FBTyxTQUFQQSxJQUFPLENBQUNULE9BQUQsRUFBVWdCLElBQVYsRUFBZ0JDLEdBQWhCLEVBQXFCbEMsRUFBckIsRUFBNEI7O0FBRXZDcEIsVUFBUXVELElBQVIsQ0FDRSw4Q0FBOEMsMEJBQTlDLEdBQTJFLFdBRDdFLEVBQzBGO0FBQ3RGQyxhQUFTO0FBQ1BDLHFCQUFlLFlBQVlIO0FBRHBCLEtBRDZFO0FBSXRGSSxVQUFNLElBSmdGO0FBS3RGO0FBQ0E7QUFDQWpDLFVBQU07QUFDSkssWUFBTSxZQURGO0FBRUo2QixlQUFTLEdBRkw7QUFHSkMsbUJBQWEsQ0FBQztBQUNaOUIsY0FBTSxTQURNO0FBRVo2QixpQkFBUyxHQUZHOztBQUlaRSxlQUFPLFNBSks7QUFLWkMsZUFBTyxzQkFMSztBQU1aVCxjQUFNQSxJQU5NOztBQVFaO0FBQ0FVLGVBQU87QUFDTEMsZ0JBQU07QUFERDtBQVRLLE9BQUQ7QUFIVDtBQVBnRixHQUQxRixFQXlCSyxVQUFDekIsR0FBRCxFQUFNakIsR0FBTixFQUFjO0FBQ2YsUUFBSWlCLE9BQU9qQixJQUFJTSxVQUFKLEtBQW1CLEdBQTlCLEVBQW1DO0FBQ2pDYixVQUFJLDBCQUFKLEVBQWdDd0IsT0FBT2pCLElBQUlNLFVBQTNDO0FBQ0FSLFNBQUdtQixPQUFPLElBQUlWLEtBQUosQ0FBVVAsSUFBSU0sVUFBZCxDQUFWO0FBQ0E7QUFDRDtBQUNEYixRQUFJLG9CQUFKLEVBQTBCTyxJQUFJTSxVQUE5QixFQUEwQ04sSUFBSUcsSUFBOUM7QUFDQUwsT0FBRyxJQUFILEVBQVNFLElBQUlHLElBQWI7QUFDRCxHQWpDSDtBQWtDRCxDQXBDRDs7QUFzQ0E7QUFDQSxJQUFNVyxTQUFTLFNBQVRBLE1BQVMsQ0FBQ0MsT0FBRCxFQUFVaUIsR0FBVixFQUFlNUIsTUFBZixFQUF1QnVDLFFBQXZCLEVBQWlDN0MsRUFBakMsRUFBd0M7O0FBRXJETCxNQUFJLDhCQUFKOztBQUVBLE1BQUltRCw4QkFBSjs7QUFFQWxFLFVBQVF1RCxJQUFSLENBQ0Usd0NBREYsRUFDNEM7O0FBRXhDQyxhQUFTO0FBQ1AsYUFBT0YsR0FEQTtBQUVQLHNCQUFnQixxQkFGVDtBQUdQLHdCQUFrQjtBQUhYLEtBRitCO0FBT3hDSSxVQUFNLElBUGtDO0FBUXhDakMsb0hBQXdGQyxNQUF4RixxQkFBOEdXLE9BQTlHOztBQVJ3QyxHQUQ1QyxFQVdLLFVBQUNFLEdBQUQsRUFBTWpCLEdBQU4sRUFBYztBQUNmLFFBQUlpQixPQUFPakIsSUFBSU0sVUFBSixLQUFtQixHQUE5QixFQUFtQztBQUNqQ2IsVUFBSSxpQkFBaUJ3QixHQUFyQjtBQUNBWixjQUFRd0MsR0FBUixDQUFZN0MsR0FBWixFQUFpQixFQUFFOEMsT0FBTyxJQUFULEVBQWpCO0FBQ0FyRCxVQUFJLDBCQUFKLEVBQWdDd0IsT0FBT2pCLElBQUlNLFVBQTNDO0FBQ0FSLFNBQUdtQixPQUFPLElBQUlWLEtBQUosQ0FBVVAsSUFBSU0sVUFBZCxDQUFWO0FBQ0E7QUFDRDtBQUNEYixRQUFJLG9CQUFKLEVBQTBCTyxJQUFJTSxVQUE5QixFQUEwQ04sSUFBSUcsSUFBOUM7QUFDQUwsT0FBRyxJQUFILEVBQVNFLElBQUlHLElBQWI7QUFDRCxHQXJCSDtBQXVCRCxDQTdCRDs7QUErQkE7QUFDQTtBQUNBLElBQUkyQixnQkFBaUIsU0FBakJBLGFBQWlCLENBQVUvQixHQUFWLEVBQWVDLEdBQWYsRUFBb0I7QUFDdkNQLE1BQUksZUFBSjtBQUNBO0FBQ0E7O0FBRUEsTUFBSXNELGFBQWE7QUFDZkMsU0FBSyx5QkFEVTtBQUVmQyxRQUFJLEVBRlc7QUFJZmYsYUFBUztBQUNQLG9CQUFjO0FBRFAsS0FKTTtBQU9mRSxVQUFNLElBUFMsQ0FPSjtBQVBJLEdBQWpCOztBQVVBLFNBQU83QyxHQUFHd0QsVUFBSCxFQUFlekIsSUFBZixDQUFvQixZQUFZOztBQUVyQyxRQUFJNEIsZUFBZSxFQUFuQjs7QUFFQTtBQUNBLFFBQUluRCxJQUFJb0QsR0FBSixDQUFRLGdCQUFSLE1BQThCLGVBQWxDLEVBQW1EOztBQUVqRDFELFVBQUksYUFBYU0sSUFBSUksSUFBSixDQUFTaUQsTUFBMUI7O0FBRUFGLHFCQUFlLDBCQUFmOztBQUVBLFVBQUluRCxJQUFJSSxJQUFKLENBQVNpRCxNQUFULEtBQW9CLFNBQXhCLEVBQW1DO0FBQ2pDRix3QkFBZ0IscUJBQXFCbkQsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlQyxNQUFwQyxHQUE2QyxpQkFBN0MsR0FBaUV2RCxJQUFJSSxJQUFKLENBQVNvRCxVQUFULENBQW9CYixJQUFyRixHQUE0RixhQUE1RixHQUE0RzNDLElBQUlJLElBQUosQ0FBU29ELFVBQVQsQ0FBb0JDLEVBQWhJLEdBQXFJLFdBQXJJLEdBQW1KekQsSUFBSUksSUFBSixDQUFTc0QsT0FBVCxDQUFpQkMsSUFBakIsQ0FBc0JDLEtBQXpLLEdBQWlMLHFDQUFqTCxHQUF5TjVELElBQUlJLElBQUosQ0FBU3NELE9BQVQsQ0FBaUJHLFFBQTFPLEdBQXFQLHlDQUFyUCxHQUFpUzdELElBQUlJLElBQUosQ0FBU3NELE9BQVQsQ0FBaUJ0RCxJQUFsVTtBQUNELE9BRkQsTUFHSyxJQUFJSixJQUFJSSxJQUFKLENBQVNpRCxNQUFULEtBQW9CLFFBQXhCLEVBQWtDO0FBQ3JDRix3QkFBZ0IseUJBQXlCbkQsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlQyxNQUF4QyxHQUFpRCxpQkFBakQsR0FBcUV2RCxJQUFJSSxJQUFKLENBQVNvRCxVQUFULENBQW9CYixJQUF6RixHQUFnRyxhQUFoRyxHQUFnSDNDLElBQUlJLElBQUosQ0FBU29ELFVBQVQsQ0FBb0JDLEVBQXBJLEdBQXlJLFdBQXpJLEdBQXVKekQsSUFBSUksSUFBSixDQUFTc0QsT0FBVCxDQUFpQkMsSUFBakIsQ0FBc0JDLEtBQTdLLEdBQXFMLHFDQUFyTCxHQUE2TjVELElBQUlJLElBQUosQ0FBU3NELE9BQVQsQ0FBaUJHLFFBQTlPLEdBQXlQLHlDQUF6UCxHQUFxUzdELElBQUlJLElBQUosQ0FBU3NELE9BQVQsQ0FBaUJ0RCxJQUF0VTtBQUNELE9BRkksTUFHQSxJQUFJSixJQUFJSSxJQUFKLENBQVNpRCxNQUFULEtBQW9CLFNBQXhCLEVBQW1DO0FBQ3RDRix3QkFBZ0IsMEJBQTBCbkQsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlQyxNQUF6QyxHQUFrRCxXQUFsRCxHQUFnRXZELElBQUlJLElBQUosQ0FBU3NELE9BQVQsQ0FBaUJDLElBQWpCLENBQXNCQyxLQUF0RixHQUE4RixpQkFBOUYsR0FBa0g1RCxJQUFJSSxJQUFKLENBQVNvRCxVQUFULENBQW9CYixJQUF0SSxHQUE2SSxhQUE3SSxHQUE2SjNDLElBQUlJLElBQUosQ0FBU29ELFVBQVQsQ0FBb0JDLEVBQWpNO0FBQ0QsT0FGSSxNQUdBO0FBQ0hOLHdCQUFnQm5ELElBQUlJLElBQUosQ0FBU2lELE1BQVQsR0FBa0IscUNBQWxDO0FBQ0Q7QUFFRjtBQUNEO0FBcEJBLFNBcUJLLElBQUlyRCxJQUFJb0QsR0FBSixDQUFRLGdCQUFSLE1BQThCLFFBQWxDLEVBQTRDO0FBQy9DMUQsWUFBSSxhQUFhTSxJQUFJSSxJQUFKLENBQVNpRCxNQUExQjs7QUFFQUYsdUJBQWUseUJBQWY7O0FBRUEsWUFBSW5ELElBQUlJLElBQUosQ0FBU2lELE1BQVQsS0FBb0IsUUFBeEIsRUFBa0M7QUFDaENGLDBCQUFnQiwwQkFBMEJuRCxJQUFJSSxJQUFKLENBQVNvRCxVQUFULENBQW9CYixJQUE5QyxHQUFxRCxpQkFBckQsR0FBeUUzQyxJQUFJSSxJQUFKLENBQVNvRCxVQUFULENBQW9CQyxFQUE3RixHQUFrRyxnQ0FBbEcsR0FBcUl6RCxJQUFJSSxJQUFKLENBQVNrRCxLQUFULENBQWVDLE1BQXBKLEdBQTZKLGlCQUE3SixHQUFpTHZELElBQUlJLElBQUosQ0FBU2tELEtBQVQsQ0FBZWIsS0FBaE0sR0FBd00sdUJBQXhNLEdBQWtPekMsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlSyxJQUFmLENBQW9CQyxLQUF0UCxHQUE4UCxtQ0FBOVAsR0FBb1M1RCxJQUFJSSxJQUFKLENBQVNrRCxLQUFULENBQWVPLFFBQW5ULEdBQThULEdBQTlVO0FBQ0QsU0FGRCxNQUVPLElBQUk3RCxJQUFJSSxJQUFKLENBQVNpRCxNQUFULEtBQW9CLFFBQXhCLEVBQWtDO0FBQ3ZDRiwwQkFBZ0IsYUFBVyxvQ0FBWCxHQUFrRG5ELElBQUlJLElBQUosQ0FBU2tELEtBQVQsQ0FBZUMsTUFBakUsR0FBMEUsaUJBQTFFLEdBQThGdkQsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlYixLQUE3RyxHQUFvSCx1QkFBcEgsR0FBNEl6QyxJQUFJSSxJQUFKLENBQVNrRCxLQUFULENBQWVLLElBQWYsQ0FBb0JDLEtBQWhLLEdBQXNLLGtCQUF0SyxHQUEyTDVELElBQUlJLElBQUosQ0FBU29ELFVBQVQsQ0FBb0JiLElBQS9NLEdBQXNOLGlCQUF0TixHQUEwTzNDLElBQUlJLElBQUosQ0FBU29ELFVBQVQsQ0FBb0JDLEVBQTlQLEdBQWtRLEdBQWxSO0FBQ0QsU0FGTSxNQUVELElBQUd6RCxJQUFJSSxJQUFKLENBQVNpRCxNQUFULEtBQW9CLFVBQXZCLEVBQWtDO0FBQ3RDRiwwQkFBZ0IsNEJBQTBCbkQsSUFBSUksSUFBSixDQUFTb0QsVUFBVCxDQUFvQmIsSUFBOUMsR0FBbUQsaUJBQW5ELEdBQXNFM0MsSUFBSUksSUFBSixDQUFTb0QsVUFBVCxDQUFvQkMsRUFBMUYsR0FBNkYsMEJBQTdGLEdBQXdIekQsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlSyxJQUFmLENBQW9CQyxLQUE1SSxHQUFrSixnQ0FBbEosR0FBbUw1RCxJQUFJSSxJQUFKLENBQVNrRCxLQUFULENBQWVDLE1BQWxNLEdBQXlNLGlCQUF6TSxHQUEyTnZELElBQUlJLElBQUosQ0FBU2tELEtBQVQsQ0FBZWIsS0FBMU8sR0FBZ1AsbUNBQWhQLEdBQW9SekMsSUFBSUksSUFBSixDQUFTa0QsS0FBVCxDQUFlTyxRQUFuUyxHQUE0UyxHQUE1VDtBQUNILFNBRk8sTUFHRDtBQUNIViwwQkFBZ0JuRCxJQUFJSSxJQUFKLENBQVNpRCxNQUFULEdBQWtCLHFDQUFsQztBQUNEO0FBRUYsT0FoQkksTUFpQkE7QUFDSDNELFlBQUksaUJBQWlCTSxJQUFJb0QsR0FBSixDQUFRLGdCQUFSLENBQXJCO0FBQ0FELHVCQUFlLDJCQUFmO0FBQ0Q7O0FBRUQ7Ozs7O0FBS0F6RCxRQUFJeUQsWUFBSjtBQUNBLFdBQU9BLFlBQVA7QUFDRCxHQXZETSxDQUFQO0FBeURELENBeEVEOztBQTBFQTtBQUNPLElBQU1XLGtEQUFTLFNBQVRBLE1BQVMsQ0FBQ0MsT0FBRDtBQUFBLFNBQWEsVUFBQy9ELEdBQUQsRUFBTUMsR0FBTixFQUFXK0QsR0FBWCxFQUFnQkMsUUFBaEIsRUFBNkI7QUFDOUQsUUFBSWpFLElBQUlvRCxHQUFKLENBQVEsa0JBQVIsTUFDRixnREFBVyxRQUFYLEVBQXFCVyxPQUFyQixFQUE4QkcsTUFBOUIsQ0FBcUNGLEdBQXJDLEVBQTBDRyxNQUExQyxDQUFpRCxLQUFqRCxDQURGLEVBQzJEOztBQUV6RHhFLGtCQUFZLElBQVo7QUFDQUQsVUFBSSxTQUFKO0FBQ0E7QUFFRCxLQVBELE1BU0ssSUFBSU0sSUFBSW9ELEdBQUosQ0FBUSxpQkFBUixNQUNQLFVBQVUsZ0RBQVcsTUFBWCxFQUFtQlcsT0FBbkIsRUFBNEJHLE1BQTVCLENBQW1DRixHQUFuQyxFQUF3Q0csTUFBeEMsQ0FBK0MsS0FBL0MsQ0FEUCxFQUM4RDs7QUFFakV4RSxrQkFBWSxJQUFaO0FBQ0FELFVBQUksY0FBSjtBQUNBO0FBRUQsS0FQSSxNQU9FO0FBQ0xBLFVBQUksNkJBQUo7QUFDQVksY0FBUXdDLEdBQVIsQ0FBWTlDLEdBQVosRUFBaUIsRUFBRStDLE9BQU8sSUFBVCxFQUFqQjtBQUNBckQsVUFBSSwyQkFBSjs7QUFHQSxVQUFNd0IsTUFBTSxJQUFJVixLQUFKLENBQVUsMkJBQVYsQ0FBWjtBQUNBVSxVQUFJaEIsTUFBSixHQUFhLEdBQWI7QUFDQSxZQUFNZ0IsR0FBTjtBQUVEO0FBQ0YsR0E1QnFCO0FBQUEsQ0FBZjs7QUE4QlA7QUFDTyxJQUFNa0Qsd0RBQVksU0FBWkEsU0FBWSxDQUFDTCxPQUFEO0FBQUEsU0FBYSxVQUFDL0QsR0FBRCxFQUFNQyxHQUFOLEVBQVdvRSxJQUFYLEVBQW9CO0FBQ3hELFFBQUlyRSxJQUFJSSxJQUFKLENBQVNLLElBQVQsS0FBa0IsY0FBdEIsRUFBc0M7QUFDcENmLFVBQUksdUNBQUosRUFBNkNNLElBQUlJLElBQWpEO0FBQ0EsVUFBTUEsT0FBT08sS0FBSzJELFNBQUwsQ0FBZTtBQUMxQmpELGtCQUFVckIsSUFBSUksSUFBSixDQUFTZ0U7QUFETyxPQUFmLENBQWI7QUFHQW5FLFVBQUlzRSxHQUFKLENBQVEsa0JBQVIsRUFDRSxnREFBVyxRQUFYLEVBQXFCUixPQUFyQixFQUE4QkcsTUFBOUIsQ0FBcUM5RCxJQUFyQyxFQUEyQytELE1BQTNDLENBQWtELEtBQWxELENBREY7QUFFQWxFLFVBQUlRLElBQUosQ0FBUyxNQUFULEVBQWlCZ0IsSUFBakIsQ0FBc0JyQixJQUF0QjtBQUNBO0FBQ0Q7QUFDRGlFO0FBQ0QsR0Fad0I7QUFBQSxDQUFsQjs7QUFjUDtBQUNPLElBQU1HLGtEQUFTLFNBQVRBLE1BQVMsQ0FBQzNFLEtBQUQsRUFBUTRFLE1BQVIsRUFBZ0JWLE9BQWhCLEVBQXlCaEUsRUFBekIsRUFBNkJKLFNBQTdCLEVBQTJDO0FBQy9EO0FBQ0FYLFFBQU0wRixHQUFOLENBQVU3RSxLQUFWLEVBQWlCNEUsTUFBakIsRUFBeUIsVUFBQ3ZELEdBQUQsRUFBTXBCLEtBQU4sRUFBZ0I7QUFDdkMsUUFBSW9CLEdBQUosRUFBUztBQUNQbkIsU0FBR21CLEdBQUg7QUFDQTtBQUNEOztBQUVEeEIsUUFBSSxXQUFXSSxLQUFmO0FBQ0E7QUFDQUMsT0FBRyxJQUFILEVBQVNaOztBQUVQO0FBRk8sS0FHTitDLElBSE0sQ0FHRCxXQUhDOztBQUtQO0FBQ0FyRCxZQUFRd0QsSUFBUixDQUFhO0FBQ1g1QixZQUFNLEtBREs7QUFFWHFELGNBQVFBLE9BQU9DLE9BQVA7QUFGRyxLQUFiLENBTk87O0FBV1A7QUFDQUssY0FBVUwsT0FBVixDQVpPOztBQWNQO0FBQ0E7O0FBRUE7QUFDQW5FLHFCQUFpQkMsS0FBakIsRUFBd0JDLEtBQXhCLENBbEJPLENBQVQ7QUFxQkQsR0E3QkQ7QUE4QkQsQ0FoQ007O0FBa0NQO0FBQ0EsSUFBTTZFLE9BQU8sU0FBUEEsSUFBTyxDQUFDQyxJQUFELEVBQU9DLEdBQVAsRUFBWTlFLEVBQVosRUFBbUI7O0FBRTlCO0FBQ0F5RSxTQUNFSyxJQUFJQyxjQUROLEVBQ3NCRCxJQUFJRSxlQUQxQixFQUVFRixJQUFJRyx1QkFGTixFQUUrQixVQUFDOUQsR0FBRCxFQUFNN0IsR0FBTixFQUFjOztBQUV6QyxRQUFJNkIsR0FBSixFQUFTO0FBQ1BuQixTQUFHbUIsR0FBSDtBQUNBeEIsVUFBSSx1QkFBdUJ3QixHQUEzQjs7QUFFQTtBQUNEOztBQUVELFFBQUkyRCxJQUFJSSxJQUFSLEVBQWM7QUFDWnZGLFVBQUksa0NBQUosRUFBd0NtRixJQUFJSSxJQUE1Qzs7QUFFQW5HLFdBQUtvRyxZQUFMLENBQWtCN0YsR0FBbEIsRUFBdUI4RixNQUF2QixDQUE4Qk4sSUFBSUksSUFBbEMsRUFBd0NsRixFQUF4Qzs7QUFFQTtBQUNBVixVQUFJK0QsR0FBSixDQUFRLEdBQVIsRUFBYSxVQUFVekUsT0FBVixFQUFtQjBDLFFBQW5CLEVBQTZCO0FBQ3hDQSxpQkFBUytELFFBQVQsQ0FBa0IsMEJBQWxCO0FBRUQsT0FIRDtBQU9ELEtBYkQ7QUFnQkU7QUFDQUMsVUFBSUMsSUFBSixDQUFTVCxHQUFULEVBQWMsVUFBQzNELEdBQUQsRUFBTW9FLElBQU4sRUFBZTtBQUMzQixZQUFJcEUsR0FBSixFQUFTO0FBQ1BuQixhQUFHbUIsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNcUUsT0FBT1YsSUFBSVcsT0FBSixJQUFlLEdBQTVCO0FBQ0E5RixZQUFJLG1DQUFKLEVBQXlDNkYsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQXJDSDtBQXNDRCxDQXpDRDs7QUEyQ0EsSUFBSW5HLFFBQVF1RixJQUFSLEtBQWlCYyxNQUFyQixFQUE2QjtBQUMzQmQsT0FBS2UsUUFBUWQsSUFBYixFQUFtQmMsUUFBUWIsR0FBM0IsRUFBZ0MsVUFBQzNELEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1BaLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ3dCLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRHhCLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbiwgY2IpID0+IChyZXEsIHJlcykgPT4ge1xuICBsb2coXCIgMDAxIDogXCIgKyBldmVudFR5cGUpXG4gIC8vbG9nKFwidG9rZW4gOiBcIit0b2tlbilcbiAgbG9nKFwiYXBwIGlkIFwiICsgYXBwSWQpXG5cblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKSB7XG4gICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAvLyBvd24gbWVzc2FnZXNcbiAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgICAgbG9nKFwiY29tbWFuZCBcIiArIGNvbW1hbmQpO1xuXG4gICAgICBpZiAoIWNvbW1hbmQpXG4gICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcblxuXG4gICAgICBpZiAoY29tbWFuZCA9PT0gJy9pc3N1ZSBwaXBlbGluZScpIHtcbiAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nXCIpXG4gICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldERpYWxvZ0lkLFxuXG5cbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG5cblxuICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHsgcmVxdWVzdDogcmVxLCByZXNwb25zZTogcmVzLCBVc2VySW5wdXQ6IG1lc3NhZ2UgfSkudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICB9KVxuICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBsb2coXCJ1bmFibGUgdG8gc2VuZCBtZXNzYWdlIHRvIHNwYWNlXCIgKyBlcnIpO1xuICAgICAgfSlcbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gcGFyc2VSZXNwb25zZShyZXEsIHJlcylcbiAgICBwcm9taXNlLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICBzZW5kKDUsXG5cbiAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuXG4gIH1cblxuXG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgJzVhMDliMjM0ZTRiMDkwYmNkN2ZjZjNiMicgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgZGlhbG9nSWQsIGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlc1wiKVxuXG4gIHZhciBxID0gYGBcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJywge1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOiB0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IGBtdXRhdGlvbiBjcmVhdGVTcGFjZSB7IGNyZWF0ZVNwYWNlKGlucHV0OiB7IHRpdGxlOiBcXFwiU3BhY2UgdGl0bGVcXFwiLCAgbWVtYmVyczogWyR7dXNlcklkfV19KXsgc3BhY2UgeyAke3NwYWNlSWR9fWBcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJyArIGVycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApO1xufTtcblxuLy9nZXQgY29udGVudCBvZiBub3RpZmljYXRpb24gZnJvbSBnaXRodWJcbi8vZXhwb3J0IGNvbnN0IFxudmFyIHBhcnNlUmVzcG9uc2UgPSAoZnVuY3Rpb24gKHJlcSwgcmVzKSB7XG4gIGxvZygncGFyc2VyZXNwb25zZScpXG4gIC8vdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgLy92YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcblxuICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG4gICAgcXM6IHtcbiAgICB9LFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICB9LFxuICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICB9O1xuXG4gIHJldHVybiBycChVcmxPcHRpb25zKS50aGVuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBGaW5hbE1lc3NhZ2UgPSAnJztcblxuICAgIC8vQ09NTUVOVFNcbiAgICBpZiAocmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSA9PT0gJ2lzc3VlX2NvbW1lbnQnKSB7XG5cbiAgICAgIGxvZygnYWN0aW9uOiAnICsgcmVxLmJvZHkuYWN0aW9uKVxuXG4gICAgICBGaW5hbE1lc3NhZ2UgPSAnQSBDb21tZW50IGhhcyBqdXN0IGJlZW4gJ1xuXG4gICAgICBpZiAocmVxLmJvZHkuYWN0aW9uID09PSAnY3JlYXRlZCcpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlICs9ICdhZGRlZCB0byBpc3N1ZSAjJyArIHJlcS5ib2R5Lmlzc3VlLm51bWJlciArICcgaW4gcmVwb3NpdG9yeSAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lICsgJyB3aXRoIElEIDogJyArIHJlcS5ib2R5LnJlcG9zaXRvcnkuaWQgKyAnIGJ5IHVzZXIgJyArIHJlcS5ib2R5LmNvbW1lbnQudXNlci5sb2dpbiArICdcXG4gVGhlIGNvbW1lbnQgY2FuIGJlIGZvdW5kIGhlcmUgOiAnICsgcmVxLmJvZHkuY29tbWVudC5odG1sX3VybCArICcuIFxcbiBUaGUgY29udGVudCBvZiB0aGUgY29tbWVudCBpcyA6IFxcbicgKyByZXEuYm9keS5jb21tZW50LmJvZHk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXEuYm9keS5hY3Rpb24gPT09ICdlZGl0ZWQnKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSArPSAnZWRpdGVkIHVuZGVyIGlzc3VlICMnICsgcmVxLmJvZHkuaXNzdWUubnVtYmVyICsgJyBpbiByZXBvc2l0b3J5ICcgKyByZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUgKyAnIHdpdGggSUQgOiAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5pZCArICcgYnkgdXNlciAnICsgcmVxLmJvZHkuY29tbWVudC51c2VyLmxvZ2luICsgJ1xcbiBUaGUgY29tbWVudCBjYW4gYmUgZm91bmQgaGVyZSA6ICcgKyByZXEuYm9keS5jb21tZW50Lmh0bWxfdXJsICsgJy4gXFxuIFRoZSBjb250ZW50IG9mIHRoZSBjb21tZW50IGlzIDogXFxuJyArIHJlcS5ib2R5LmNvbW1lbnQuYm9keTtcbiAgICAgIH0gXG4gICAgICBlbHNlIGlmIChyZXEuYm9keS5hY3Rpb24gPT09ICdkZWxldGVkJykge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ2RlbGV0ZWQgdW5kZXIgaXNzdWUgIycgKyByZXEuYm9keS5pc3N1ZS5udW1iZXIgKyAnIGJ5IHVzZXIgJyArIHJlcS5ib2R5LmNvbW1lbnQudXNlci5sb2dpbiArICcgaW4gcmVwb3NpdG9yeSAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lICsgJyB3aXRoIElEIDogJyArIHJlcS5ib2R5LnJlcG9zaXRvcnkuaWQ7XG4gICAgICB9IFxuICAgICAgZWxzZSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSArPSByZXEuYm9keS5hY3Rpb24gKyAnIGFjdGlvbiBub3QgY29kZWQgeWV0Li4uY29taW5nIHNvb24nXG4gICAgICB9XG5cbiAgICB9IFxuICAgIC8vSVNTVUVTXG4gICAgZWxzZSBpZiAocmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSA9PT0gJ2lzc3VlcycpIHtcbiAgICAgIGxvZygnYWN0aW9uOiAnICsgcmVxLmJvZHkuYWN0aW9uKVxuXG4gICAgICBGaW5hbE1lc3NhZ2UgPSAnQW4gaXNzdWUgaGFzIGp1c3QgYmVlbiAnXG5cbiAgICAgIGlmIChyZXEuYm9keS5hY3Rpb24gPT09ICdvcGVuZWQnKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSArPSAnb3BlbmVkIGluIHJlcG9zaXRvcnkgJyArIHJlcS5ib2R5LnJlcG9zaXRvcnkubmFtZSArICcgd2l0aCByZXBvIGlkOiAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5pZCArICdcXG5Jc3N1ZSBEZXRhaWxzOlxcbklzc3VlIElEIDogIycgKyByZXEuYm9keS5pc3N1ZS5udW1iZXIgKyAnXFxuSXNzdWUgVGl0bGU6ICcgKyByZXEuYm9keS5pc3N1ZS50aXRsZSArICdcXG4gSXNzdWUgb3BlbmVkIGJ5IDogJyArIHJlcS5ib2R5Lmlzc3VlLnVzZXIubG9naW4gKyAnXFxuIFRoZSBJc3N1ZSBjYW4gYmUgZm91bmQgaGVyZSA6ICcgKyByZXEuYm9keS5pc3N1ZS5odG1sX3VybCArICcuJztcbiAgICAgIH0gZWxzZSBpZiAocmVxLmJvZHkuYWN0aW9uID09PSAnY2xvc2VkJykge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ2Nsb3NlZC4gJysnXFxuSXNzdWUgRGV0YWlsczpcXG5Jc3N1ZSBOdW1iZXIgOiAjJyArIHJlcS5ib2R5Lmlzc3VlLm51bWJlciArICdcXG5Jc3N1ZSBUaXRsZTogJyArIHJlcS5ib2R5Lmlzc3VlLnRpdGxlICsnXFxuIElzc3VlIGNsb3NlZCBieSA6ICcrcmVxLmJvZHkuaXNzdWUudXNlci5sb2dpbisnXFxuSW4gcmVwb3NpdG9yeSAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lICsgJyB3aXRoIHJlcG8gaWQ6ICcgKyByZXEuYm9keS5yZXBvc2l0b3J5LmlkICsnLic7XG4gICAgICB9ZWxzZSBpZihyZXEuYm9keS5hY3Rpb24gPT09ICdyZW9wZW5lZCcpe1xuICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ3Jlb3BlbmVkIGluIHJlcG9zaXRvcnkgJytyZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUrJyB3aXRoIHJlcG8gaWQ6ICcgK3JlcS5ib2R5LnJlcG9zaXRvcnkuaWQrJ1xcbiBJc3N1ZSBSZS1vcGVuZWQgYnkgOiAnK3JlcS5ib2R5Lmlzc3VlLnVzZXIubG9naW4rJ1xcbklzc3VlIERldGFpbHM6XFxuSXNzdWUgSUQgOiAjJytyZXEuYm9keS5pc3N1ZS5udW1iZXIrJ1xcbklzc3VlIFRpdGxlOiAnK3JlcS5ib2R5Lmlzc3VlLnRpdGxlKydcXG4gVGhlIElzc3VlIGNhbiBiZSBmb3VuZCBoZXJlIDogJytyZXEuYm9keS5pc3N1ZS5odG1sX3VybCsnLic7XG4gICAgfSBcbiAgICAgIGVsc2Uge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gcmVxLmJvZHkuYWN0aW9uICsgJyBhY3Rpb24gbm90IGNvZGVkIHlldC4uLmNvbWluZyBzb29uJ1xuICAgICAgfVxuXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9nKCdFdmVudCB0eXBlOiAnICsgcmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSlcbiAgICAgIEZpbmFsTWVzc2FnZSA9ICdOb3QgYSBjb21tZW50IG9uIGFuIGlzc3VlJ1xuICAgIH1cblxuICAgIC8qIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICAgICBcIk1lc3NhZ2VcIjogRmluYWxNZXNzYWdlXG4gICAgIH07Ki9cblxuICAgIGxvZyhGaW5hbE1lc3NhZ2UpXG4gICAgcmV0dXJuIEZpbmFsTWVzc2FnZTtcbiAgfSk7XG5cbn0pO1xuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgPT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ1dXJ1xuICAgIGxvZyhcImZyb20gV1dcIilcbiAgICByZXR1cm47XG5cbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICAgIFwic2hhMT1cIiArIGNyZWF0ZUhtYWMoJ3NoYTEnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnRUwnXG4gICAgbG9nKFwiZ2l0aHViIGV2ZW50XCIpXG4gICAgcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG5cblxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcInRvayA6IFwiICsgdG9rZW4pXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuXG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19