/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.promisify = exports.process_requests = undefined;

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

var /*istanbul ignore next*/_q = require('q');

/*istanbul ignore next*/var _q2 = _interopRequireDefault(_q);

var /*istanbul ignore next*/_superagent = require('superagent');

/*istanbul ignore next*/var _superagent2 = _interopRequireDefault(_superagent);

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
          } else {

            // message represents the message coming in from WW to be processed by the App
            var message = '@scrumbot ' + command;

            board.getScrumData({ request: req, response: res, UserInput: message }).then(function (to_post) {

              log("space id " + req.body.spaceId);
              log("data got = " + to_post);

              send(req.body.spaceId, util.format('Hey %s, : %s', req.body.userName, to_post), token(), function (err, res) {
                if (!err) log('Sent message to space %s', req.body.spaceId);
              });
            }).catch(function (err) {
              send(req.body.spaceId, util.format('Hey %s, : %s', req.body.userName, 'Unable to process command'), token(), function (err, res) {
                if (!err) log('Sent message to space %s', req.body.spaceId);
              });
              log("unable to process command" + err);
            });
          }
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

  var q = /*istanbul ignore next*/'mutation {\n    createTargetedMessage(input: {\n      conversationId: ' + spaceId + '\n      targetUserId: ' + userId + '\n      targetDialogId: ' + dialogId + '\n      annotations: [\n      {\n        genericAnnotation: {\n          title: "Sample Title",\n          text: "Sample Body"\n          buttons: [\n            {\n              postbackButton: {\n                title: "Sample Button",\n                id: "Sample_Button",\n                style: PRIMARY\n              }\n            }\n          ]\n        }\n      }\n      ]\n      }) {\n      successful\n    }\n  }';
  var req = /*istanbul ignore next*/_superagent2.default.post('https://api.watsonwork.ibm.com/graphql').set('Authorization', /*istanbul ignore next*/'Bearer ' + tok).set('Content-Type', 'application/graphql').set('Accept-Encoding', '').send(q.replace(/\s+/g, ' '));

  return promisify(req).then(function (res) {
    log(res.body);
    console.dir(req, { depth: null });
    if (res.body && res.body.errors) {
      var err = new Error('Error executing GraphQL request');
      err.res = res;
      throw err;
    }

    return res;
  });
  /*request.post(
    'https://api.watsonwork.ibm.com/graphql', {
       headers: {
        'jwt': tok,
        'Content-Type': 'application/graphql',
        'x-graphql-view': 'PUBLIC, BETA'
      },
      json: true,
      body: q
     }, (err, res) => {
      if (err || res.statusCode !== 201) {
        log('failed err: ' + err)
        console.dir(res, { depth: null })
        log('Error creating dialog %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    }
  );*/
};

