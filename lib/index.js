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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsInNldCIsInJlcGxhY2UiLCJwcm9taXNpZnkiLCJlcnJvcnMiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJkaXIiLCJkZXB0aCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUVBOzs7Ozs7OztBQWJBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFhQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7QUFDQSxJQUFJQyxTQUFKOztBQUVPLElBQU1DLHNFQUFtQixTQUFuQkEsZ0JBQW1CLENBQUNDLEtBQUQsRUFBUUMsS0FBUixFQUFlQyxFQUFmO0FBQUEsU0FBc0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDbEVQLFFBQUksWUFBWUMsU0FBaEI7QUFDQTtBQUNBRCxRQUFJLFlBQVlHLEtBQWhCOztBQUdBLFFBQUlGLGNBQWMsSUFBbEIsRUFBd0I7QUFDdEI7QUFDQTtBQUNBTSxVQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUE7QUFDQTtBQUNBLFVBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlIsS0FBeEIsRUFBK0I7QUFDN0JTLGdCQUFRWixHQUFSLENBQVksVUFBWixFQUF3Qk0sSUFBSUksSUFBNUI7QUFDQTtBQUVEO0FBQ0QsVUFBSUgs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ZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcbmltcG9ydCBhZ2VudCBmcm9tICdzdXBlcmFnZW50JztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xudmFyIGV2ZW50VHlwZTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NfcmVxdWVzdHMgPSAoYXBwSWQsIHRva2VuLCBjYikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIGxvZyhcIiAwMDEgOiBcIiArIGV2ZW50VHlwZSlcbiAgLy9sb2coXCJ0b2tlbiA6IFwiK3Rva2VuKVxuICBsb2coXCJhcHAgaWQgXCIgKyBhcHBJZClcblxuXG4gIGlmIChldmVudFR5cGUgPT09ICdXVycpIHtcbiAgICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAgIC8vIG93biBtZXNzYWdlc1xuICAgIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgICByZXR1cm47XG5cbiAgICB9XG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcblxuICAgIGlmICghcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgICBsb2cocmVxLmJvZHkpO1xuXG4gICAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnIC8qJiYgcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQudGFyZ2V0QXBwSWQgPT09IGFwcElkKi8pIHtcbiAgICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gICAgICAvL2xvZyhcImFjdGlvbiBpZCBcIityZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCk7XG4gICAgICBsb2coXCJjb21tYW5kIFwiICsgY29tbWFuZCk7XG5cbiAgICAgIGlmICghY29tbWFuZClcbiAgICAgICAgbG9nKFwibm8gY29tbWFuZCB0byBwcm9jZXNzXCIpO1xuXG5cbiAgICAgIGlmIChjb21tYW5kID09PSAnL2lzc3VlIHBpcGVsaW5lJykge1xuICAgICAgICBsb2coXCJ1c2luZyBkaWFsb2dcIilcbiAgICAgICAgZGlhbG9nKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgICAgcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQudGFyZ2V0RGlhbG9nSWQsXG5cblxuICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgIGxvZygnc2VudCBkaWFsb2cgdG8gJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgKVxuICAgICAgfWVsc2V7XG5cbiAgICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcgKyBjb21tYW5kO1xuICAgICAgXG4gICAgICBcbiAgICAgICAgICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7IHJlcXVlc3Q6IHJlcSwgcmVzcG9uc2U6IHJlcywgVXNlcklucHV0OiBtZXNzYWdlIH0pLnRoZW4oKHRvX3Bvc3QpID0+IHtcbiAgICAgIFxuICAgICAgICAgICAgICBsb2coXCJzcGFjZSBpZCBcIiArIHJlcS5ib2R5LnNwYWNlSWQpXG4gICAgICAgICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcbiAgICAgIFxuICAgICAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgJ1VuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmQnKSxcbiAgICAgICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgbG9nKFwidW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZFwiICsgZXJyKTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgIH1cblxuICAgIH07XG5cbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09ICdFTCcpIHtcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICBsb2coXCJFTCB0b2tlbiA6IFwiICsgb2F1dGgub1Rva2VuKCkpXG5cbiAgICAvL3ZhciB0b2tzID0gb2F1dGgub1Rva2VuO1xuICAgIGxvZyhcIiAwMDIgOiBcIiArIGV2ZW50VHlwZSlcblxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIGdpdGh1YiBldmVudFwiKTtcblxuICAgIGlmICghcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgICBsb2cocmVxLmJvZHkpO1xuXG4gICAgdmFyIHByb21pc2UgPSBldmVudHMucGFyc2VSZXNwb25zZShyZXEsIHJlcylcbiAgICBwcm9taXNlLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICBzZW5kKCc1YTA5YjIzNGU0YjA5MGJjZDdmY2YzYjInLFxuXG4gICAgICAgIHRvX3Bvc3QsXG4gICAgICAgIG9hdXRoLm9Ub2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICcpO1xuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICAvL3JldHVybjtcblxuICB9IGVsc2Uge1xuXG4gICAgcmVzLnN0YXR1cyg0MDEpLmVuZCgpO1xuICAgIHJldHVybjtcblxuICB9XG5cblxuXG59XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgZGlhbG9nSWQsIGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlc1wiKVxuXG4gIHZhciBxID0gYG11dGF0aW9uIHtcbiAgICBjcmVhdGVUYXJnZXRlZE1lc3NhZ2UoaW5wdXQ6IHtcbiAgICAgIGNvbnZlcnNhdGlvbklkOiAke3NwYWNlSWR9XG4gICAgICB0YXJnZXRVc2VySWQ6ICR7dXNlcklkfVxuICAgICAgdGFyZ2V0RGlhbG9nSWQ6ICR7ZGlhbG9nSWR9XG4gICAgICBhbm5vdGF0aW9uczogW1xuICAgICAge1xuICAgICAgICBnZW5lcmljQW5ub3RhdGlvbjoge1xuICAgICAgICAgIHRpdGxlOiBcIlNhbXBsZSBUaXRsZVwiLFxuICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIEJvZHlcIlxuICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcG9zdGJhY2tCdXR0b246IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTYW1wbGUgQnV0dG9uXCIsXG4gICAgICAgICAgICAgICAgaWQ6IFwiU2FtcGxlX0J1dHRvblwiLFxuICAgICAgICAgICAgICAgIHN0eWxlOiBQUklNQVJZXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF1cbiAgICAgIH0pIHtcbiAgICAgIHN1Y2Nlc3NmdWxcbiAgICB9XG4gIH1gXG4gIGNvbnN0IHJlcSA9IGFnZW50LnBvc3QoJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJylcbiAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2t9YClcbiAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2dyYXBocWwnKVxuICAuc2V0KCdBY2NlcHQtRW5jb2RpbmcnLCAnJylcbiAgLnNlbmQocS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuXG5yZXR1cm4gcHJvbWlzaWZ5KHJlcSkudGhlbihyZXMgPT4ge1xuICBpZiAocmVzLmJvZHkgJiYgcmVzLmJvZHkuZXJyb3JzKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0Vycm9yIGV4ZWN1dGluZyBHcmFwaFFMIHJlcXVlc3QnKTtcbiAgICAgIGVyci5yZXMgPSByZXM7XG4gICAgICB0aHJvdyBlcnI7XG4gIH1cblxuICByZXR1cm4gcmVzO1xufSk7XG4gIC8qcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcsIHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0JzogdG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBxXG5cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ2ZhaWxlZCBlcnI6ICcgKyBlcnIpXG4gICAgICAgIGNvbnNvbGUuZGlyKHJlcywgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgICBsb2coJ0Vycm9yIGNyZWF0aW5nIGRpYWxvZyAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH1cbiAgKTsqL1xufTtcblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==