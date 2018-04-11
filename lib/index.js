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

      var promise = events.parseResponse(req, res);
      promise.then(function (to_post) {

        log("data got = " + to_post);

        send('5a09b234e4b090bcd7fcf3b2', to_post, oauth.oToken(), function (err, res) {
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

  request.post('https://api.watsonwork.ibm.com/v1/spaces/' + spaceId + '/messages', {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsImRpciIsImRlcHRoIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiZW52IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJyZWRpcmVjdCIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSIsInByb2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUVaOzs7Ozs7OztBQVpBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFZQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7QUFDQSxJQUFJQyxTQUFKOztBQUVPLElBQU1DLHNFQUFtQixTQUFuQkEsZ0JBQW1CLENBQUNDLEtBQUQsRUFBUUMsS0FBUixFQUFlQyxFQUFmO0FBQUEsU0FBc0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDbEVQLFFBQUksWUFBWUMsU0FBaEI7QUFDQTtBQUNBRCxRQUFJLFlBQVlHLEtBQWhCOztBQUdBLFFBQUlGLGNBQWMsSUFBbEIsRUFBd0I7QUFDdEI7QUFDQTtBQUNBTSxVQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUE7QUFDQTtBQUNBLFVBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlIsS0FBeEIsRUFBK0I7QUFDN0JTLGdCQUFRWixHQUFSLENBQVksVUFBWixFQUF3Qk0sSUFBSUksSUFBNUI7QUFDQTtBQUVEO0FBQ0QsVUFBSUgsSUFBSU0sVUFBSixLQUFtQixHQUF2QixFQUE0QjtBQUMxQmIsWUFB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QUF4Qzs7QUFFQTtBQUNBVixVQUFJK0QsR0FBSixDQUFRLEdBQVIsRUFBYSxVQUFVekUsT0FBVixFQUFtQjBDLFFBQW5CLEVBQTZCO0FBQ3hDQSxpQkFBU2tELFFBQVQsQ0FBa0IsMEJBQWxCO0FBRUQsT0FIRDtBQU9ELEtBYkQ7QUFnQkU7QUFDQUMsVUFBSUMsSUFBSixDQUFTVCxHQUFULEVBQWMsVUFBQzlDLEdBQUQsRUFBTXVELElBQU4sRUFBZTtBQUMzQixZQUFJdkQsR0FBSixFQUFTO0FBQ1BuQixhQUFHbUIsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNd0QsT0FBT1YsSUFBSVcsT0FBSixJQUFlLEdBQTVCO0FBQ0FqRixZQUFJLG1DQUFKLEVBQXlDZ0YsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQXJDSDtBQXNDRCxDQXpDRDs7QUEyQ0EsSUFBSXRGLFFBQVEwRSxJQUFSLEtBQWlCYyxNQUFyQixFQUE2QjtBQUMzQmQsT0FBS2UsUUFBUWQsSUFBYixFQUFtQmMsUUFBUWIsR0FBM0IsRUFBZ0MsVUFBQzlDLEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1BaLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ3dCLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRHhCLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbiwgY2IpID0+IChyZXEsIHJlcykgPT4ge1xuICBsb2coXCIgMDAxIDogXCIgKyBldmVudFR5cGUpXG4gIC8vbG9nKFwidG9rZW4gOiBcIit0b2tlbilcbiAgbG9nKFwiYXBwIGlkIFwiICsgYXBwSWQpXG5cblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKSB7XG4gICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAvLyBvd24gbWVzc2FnZXNcbiAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgICAgbG9nKFwiY29tbWFuZCBcIiArIGNvbW1hbmQpO1xuXG4gICAgICBpZiAoIWNvbW1hbmQpXG4gICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcblxuXG4gICAgICBpZiAoY29tbWFuZCA9PT0gJy9pc3N1ZSBwaXBlbGluZScpIHtcbiAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nXCIpXG4gICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldERpYWxvZ0lkLFxuXG5cbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG5cblxuICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHsgcmVxdWVzdDogcmVxLCByZXNwb25zZTogcmVzLCBVc2VySW5wdXQ6IG1lc3NhZ2UgfSkudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICB9KVxuICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBsb2coXCJ1bmFibGUgdG8gc2VuZCBtZXNzYWdlIHRvIHNwYWNlXCIgKyBlcnIpO1xuICAgICAgfSlcbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy9yZXR1cm47XG5cbiAgfSBlbHNlIHtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG5cbiAgfVxuXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIGRpYWxvZ0lkLCBjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXNcIilcblxuICB2YXIgcSA9IGBgXG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcsIHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0JzogdG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBgbXV0YXRpb24gY3JlYXRlU3BhY2UgeyBjcmVhdGVTcGFjZShpbnB1dDogeyB0aXRsZTogXFxcIlNwYWNlIHRpdGxlXFxcIiwgIG1lbWJlcnM6IFske3VzZXJJZH1dfSl7IHNwYWNlIHsgJHtzcGFjZUlkfX1gXG5cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ2ZhaWxlZCBlcnI6ICcgKyBlcnIpXG4gICAgICAgIGNvbnNvbGUuZGlyKHJlcywgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgICBsb2coJ0Vycm9yIGNyZWF0aW5nIGRpYWxvZyAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH1cbiAgKTtcbn07XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnV1cnXG4gICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgIHJldHVybjtcblxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gICAgXCJzaGExPVwiICsgY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfSBlbHNlIHtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEsIHsgZGVwdGg6IG51bGwgfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwidG9rIDogXCIgKyB0b2tlbilcbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIC8vc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuXG4gICAgICAvL2hhbmRsZSBzbGFzaCBjb21tYW5kc1xuICAgICAgcHJvY2Vzc19yZXF1ZXN0cyhhcHBJZCwgdG9rZW4pXG5cbiAgICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICByZXNwb25zZS5yZWRpcmVjdCgnaHR0cDovL3dvcmtzcGFjZS5pYm0uY29tJyk7XG5cbiAgICAgICAgfSk7XG5cblxuXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=