var promisify = /*istanbul ignore next*/exports.promisify = function promisify(req) {
  var deferred = /*istanbul ignore next*/_q2.default.defer();

  req.end(function (err, res) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsInNldCIsInJlcGxhY2UiLCJwcm9taXNpZnkiLCJkaXIiLCJkZXB0aCIsImVycm9ycyIsImRlZmVycmVkIiwiZGVmZXIiLCJyZWplY3QiLCJyZXNvbHZlIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiZW52IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJyZWRpcmVjdCIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSIsInByb2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUNaOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7QUFkQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBY0EsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBZUMsRUFBZjtBQUFBLFNBQXNCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ2xFUCxRQUFJLFlBQVlDLFNBQWhCO0FBQ0E7QUFDQUQsUUFBSSxZQUFZRyxLQUFoQjs7QUFHQSxRQUFJRixjQUFjLElBQWxCLEVBQXdCO0FBQ3RCO0FBQ0E7QUFDQU0sVUFBSUMsTUFBSixDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCOztBQUVBO0FBQ0E7QUFDQSxVQUFJSCxJQUFJSSxJQUFKLENBQVNDLE1BQVQsS0FBb0JSLEtBQXhCLEVBQStCO0FBQzdCUyxnQkFBUVosR0FBUixDQUFZ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YUFBR21CLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTStELE9BQU9WLElBQUlXLE9BQUosSUFBZSxHQUE1QjtBQUNBeEYsWUFBSSxtQ0FBSixFQUF5Q3VGLElBQXpDO0FBQ0E7QUFDRCxPQVJEO0FBU0gsR0FyQ0g7QUFzQ0QsQ0F6Q0Q7O0FBMkNBLElBQUk3RixRQUFRaUYsSUFBUixLQUFpQmMsTUFBckIsRUFBNkI7QUFDM0JkLE9BQUtlLFFBQVFkLElBQWIsRUFBbUJjLFFBQVFiLEdBQTNCLEVBQWdDLFVBQUNyRCxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQWixjQUFRWixHQUFSLENBQVkscUJBQVosRUFBbUN3QixHQUFuQztBQUNBO0FBQ0Q7O0FBRUR4QixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuaW1wb3J0ICogYXMgYm9hcmQgZnJvbSAnLi9zY3J1bV9ib2FyZCc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnLi9pc3N1ZV9ldmVudHMnO1xuaW1wb3J0IHEgZnJvbSAncSc7XG5pbXBvcnQgYWdlbnQgZnJvbSAnc3VwZXJhZ2VudCc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbiwgY2IpID0+IChyZXEsIHJlcykgPT4ge1xuICBsb2coXCIgMDAxIDogXCIgKyBldmVudFR5cGUpXG4gIC8vbG9nKFwidG9rZW4gOiBcIit0b2tlbilcbiAgbG9nKFwiYXBwIGlkIFwiICsgYXBwSWQpXG5cblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKSB7XG4gICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAvLyBvd24gbWVzc2FnZXNcbiAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgICAgbG9nKFwiY29tbWFuZCBcIiArIGNvbW1hbmQpO1xuXG4gICAgICBpZiAoIWNvbW1hbmQpXG4gICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcblxuXG4gICAgICBpZiAoY29tbWFuZCA9PT0gJy9pc3N1ZSBwaXBlbGluZScpIHtcbiAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nXCIpXG4gICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldERpYWxvZ0lkLFxuXG5cbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIClcbiAgICAgIH1lbHNle1xuXG4gICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnICsgY29tbWFuZDtcbiAgICAgIFxuICAgICAgXG4gICAgICAgICAgICBib2FyZC5nZXRTY3J1bURhdGEoeyByZXF1ZXN0OiByZXEsIHJlc3BvbnNlOiByZXMsIFVzZXJJbnB1dDogbWVzc2FnZSB9KS50aGVuKCh0b19wb3N0KSA9PiB7XG4gICAgICBcbiAgICAgICAgICAgICAgbG9nKFwic3BhY2UgaWQgXCIgKyByZXEuYm9keS5zcGFjZUlkKVxuICAgICAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG4gICAgICBcbiAgICAgICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsICdVbmFibGUgdG8gcHJvY2VzcyBjb21tYW5kJyksXG4gICAgICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIGxvZyhcInVuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmRcIiArIGVycik7XG4gICAgICAgICAgICB9KVxuXG4gICAgICB9XG5cbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy9yZXR1cm47XG5cbiAgfSBlbHNlIHtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG5cbiAgfVxuXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIGRpYWxvZ0lkLCBjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXNcIilcblxuICB2YXIgcSA9IGBtdXRhdGlvbiB7XG4gICAgY3JlYXRlVGFyZ2V0ZWRNZXNzYWdlKGlucHV0OiB7XG4gICAgICBjb252ZXJzYXRpb25JZDogJHtzcGFjZUlkfVxuICAgICAgdGFyZ2V0VXNlcklkOiAke3VzZXJJZH1cbiAgICAgIHRhcmdldERpYWxvZ0lkOiAke2RpYWxvZ0lkfVxuICAgICAgYW5ub3RhdGlvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgZ2VuZXJpY0Fubm90YXRpb246IHtcbiAgICAgICAgICB0aXRsZTogXCJTYW1wbGUgVGl0bGVcIixcbiAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBCb2R5XCJcbiAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHBvc3RiYWNrQnV0dG9uOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2FtcGxlIEJ1dHRvblwiLFxuICAgICAgICAgICAgICAgIGlkOiBcIlNhbXBsZV9CdXR0b25cIixcbiAgICAgICAgICAgICAgICBzdHlsZTogUFJJTUFSWVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBdXG4gICAgICB9KSB7XG4gICAgICBzdWNjZXNzZnVsXG4gICAgfVxuICB9YFxuICBjb25zdCByZXEgPSBhZ2VudC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcpXG4gIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rfWApXG4gIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9ncmFwaHFsJylcbiAgLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJycpXG4gIC5zZW5kKHEucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcblxucmV0dXJuIHByb21pc2lmeShyZXEpLnRoZW4ocmVzID0+IHtcbiAgbG9nKHJlcy5ib2R5KVxuICBjb25zb2xlLmRpcihyZXEse2RlcHRoOm51bGx9KVxuICBpZiAocmVzLmJvZHkgJiYgcmVzLmJvZHkuZXJyb3JzKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0Vycm9yIGV4ZWN1dGluZyBHcmFwaFFMIHJlcXVlc3QnKTtcbiAgICAgIGVyci5yZXMgPSByZXM7XG4gICAgICB0aHJvdyBlcnI7XG4gIH1cblxuICByZXR1cm4gcmVzO1xufSk7XG4gIC8qcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcsIHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0JzogdG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBxXG5cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ2ZhaWxlZCBlcnI6ICcgKyBlcnIpXG4gICAgICAgIGNvbnNvbGUuZGlyKHJlcywgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgICBsb2coJ0Vycm9yIGNyZWF0aW5nIGRpYWxvZyAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH1cbiAgKTsqL1xufTtcblxuXG5leHBvcnQgY29uc3QgcHJvbWlzaWZ5ID0gKHJlcSk9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgPT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ1dXJ1xuICAgIGxvZyhcImZyb20gV1dcIilcbiAgICByZXR1cm47XG5cbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICAgIFwic2hhMT1cIiArIGNyZWF0ZUhtYWMoJ3NoYTEnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnRUwnXG4gICAgbG9nKFwiZ2l0aHViIGV2ZW50XCIpXG4gICAgcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG5cblxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcInRvayA6IFwiICsgdG9rZW4pXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuXG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19