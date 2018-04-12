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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsInNldCIsInJlcGxhY2UiLCJwcm9taXNpZnkiLCJlcnJvcnMiLCJkZWZlcnJlZCIsImRlZmVyIiwicmVqZWN0IiwicmVzb2x2ZSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImRpciIsImRlcHRoIiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiZW52IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJyZWRpcmVjdCIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSIsInByb2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUNaOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7QUFkQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBY0EsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBZUMsRUFBZjtBQUFBLFNBQXNCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ2xFUCxRQUFJLFlBQVlDLFNBQWhCO0FBQ0E7QUFDQUQsUUFBSSxZQUFZRyxLQUFoQjs7QUFHQSxRQUFJRixjQUFjLElBQWxCLEVBQXdCO0FBQ3RCO0FBQ0E7QUFDQU0sVUFBSUMsTUFBSixDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCOztBQUVBO0FBQ0E7QUFDQSxVQUFJSCxJQUFJSSxJQUFKLENBQVNDLE1BQVQsS0FBb0JSLEtBQXhCLEVBQStCO0FBQzdCUyxnQkFBUVosR0FBUixDQUFZ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eUN1RixJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJN0YsUUFBUWlGLElBQVIsS0FBaUJjLE1BQXJCLEVBQTZCO0FBQzNCZCxPQUFLZSxRQUFRZCxJQUFiLEVBQW1CYyxRQUFRYixHQUEzQixFQUFnQyxVQUFDckQsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUFosY0FBUVosR0FBUixDQUFZLHFCQUFaLEVBQW1Dd0IsR0FBbkM7QUFDQTtBQUNEOztBQUVEeEIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcbmltcG9ydCBxIGZyb20gJ3EnO1xuaW1wb3J0IGFnZW50IGZyb20gJ3N1cGVyYWdlbnQnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgaWYgKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKSB7XG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZ1wiKVxuICAgICAgICBkaWFsb2cocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXREaWFsb2dJZCxcblxuXG4gICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgIH1cblxuICAgICAgICApXG4gICAgICB9ZWxzZXtcblxuICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG4gICAgICBcbiAgICAgIFxuICAgICAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHsgcmVxdWVzdDogcmVxLCByZXNwb25zZTogcmVzLCBVc2VySW5wdXQ6IG1lc3NhZ2UgfSkudGhlbigodG9fcG9zdCkgPT4ge1xuICAgICAgXG4gICAgICAgICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuICAgICAgXG4gICAgICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCAnVW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZCcpLFxuICAgICAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gcHJvY2VzcyBjb21tYW5kXCIgKyBlcnIpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfTtcblxuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ0VMJykge1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIGxvZyhcIkVMIHRva2VuIDogXCIgKyBvYXV0aC5vVG9rZW4oKSlcblxuICAgIC8vdmFyIHRva3MgPSBvYXV0aC5vVG9rZW47XG4gICAgbG9nKFwiIDAwMiA6IFwiICsgZXZlbnRUeXBlKVxuXG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3NpbmcgZ2l0aHViIGV2ZW50XCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IGV2ZW50cy5wYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgIHByb21pc2UudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQoJzVhMDliMjM0ZTRiMDkwYmNkN2ZjZjNiMicsXG5cbiAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuXG4gIH1cblxuXG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIC8vdGV4dCA6ICdIZWxsbyBcXG4gV29ybGQgJyxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vL2RpYWxvZyBib3hlc1xuY29uc3QgZGlhbG9nID0gKHNwYWNlSWQsIHRvaywgdXNlcklkLCBkaWFsb2dJZCwgY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzXCIpXG5cbiAgdmFyIHEgPSBgbXV0YXRpb24ge1xuICAgIGNyZWF0ZVRhcmdldGVkTWVzc2FnZShpbnB1dDoge1xuICAgICAgY29udmVyc2F0aW9uSWQ6ICR7c3BhY2VJZH1cbiAgICAgIHRhcmdldFVzZXJJZDogJHt1c2VySWR9XG4gICAgICB0YXJnZXREaWFsb2dJZDogJHtkaWFsb2dJZH1cbiAgICAgIGFubm90YXRpb25zOiBbXG4gICAgICB7XG4gICAgICAgIGdlbmVyaWNBbm5vdGF0aW9uOiB7XG4gICAgICAgICAgdGl0bGU6IFwiU2FtcGxlIFRpdGxlXCIsXG4gICAgICAgICAgdGV4dDogXCJTYW1wbGUgQm9keVwiXG4gICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwb3N0YmFja0J1dHRvbjoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNhbXBsZSBCdXR0b25cIixcbiAgICAgICAgICAgICAgICBpZDogXCJTYW1wbGVfQnV0dG9uXCIsXG4gICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXVxuICAgICAgfSkge1xuICAgICAgc3VjY2Vzc2Z1bFxuICAgIH1cbiAgfWBcbiAgY29uc3QgcmVxID0gYWdlbnQucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnKVxuICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3Rva31gKVxuICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vZ3JhcGhxbCcpXG4gIC5zZXQoJ0FjY2VwdC1FbmNvZGluZycsICcnKVxuICAuc2VuZChxLnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG5cbnJldHVybiBwcm9taXNpZnkocmVxKS50aGVuKHJlcyA9PiB7XG4gIGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5lcnJvcnMpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignRXJyb3IgZXhlY3V0aW5nIEdyYXBoUUwgcmVxdWVzdCcpO1xuICAgICAgZXJyLnJlcyA9IHJlcztcbiAgICAgIHRocm93IGVycjtcbiAgfVxuXG4gIHJldHVybiByZXM7XG59KTtcbiAgLypyZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJywge1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOiB0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHFcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJyArIGVycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApOyovXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKT0+IHtcbiAgdmFyIGRlZmVycmVkID0gcS5kZWZlcigpO1xuXG4gIHJlcS5lbmQoKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKTtcbiAgICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnV1cnXG4gICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgIHJldHVybjtcblxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gICAgXCJzaGExPVwiICsgY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfSBlbHNlIHtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEsIHsgZGVwdGg6IG51bGwgfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwidG9rIDogXCIgKyB0b2tlbilcbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIC8vc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuXG4gICAgICAvL2hhbmRsZSBzbGFzaCBjb21tYW5kc1xuICAgICAgcHJvY2Vzc19yZXF1ZXN0cyhhcHBJZCwgdG9rZW4pXG5cbiAgICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICByZXNwb25zZS5yZWRpcmVjdCgnaHR0cDovL3dvcmtzcGFjZS5pYm0uY29tJyk7XG5cbiAgICAgICAgfSk7XG5cblxuXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=