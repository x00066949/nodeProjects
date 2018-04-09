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
parseResponse(function (req, res) {
  log('parseresponse');
  //var req = options.request;
  //var res = options.response;
  return rp('api.github.com').then(function () {

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
});

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsImRpciIsImRlcHRoIiwiRmluYWxNZXNzYWdlIiwiZ2V0IiwiYWN0aW9uIiwiaXNzdWUiLCJpZCIsInJlcG9zaXRvcnkiLCJjb21tZW50IiwidXNlciIsImxvZ2luIiwiaHRtbF91cmwiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJlbnYiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIiwicHJvY2VzcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLE07O0FBRVo7Ozs7Ozs7O0FBWkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQVlBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1NLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjtBQUNBLElBQUlDLFNBQUo7O0FBRU8sSUFBTUMsc0VBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSLEVBQWNDLEVBQWQ7QUFBQSxTQUFxQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYTtBQUNoRVAsUUFBSSxZQUFVQyxTQUFkO0FBQ0E7QUFDQUQsUUFBSSxZQUFXRyxLQUFmOztBQUdBLFFBQUlGLGNBQWMsSUFBbEIsRUFBdUI7QUFDbkI7QUFDRjtBQUNBTSxVQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUU7QUFDQTtBQUNBLFVBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlIsS0FBeEIsRUFBK0I7QUFDN0JTLGdCQUFRWixHQUFSLENBQVks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V0FBS2dHLFlBQUwsQ0FBa0J6RixHQUFsQixFQUF1QjBGLE1BQXZCLENBQThCTixJQUFJSSxJQUFsQyxFQUF3QzlFLEVBQXhDOztBQUVEO0FBQ0NWLFVBQUk0RCxHQUFKLENBQVEsR0FBUixFQUFhLFVBQVV0RSxPQUFWLEVBQW1CMEMsUUFBbkIsRUFBNkI7QUFDeENBLGlCQUFTMkQsUUFBVCxDQUFrQiwwQkFBbEI7QUFFRCxPQUhEO0FBT0QsS0FiRDtBQWdCRTtBQUNBQyxVQUFJQyxJQUFKLENBQVNULEdBQVQsRUFBYyxVQUFDdkQsR0FBRCxFQUFNZ0UsSUFBTixFQUFlO0FBQzNCLFlBQUloRSxHQUFKLEVBQVM7QUFDUG5CLGFBQUdtQixHQUFIO0FBQ0E7QUFDRDtBQUNELFlBQU1pRSxPQUFPVixJQUFJVyxPQUFKLElBQWUsR0FBNUI7QUFDQTFGLFlBQUksbUNBQUosRUFBeUN5RixJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJL0YsUUFBUW1GLElBQVIsS0FBaUJjLE1BQXJCLEVBQTZCO0FBQzNCZCxPQUFLZSxRQUFRZCxJQUFiLEVBQW1CYyxRQUFRYixHQUEzQixFQUFnQyxVQUFDdkQsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUFosY0FBUVosR0FBUixDQUFZLHFCQUFaLEVBQW1Dd0IsR0FBbkM7QUFDQTtBQUNEOztBQUVEeEIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xudmFyIGV2ZW50VHlwZTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NfcmVxdWVzdHMgPSAoYXBwSWQsIHRva2VuLGNiKSA9PiAocmVxLCByZXMpID0+e1xuICBsb2coXCIgMDAxIDogXCIrZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIisgYXBwSWQpXG4gIFxuXG4gIGlmIChldmVudFR5cGUgPT09ICdXVycpe1xuICAgICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcbiAgICBcbiAgICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAgIC8vIG93biBtZXNzYWdlc1xuICAgICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgICByZXR1cm47XG4gICAgXG4gICAgICB9XG4gICAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2cocmVzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIFxuICAgICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuICAgIFxuICAgICAgaWYoIXJlcSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG4gICAgXG4gICAgICBsb2cocmVxLmJvZHkpO1xuICAgIFxuICAgICAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnIC8qJiYgcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQudGFyZ2V0QXBwSWQgPT09IGFwcElkKi8pIHtcbiAgICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgICAgICBsb2coXCJjb21tYW5kIFwiK2NvbW1hbmQpO1xuICAgIFxuICAgICAgICBpZiAoIWNvbW1hbmQpXG4gICAgICAgICAgbG9nKFwibm8gY29tbWFuZCB0byBwcm9jZXNzXCIpO1xuICAgICAgICBcbiAgICBcbiAgICAgICAgaWYoY29tbWFuZCA9PT0gJy9pc3N1ZSBwaXBlbGluZScpe1xuICAgICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZ1wiKVxuICAgICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICAgIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJytjb21tYW5kO1xuICAgIFxuICAgIFxuICAgICAgICBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDptZXNzYWdlfSkudGhlbigodG9fcG9zdCk9PntcbiAgICAgICAgICBcbiAgICAgICAgICBsb2coXCJzcGFjZSBpZCBcIityZXEuYm9keS5zcGFjZUlkKVxuICAgICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG4gICAgXG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goKGVycik9PntcbiAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gc2VuZCBtZXNzYWdlIHRvIHNwYWNlXCIgKyBlcnIpO1xuICAgICAgICB9KVxuICAgICAgfTtcblxuICB9ZWxzZSBpZihldmVudFR5cGUgPT09ICdFTCcpe1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIGxvZyhcIkVMIHRva2VuIDogXCIrb2F1dGgub1Rva2VuKCkpXG5cbiAgICAvL3ZhciB0b2tzID0gb2F1dGgub1Rva2VuO1xuICAgIGxvZyhcIiAwMDIgOiBcIitldmVudFR5cGUpXG4gICAgICBcbiAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZyhyZXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgXG4gICAgICBsb2coXCJQcm9jZXNzaW5nIGdpdGh1YiBldmVudFwiKTtcbiAgICBcbiAgICAgIGlmKCFyZXEpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuICAgIFxuICAgICAgbG9nKHJlcS5ib2R5KTtcbiAgXG4gICAgICB2YXIgcHJvbWlzZSA9IHBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgICBwcm9taXNlLnRoZW4oKHRvX3Bvc3QpPT57XG4gICAgICAgIFxuICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiK3RvX3Bvc3QpO1xuICBcbiAgICAgICAgc2VuZCg1LFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIC8vcmV0dXJuO1xuICAgIFxuICB9ZWxzZXtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG4gICAgXG4gIH1cbiAgXG4gIFxuXG59XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArICc1YTA5YjIzNGU0YjA5MGJjZDdmY2YzYjInICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIGRpYWxvZ0lkLGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlc1wiKVxuXG4gIHZhciBxID0gYGBcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJyx7XG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ2p3dCc6dG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnICxcbiAgICAgICAgJ3gtZ3JhcGhxbC12aWV3JzogJ1BVQkxJQywgQkVUQSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keTogYG11dGF0aW9uIGNyZWF0ZVNwYWNlIHsgY3JlYXRlU3BhY2UoaW5wdXQ6IHsgdGl0bGU6IFxcXCJTcGFjZSB0aXRsZVxcXCIsICBtZW1iZXJzOiBbJHt1c2VySWR9XX0peyBzcGFjZSB7ICR7c3BhY2VJZH19YFxuXG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdmYWlsZWQgZXJyOiAnK2VycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLHtkZXB0aDpudWxsfSlcbiAgICAgICAgbG9nKCdFcnJvciBjcmVhdGluZyBkaWFsb2cgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9XG4gICk7XG59O1xuXG4vL2dldCBjb250ZW50IG9mIG5vdGlmaWNhdGlvbiBmcm9tIGdpdGh1YlxuLy9leHBvcnQgY29uc3QgXG5wYXJzZVJlc3BvbnNlKGZ1bmN0aW9uIChyZXEgLCByZXMpIHtcbiAgbG9nKCdwYXJzZXJlc3BvbnNlJylcbiAgLy92YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAvL3ZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICByZXR1cm4gcnAoJ2FwaS5naXRodWIuY29tJykudGhlbihmdW5jdGlvbigpe1xuXG4gICAgdmFyIEZpbmFsTWVzc2FnZT0nJztcbiAgICBcbiAgICAgIGlmKHJlcS5nZXQoJ1gtR2l0aHViLUV2ZW50JykgPT09ICdpc3N1ZV9jb21tZW50JyApe1xuICAgIFxuICAgICAgICAgIGxvZygnYWN0aW9uOiAnK3JlcS5ib2R5LmFjdGlvbilcbiAgICBcbiAgICAgICAgICBGaW5hbE1lc3NhZ2UgPSAnQSBDb21tZW50IGhhcyBqdXN0IGJlZW4gJ1xuICAgIFxuICAgICAgICAgIGlmKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ2NyZWF0ZWQnKXtcbiAgICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9ICdhZGRlZCB0byBpc3N1ZSAjJytyZXEuYm9keS5pc3N1ZS5pZCsnIGluIHJlcG9zaXRvcnkgJyArcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lKycgd2l0aCBJRCA6ICcrcmVxLmJvZHkucmVwb3NpdG9yeS5pZCsnIGJ5IHVzZXIgJytyZXEuYm9keS5jb21tZW50LnVzZXIubG9naW4rJ1xcbiBUaGUgY29tbWVudCBjYW4gYmUgZm91bmQgaGVyZSA6ICcrcmVxLmJvZHkuY29tbWVudC5odG1sX3VybCsnLiBcXG4gVGhlIGNvbnRlbnQgb2YgdGhlIGNvbW1lbnQgaXMgOiBcXG4nK3JlcS5ib2R5LmNvbW1lbnQuYm9keTtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9IHJlcS5ib2R5LmFjdGlvbisnIGFjdGlvbiBub3QgY29kZWQgeWV0Li4uY29taW5nIHNvb24nXG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgICBsb2coJ0V2ZW50IHR5cGU6ICcrcmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSlcbiAgICAgICAgICBGaW5hbE1lc3NhZ2UgPSAnTm90IGEgY29tbWVudCBvbiBhbiBpc3N1ZSdcbiAgICAgIH1cbiAgICBcbiAgICAgLyogdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICAgICAgXCJNZXNzYWdlXCI6IEZpbmFsTWVzc2FnZVxuICAgICAgfTsqL1xuICAgIFxuICAgICAgbG9nKEZpbmFsTWVzc2FnZSlcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2U7XG4gIH0pO1xuXG59KTtcblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykgKSB7XG4gICAgICBcbiAgICAgIGV2ZW50VHlwZT0nV1cnXG4gICAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgICByZXR1cm47XG4gICAgIFxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gIFwic2hhMT1cIitjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSl7XG5cbiAgICBldmVudFR5cGU9J0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9ZWxzZXtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEse2RlcHRoOm51bGx9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG4gICAgXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwidG9rIDogXCIrdG9rZW4pXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=