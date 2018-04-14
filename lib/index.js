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

var Regex = require('regex');
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

      var command = JSON.parse(req.body.annotationPayload).actionId;

      if (!command) log("no command to process");

      if (req.body.type === 'message-annotation-added' && command) {

        log("command " + command);

        var PipeRegex = new RegExp(/^\/issue*\spipeline*\s[0-9]*\s[0-9]/);

        if (PipeRegex.test(command)) {
          var CommandArr = command.split(' ');

          log("using dialog : " + JSON.parse(req.body.annotationPayload).targetDialogId);

          var pipePromise = getPipeId(CommandArr[2]);

          pipePromise.then(function (nameArr) {
            dialog(req.body.spaceId, token(), req.body.userId, JSON.parse(req.body.annotationPayload).targetDialogId, nameArr, CommandArr[2], CommandArr[3], function (err, res) {
              if (!err) log('sent dialog to %s', req.body.spaceId);
            });
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

//get pipeline id for dialog boxes
var getPipeId = function getPipeId(repo_id) {

  //get lanes
  var pipelineIdRequest = {
    uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

    headers: {
      'X-Authentication-Token': process.env.ZENHUB_TOKEN
    },

    json: true
  };
  return rp(pipelineIdRequest).then(function (data) {
    var nameArr = [];
    var nameIndx = 0;
    log(data);
    for (var i = 0; i < data['pipelines'].length; i++) {
      log("checking");
      log("found pipeline id : " + data['pipelines'][i].id);
      nameArr[nameIndx] = data['pipelines'][i].name;
      nameArr[nameIndx + 1] = data['pipelines'][i].id;

      log(nameArr[nameIndx] + " , " + nameArr[nameIndx + 1]);
      nameIndx = nameIndx + 2;
    }
    return nameArr;
  }).catch(function (err) {
    console.log("error = " + err);
    return err;
  });
};

//dialog boxes
var dialog = function dialog(spaceId, tok, userId, targetDialogId, nameArr, repo_id, issue_id, cb) {

  log("trying to build dialog boxes : " + targetDialogId);
  log(nameArr);

  var attachments = [];
  var index = 0;
  for (var i = 0; i < nameArr.length; i = i + 2) {
    attachments[index] = /*istanbul ignore next*/'\n     {\n        type: CARD,\n        cardInput: {\n            type: INFORMATION,\n            informationCardInput: {\n                title: "' + nameArr[i] + '",\n                subtitle: "",\n                text: "Click button below to place Issue in this Pipeline",                \n                date: "0",\n                buttons: [\n                    {\n                        text: "Place Issue Here",\n                        payload: "/issue ' + repo_id + ' ' + issue_id + ' -p ' + nameArr[i + 1] + '",\n                        style: PRIMARY\n                    }\n                ]\n            }\n        }\n    }';
    index++;
  }

  var q = /*istanbul ignore next*/'\n  mutation {\n    createTargetedMessage(input: {\n      conversationId: "' + spaceId + '"\n      targetUserId: "' + userId + '"\n      targetDialogId: "' + targetDialogId + '"\n      attachments: [' + attachments + ']\n             \n      }) {\n      successful\n    }\n  }\n  ';

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
      console.dir(req, { depth: null });
      return;
    } else if (req.get('X-HUB-SIGNATURE') === "sha1=" + /*istanbul ignore next*/(0, _crypto.createHmac)('sha1', wsecret).update(buf).digest('hex') || req.get('X-Hub-Signature') === wsecret) {

      eventType = 'EL';
      log("github event");
      console.dir(req, { depth: null });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiY29tbWFuZCIsIkpTT04iLCJwYXJzZSIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJ0eXBlIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwibmFtZUluZHgiLCJpIiwibGVuZ3RoIiwiaWQiLCJpc3N1ZV9pZCIsImF0dGFjaG1lbnRzIiwiaW5kZXgiLCJxIiwic2V0IiwicmVwbGFjZSIsInByb21pc2lmeSIsImRpciIsImRlcHRoIiwiZXJyb3JzIiwiZGVmZXJyZWQiLCJkZWZlciIsInJlamVjdCIsInJlc29sdmUiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBYkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQWFBLElBQUlHLFFBQVFGLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUcsYUFBYUgsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUksT0FBT0osUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSyxLQUFLTCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJTSxhQUFhTixRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU8sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBZUMsRUFBZjtBQUFBLFNBQXNCLFVBQUNDLEdBQUQs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LFVBQUlDLElBQUosQ0FBUzVDLEdBQVQsRUFBYyxVQUFDN0IsR0FBRCxFQUFNeUUsSUFBTixFQUFlO0FBQzNCLFlBQUl6RSxHQUFKLEVBQVM7QUFDUDVCLGFBQUc0QixHQUFIO0FBQ0E7QUFDRDtBQUNELFlBQU0wRSxPQUFPN0MsSUFBSThDLE9BQUosSUFBZSxHQUE1QjtBQUNBNUcsWUFBSSxtQ0FBSixFQUF5QzJHLElBQXpDO0FBQ0QsT0FQRDtBQVFILEdBcENIO0FBcUNELENBeENEOztBQTBDQSxJQUFJbEgsUUFBUXVHLElBQVIsS0FBaUJhLE1BQXJCLEVBQTZCO0FBQzNCYixPQUFLbkMsUUFBUW9DLElBQWIsRUFBbUJwQyxRQUFRQyxHQUEzQixFQUFnQyxVQUFDN0IsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUHJCLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ2lDLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRGpDLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5pbXBvcnQgcSBmcm9tICdxJztcbmltcG9ydCBhZ2VudCBmcm9tICdzdXBlcmFnZW50JztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICBsb2coXCJhcHAgaWQgXCIgKyBhcHBJZClcblxuXG4gIGlmIChldmVudFR5cGUgPT09ICdXVycpIHtcbiAgICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAgIC8vIG93biBtZXNzYWdlc1xuICAgIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgICByZXR1cm47XG5cbiAgICB9XG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcblxuICAgIGlmICghcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgICBsb2cocmVxLmJvZHkpO1xuXG4gICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcblxuICAgIGlmICghY29tbWFuZClcbiAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcblxuICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAmJiBjb21tYW5kKSB7XG5cbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgdmFyIFBpcGVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNwaXBlbGluZSpcXHNbMC05XSpcXHNbMC05XS8pO1xuXG4gICAgICBpZiAoUGlwZVJlZ2V4LnRlc3QoY29tbWFuZCkpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBjb21tYW5kLnNwbGl0KCcgJyk7XG5cbiAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nIDogXCIgKyBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS50YXJnZXREaWFsb2dJZClcblxuICAgICAgICB2YXIgcGlwZVByb21pc2UgPSBnZXRQaXBlSWQoQ29tbWFuZEFyclsyXSk7XG5cbiAgICAgICAgcGlwZVByb21pc2UudGhlbigobmFtZUFycikgPT4ge1xuICAgICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICAgICAgbmFtZUFycixcbiAgICAgICAgICAgIENvbW1hbmRBcnJbMl0sXG4gICAgICAgICAgICBDb21tYW5kQXJyWzNdLFxuXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgKVxuICAgICAgICB9KVxuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG5cblxuICAgICAgICBib2FyZC5nZXRTY3J1bURhdGEoeyByZXF1ZXN0OiByZXEsIHJlc3BvbnNlOiByZXMsIFVzZXJJbnB1dDogbWVzc2FnZSB9KS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgICAgICBsb2coXCJzcGFjZSBpZCBcIiArIHJlcS5ib2R5LnNwYWNlSWQpXG4gICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgJ1VuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmQnKSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgbG9nKFwidW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZFwiICsgZXJyKTtcbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfTtcblxuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ0VMJykge1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIGxvZyhcIkVMIHRva2VuIDogXCIgKyBvYXV0aC5vVG9rZW4oKSlcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gIH0gZWxzZSB7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuXG4gIH1cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZ2V0IHBpcGVsaW5lIGlkIGZvciBkaWFsb2cgYm94ZXNcbmNvbnN0IGdldFBpcGVJZCA9IChyZXBvX2lkKSA9PiB7XG5cbiAgLy9nZXQgbGFuZXNcbiAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgfSxcblxuICAgIGpzb246IHRydWVcbiAgfTtcbiAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICB2YXIgbmFtZUFyciA9IFtdO1xuICAgICAgdmFyIG5hbWVJbmR4ID0gMDtcbiAgICAgIGxvZyhkYXRhKVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICBuYW1lQXJyW25hbWVJbmR4XSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWU7XG4gICAgICAgIG5hbWVBcnJbbmFtZUluZHggKyAxXSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuXG4gICAgICAgIGxvZyhuYW1lQXJyW25hbWVJbmR4XSArIFwiICwgXCIgKyBuYW1lQXJyW25hbWVJbmR4ICsgMV0pXG4gICAgICAgIG5hbWVJbmR4ID0gbmFtZUluZHggKyAyO1xuXG4gICAgICB9XG4gICAgICByZXR1cm4gbmFtZUFycjtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIgKyBlcnIpXG4gICAgICByZXR1cm4gZXJyO1xuICAgIH0pXG59XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIHRhcmdldERpYWxvZ0lkLCBuYW1lQXJyLCByZXBvX2lkLCBpc3N1ZV9pZCwgY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzIDogXCIgKyB0YXJnZXREaWFsb2dJZClcbiAgbG9nKG5hbWVBcnIpXG5cbiAgdmFyIGF0dGFjaG1lbnRzID0gW107XG4gIHZhciBpbmRleCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZUFyci5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgIGF0dGFjaG1lbnRzW2luZGV4XSA9IGBcbiAgICAge1xuICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCIke25hbWVBcnJbaV19XCIsXG4gICAgICAgICAgICAgICAgc3VidGl0bGU6IFwiXCIsXG4gICAgICAgICAgICAgICAgdGV4dDogXCJDbGljayBidXR0b24gYmVsb3cgdG8gcGxhY2UgSXNzdWUgaW4gdGhpcyBQaXBlbGluZVwiLCAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBkYXRlOiBcIjBcIixcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiUGxhY2UgSXNzdWUgSGVyZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCIvaXNzdWUgJHtyZXBvX2lkfSAke2lzc3VlX2lkfSAtcCAke25hbWVBcnJbaSArIDFdfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1gXG4gICAgaW5kZXgrKztcbiAgfVxuXG4gIHZhciBxID0gYFxuICBtdXRhdGlvbiB7XG4gICAgY3JlYXRlVGFyZ2V0ZWRNZXNzYWdlKGlucHV0OiB7XG4gICAgICBjb252ZXJzYXRpb25JZDogXCIke3NwYWNlSWR9XCJcbiAgICAgIHRhcmdldFVzZXJJZDogXCIke3VzZXJJZH1cIlxuICAgICAgdGFyZ2V0RGlhbG9nSWQ6IFwiJHt0YXJnZXREaWFsb2dJZH1cIlxuICAgICAgYXR0YWNobWVudHM6IFske2F0dGFjaG1lbnRzfV1cbiAgICAgICAgICAgICBcbiAgICAgIH0pIHtcbiAgICAgIHN1Y2Nlc3NmdWxcbiAgICB9XG4gIH1cbiAgYFxuXG4gIGNvbnN0IHJlcSA9IGFnZW50LnBvc3QoJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJylcbiAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3Rva31gKVxuICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9ncmFwaHFsJylcbiAgICAuc2V0KCdBY2NlcHQtRW5jb2RpbmcnLCAnJylcbiAgICAuc2V0KCd4LWdyYXBocWwtdmlldycsICcgUFVCTElDLCBCRVRBJylcbiAgICAuc2VuZChxLnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG5cbiAgcmV0dXJuIHByb21pc2lmeShyZXEpLnRoZW4ocmVzID0+IHtcbiAgICBsb2cocmVzLmJvZHkpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgaWYgKHJlcy5ib2R5ICYmIHJlcy5ib2R5LmVycm9ycykge1xuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdFcnJvciBleGVjdXRpbmcgR3JhcGhRTCByZXF1ZXN0Jyk7XG4gICAgICBlcnIucmVzID0gcmVzO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH0pO1xuXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKSA9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSB8fCByZXEuZ2V0KCdYLUh1Yi1TaWduYXR1cmUnKSA9PT1cbiAgICB3c2VjcmV0ICkge1xuICAgICAgXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=