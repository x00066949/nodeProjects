/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.event_listener = exports.slash_commands = undefined;

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

var slash_commands = /*istanbul ignore next*/exports.slash_commands = function slash_commands(appId, token, eventType) /*istanbul ignore next*/{
  return function (req, res) {
    log(" 001 : " + eventType);

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

    //let payLoad = req.body.annotationPayload;
    //log("payload"+payLoad);

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

          log("data got = " + to_post);

          send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
            if (!err) log('Sent message to space %s', req.body.spaceId);
          });
        }).catch(function (err) {
          log("unable to send message to space" + err);
        });
      };
  };
};

//function for processing issue events
var event_listener = /*istanbul ignore next*/exports.event_listener = function event_listener(eventType) /*istanbul ignore next*/{
  return function (req, res) {
    log(" 002 : " + eventType);
    console.dir(req.body, { depth: null });

    if (eventType == 'EL') {
      res.status(201).end();

      var command = JSON.parse(req.body.annotationPayload).actionId;
    };
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
var verify = /*istanbul ignore next*/exports.verify = function verify(wsecret, eventType) /*istanbul ignore next*/{
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

    // Return the Express Web app
    cb(null, express()

    // Configure Express route for the app Webhook
    .post('/scrumbot',

    // Verify Watson Work request signature and parse request body
    bparser.json({
      type: '*/*',
      verify: verify(wsecret, eventType)
    }),

    // Handle Watson Work Webhook challenge requests
    challenge(wsecret),

    // Handle Watson Work messages
    //scrumbot(appId, token)));

    //handle slash commands
    slash_commands(appId, token, eventType),

    //github issue events go here
    event_listener(eventType)));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsImV2ZW50VHlwZSIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiZGlhbG9nIiwic3BhY2VJZCIsInRhcmdldERpYWxvZ0lkIiwiZXJyIiwibWVzc2FnZSIsImdldFNjcnVtRGF0YSIsInJlc3BvbnNlIiwiVXNlcklucHV0IiwidGhlbiIsInRvX3Bvc3QiLCJzZW5kIiwiZm9ybWF0IiwidXNlck5hbWUiLCJjYXRjaCIsImV2ZW50X2xpc3RlbmVyIiwiZGlyIiwiZGVwdGgiLCJ0ZXh0IiwidG9rIiwiY2IiLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsImRpYWxvZ0lkIiwicSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlz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LElBQWIsRUFBbUJjLFFBQVFiLEdBQTNCLEVBQWdDLFVBQUM3QyxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQWixjQUFRWCxHQUFSLENBQVkscUJBQVosRUFBbUN1QixHQUFuQztBQUNBO0FBQ0Q7O0FBRUR2QixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuaW1wb3J0ICogYXMgYm9hcmQgZnJvbSAnLi9zY3J1bV9ib2FyZCc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnLi9pc3N1ZV9ldmVudHMnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbmV4cG9ydCBjb25zdCBzbGFzaF9jb21tYW5kcyA9IChhcHBJZCwgdG9rZW4sIGV2ZW50VHlwZSkgPT4gKHJlcSwgcmVzKSA9PntcbiAgbG9nKFwiIDAwMSA6IFwiK2V2ZW50VHlwZSlcbiAgXG5cbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcblxuICBpZighcmVxKVxuICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gIGxvZyhyZXEuYm9keSk7XG5cbiAgLy9sZXQgcGF5TG9hZCA9IHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkO1xuICAvL2xvZyhcInBheWxvYWRcIitwYXlMb2FkKTtcblxuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgIGxvZyhcImNvbW1hbmQgXCIrY29tbWFuZCk7XG5cbiAgICBpZiAoIWNvbW1hbmQpXG4gICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG4gICAgXG5cbiAgICBpZihjb21tYW5kID09PSAnL2lzc3VlIHBpcGVsaW5lJyl7XG4gICAgICBsb2coXCJ1c2luZyBkaWFsb2dcIilcbiAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICB9XG5cbiAgICAgIClcbiAgICB9XG4gICAgICBcbiAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJytjb21tYW5kO1xuXG5cbiAgICBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDptZXNzYWdlfSkudGhlbigodG9fcG9zdCk9PntcbiAgICAgIFxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcblxuICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgIHRva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgIH0pXG4gICAgfSkuY2F0Y2goKGVycik9PntcbiAgICAgIGxvZyhcInVuYWJsZSB0byBzZW5kIG1lc3NhZ2UgdG8gc3BhY2VcIiArIGVycik7XG4gICAgfSlcbiAgfTtcblxufVxuXG4vL2Z1bmN0aW9uIGZvciBwcm9jZXNzaW5nIGlzc3VlIGV2ZW50c1xuZXhwb3J0IGNvbnN0IGV2ZW50X2xpc3RlbmVyID0gKGV2ZW50VHlwZSkgPT4gKHJlcSwgcmVzKSA9PntcbiAgbG9nKFwiIDAwMiA6IFwiK2V2ZW50VHlwZSlcbiAgY29uc29sZS5kaXIocmVxLmJvZHkse2RlcHRoOm51bGx9KVxuICBcbiAgaWYoZXZlbnRUeXBlID09J0VMJyl7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICAgIFxuICAgIFxuICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gIH07XG4gIFxuXG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIC8vdGV4dCA6ICdIZWxsbyBcXG4gV29ybGQgJyxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIGRpYWxvZ0lkLGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlc1wiKVxuXG4gIHZhciBxID0gYGBcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJyx7XG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ2p3dCc6dG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnICxcbiAgICAgICAgJ3gtZ3JhcGhxbC12aWV3JzogJ1BVQkxJQywgQkVUQSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keTogYG11dGF0aW9uIGNyZWF0ZVNwYWNlIHsgY3JlYXRlU3BhY2UoaW5wdXQ6IHsgdGl0bGU6IFxcXCJTcGFjZSB0aXRsZVxcXCIsICBtZW1iZXJzOiBbJHt1c2VySWR9XX0peyBzcGFjZSB7ICR7c3BhY2VJZH19YFxuXG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdmYWlsZWQgZXJyOiAnK2VycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLHtkZXB0aDpudWxsfSlcbiAgICAgICAgbG9nKCdFcnJvciBjcmVhdGluZyBkaWFsb2cgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9XG4gICk7XG59O1xuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCwgZXZlbnRUeXBlKSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpICkge1xuICAgICAgXG4gICAgICBldmVudFR5cGU9J1dXJ1xuICAgICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgICAgcmV0dXJuO1xuICAgICBcbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICBcInNoYTE9XCIrY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4Jykpe1xuXG4gICAgZXZlbnRUeXBlPSdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfWVsc2V7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLHtkZXB0aDpudWxsfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuICAgIFxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQsZXZlbnRUeXBlKVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIC8vc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuICAgIFxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHNsYXNoX2NvbW1hbmRzKGFwcElkLCB0b2tlbixldmVudFR5cGUpLFxuXG4gICAgICAvL2dpdGh1YiBpc3N1ZSBldmVudHMgZ28gaGVyZVxuICAgICAgZXZlbnRfbGlzdGVuZXIoZXZlbnRUeXBlKVxuICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcbiAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19