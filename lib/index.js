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
            log("using dialog : " + JSON.parse(req.body.annotationPayload).targetDialogId);
            dialog(req.body.spaceId, token(), req.body.userId, JSON.parse(req.body.annotationPayload).targetDialogId, function (err, res) {
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
var dialog = function dialog(spaceId, tok, userId, targetDialogId, cb) {

  log("trying to build dialog boxes : " + targetDialogId);

  var q = /*istanbul ignore next*/'\n  mutation {\n    createTargetedMessage(input: {\n      conversationId: "58934f00e4b0f86a34bbd085"\n      targetUserId: "83152e37-0d9f-4bbb-9d5f-024e75a97600"\n      targetDialogId: "SAMPLE_ACTION_1234"\n      attachments: [\n      {\n          type: CARD,\n          cardInput: {\n              type: INFORMATION,\n              informationCardInput: {\n                  title: "Sample Title",\n                  subtitle: "Sample Subtitle",\n                  text: "Sample Text",\n                  date: "1500573338000",\n                  buttons: [\n                      {\n                          text: "Sample Button Text",\n                          payload: "Sample Button Payload",\n                          style: PRIMARY\n                      }\n                  ]\n              }\n          }\n      }\n      ]\n      }) {\n      successful\n    }\n  }\n  ';
  var req = /*istanbul ignore next*/_superagent2.default.post('https://api.watsonwork.ibm.com/graphql').set('Authorization', /*istanbul ignore next*/'Bearer ' + tok).set('Content-Type', 'application/graphql').set('Accept-Encoding', '').set('x-graphql-view', ' PUBLIC, BETA').send(q.replace(/\s+/g, ' '));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsInRhcmdldERpYWxvZ0lkIiwiZGlhbG9nIiwic3BhY2VJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInEiLCJzZXQiLCJyZXBsYWNlIiwicHJvbWlzaWZ5IiwiZGlyIiwiZGVwdGgiLCJlcnJvcnMiLCJkZWZlcnJlZCIsImRlZmVyIiwicmVqZWN0IiwicmVzb2x2ZSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUNBOzs7O0FBRUE7Ozs7Ozs7O0FBZEEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQWNBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1NLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjtBQUNBLElBQUlDLFNBQUo7O0FBRU8sSUFBTUMsc0VBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSLEVBQWVDLEVBQWY7QUFBQSxTQUFzQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYztBQUNsRVAsUUFBSSxZQUFZQyxTQUFoQjtBQUNBO0FBQ0FELFFBQUksWUFBWUcsS0FBaEI7O0FBR0EsUUFBSUYsY0FBYyxJQUFsQixFQUF3QjtBQUN0QjtBQUNBO0FBQ0FNLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjs7QUFFQTtBQUNBO0FBQ0EsVUFBSUgsSUFBSUksSUFBSixDQUFTQyxNQUFULEtBQW9CUixLQUF4QixFQUErQjtBQUM3QlMsZ0JBQVFaLEdBQVIsQ0FBWSxVQUFaLEVBQXdC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YyxVQUFDcEQsR0FBRCxFQUFNNkQsSUFBTixFQUFlO0FBQzNCLFlBQUk3RCxHQUFKLEVBQVM7QUFDUG5CLGFBQUdtQixHQUFIO0FBQ0E7QUFDRDtBQUNELFlBQU04RCxPQUFPVixJQUFJVyxPQUFKLElBQWUsR0FBNUI7QUFDQXZGLFlBQUksbUNBQUosRUFBeUNzRixJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJNUYsUUFBUWdGLElBQVIsS0FBaUJjLE1BQXJCLEVBQTZCO0FBQzNCZCxPQUFLZSxRQUFRZCxJQUFiLEVBQW1CYyxRQUFRYixHQUEzQixFQUFnQyxVQUFDcEQsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUFosY0FBUVosR0FBUixDQUFZLHFCQUFaLEVBQW1Dd0IsR0FBbkM7QUFDQTtBQUNEOztBQUVEeEIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcbmltcG9ydCBxIGZyb20gJ3EnO1xuaW1wb3J0IGFnZW50IGZyb20gJ3N1cGVyYWdlbnQnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgaWYgKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKSB7XG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG4gICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuXG5cbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnICsgY29tbWFuZDtcblxuXG4gICAgICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7IHJlcXVlc3Q6IHJlcSwgcmVzcG9uc2U6IHJlcywgVXNlcklucHV0OiBtZXNzYWdlIH0pLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCAnVW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZCcpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gcHJvY2VzcyBjb21tYW5kXCIgKyBlcnIpO1xuICAgICAgICB9KVxuXG4gICAgICB9XG5cbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy9yZXR1cm47XG5cbiAgfSBlbHNlIHtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG5cbiAgfVxuXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIHRhcmdldERpYWxvZ0lkLCBjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXMgOiBcIiArIHRhcmdldERpYWxvZ0lkKVxuXG5cbiAgdmFyIHEgPSBgXG4gIG11dGF0aW9uIHtcbiAgICBjcmVhdGVUYXJnZXRlZE1lc3NhZ2UoaW5wdXQ6IHtcbiAgICAgIGNvbnZlcnNhdGlvbklkOiBcIjU4OTM0ZjAwZTRiMGY4NmEzNGJiZDA4NVwiXG4gICAgICB0YXJnZXRVc2VySWQ6IFwiODMxNTJlMzctMGQ5Zi00YmJiLTlkNWYtMDI0ZTc1YTk3NjAwXCJcbiAgICAgIHRhcmdldERpYWxvZ0lkOiBcIlNBTVBMRV9BQ1RJT05fMTIzNFwiXG4gICAgICBhdHRhY2htZW50czogW1xuICAgICAge1xuICAgICAgICAgIHR5cGU6IENBUkQsXG4gICAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgICBpbmZvcm1hdGlvbkNhcmRJbnB1dDoge1xuICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiU2FtcGxlIFRpdGxlXCIsXG4gICAgICAgICAgICAgICAgICBzdWJ0aXRsZTogXCJTYW1wbGUgU3VidGl0bGVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIFRleHRcIixcbiAgICAgICAgICAgICAgICAgIGRhdGU6IFwiMTUwMDU3MzMzODAwMFwiLFxuICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgQnV0dG9uIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCJTYW1wbGUgQnV0dG9uIFBheWxvYWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICBdXG4gICAgICB9KSB7XG4gICAgICBzdWNjZXNzZnVsXG4gICAgfVxuICB9XG4gIGBcbiAgY29uc3QgcmVxID0gYWdlbnQucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnKVxuICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rfWApXG4gICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2dyYXBocWwnKVxuICAgIC5zZXQoJ0FjY2VwdC1FbmNvZGluZycsICcnKVxuICAgIC5zZXQoJ3gtZ3JhcGhxbC12aWV3JywnIFBVQkxJQywgQkVUQScpXG4gICAgLnNlbmQocS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuXG4gIHJldHVybiBwcm9taXNpZnkocmVxKS50aGVuKHJlcyA9PiB7XG4gICAgbG9nKHJlcy5ib2R5KVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5lcnJvcnMpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignRXJyb3IgZXhlY3V0aW5nIEdyYXBoUUwgcmVxdWVzdCcpO1xuICAgICAgZXJyLnJlcyA9IHJlcztcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbiAgLypyZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJywge1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOiB0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHFcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJyArIGVycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApOyovXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKSA9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==