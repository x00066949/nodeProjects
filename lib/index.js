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

          var PipeRegex = new RegExp(/^\/issue*\spipeline*\s[0-9]*\s[0-9]/);

          if (PipeRegex.test(command)) {
            var CommandArr = command.split(' ');

            log("using dialog : " + JSON.parse(req.body.annotationPayload).targetDialogId);

            var pipePromise = getPipeId(CommandArr[2]);

            pipePromise.then(function (nameArr) {
              dialog(req.body.spaceId, token(), req.body.userId, JSON.parse(req.body.annotationPayload).targetDialogId, nameArr, CommandArr[2], function (err, res) {
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
//
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
      //if (data['pipelines'][i].name === PipelineName) {
      log("found pipeline id : " + data['pipelines'][i].id);
      nameArr[nameIndx] = data['pipelines'][i].name;
      nameArr[nameIndx + 1] = data['pipelines'][i].id;

      log(nameArr[nameIndx] + " , " + nameArr[nameIndx + 1]);
      nameIndx = nameIndx + 2;

      //}
    }
    return nameArr;

    //log("did not find id corresponding to pipe name");
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
    attachments[index] = /*istanbul ignore next*/'\n     {\n        type: CARD,\n        cardInput: {\n            type: INFORMATION,\n            informationCardInput: {\n                title: "' + nameArr[i] + '",\n                text: "Click button below to place Issue in this Pipeline",\n                buttons: [\n                    {\n                        text: "Place Issue Here",\n                        payload: "/issue ' + repo_id + ' ' + issue_id + ' -p ' + nameArr[i + 1] + '",\n                        style: PRIMARY\n                    }\n                ]\n            }\n        }\n    }';
    index++;
  }

  log(attachments[0] + attachments[1]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwibmFtZUluZHgiLCJpIiwibGVuZ3RoIiwiaWQiLCJpc3N1ZV9pZCIsImF0dGFjaG1lbnRzIiwiaW5kZXgiLCJxIiwic2V0IiwicmVwbGFjZSIsInByb21pc2lmeSIsImRpciIsImRlcHRoIiwiZXJyb3JzIiwiZGVmZXJyZWQiLCJkZWZlciIsInJlamVjdCIsInJlc29sdmUiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBYkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQWFBLElBQUlHLFFBQVFGLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUcsYUFBYUgsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUksT0FBT0osUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSyxLQUFLTCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJTSxhQUFhTixRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU8sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBZUMsRUFBZjtBQUFBLFNBQXNCLFVBQUNDLEdBQUQs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SixFQUFTO0FBQ1A1QixhQUFHNEIsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNMEUsT0FBTzdDLElBQUk4QyxPQUFKLElBQWUsR0FBNUI7QUFDQTVHLFlBQUksbUNBQUosRUFBeUMyRyxJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJbEgsUUFBUXVHLElBQVIsS0FBaUJhLE1BQXJCLEVBQTZCO0FBQzNCYixPQUFLbkMsUUFBUW9DLElBQWIsRUFBbUJwQyxRQUFRQyxHQUEzQixFQUFnQyxVQUFDN0IsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUHJCLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ2lDLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRGpDLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5pbXBvcnQgcSBmcm9tICdxJztcbmltcG9ydCBhZ2VudCBmcm9tICdzdXBlcmFnZW50JztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgICB2YXIgUGlwZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc3BpcGVsaW5lKlxcc1swLTldKlxcc1swLTldLyk7XG4gICAgICAgIFxuICAgICAgaWYgKFBpcGVSZWdleC50ZXN0KGNvbW1hbmQpKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gY29tbWFuZC5zcGxpdCgnICcpO1xuXG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG5cbiAgICAgICAgdmFyIHBpcGVQcm9taXNlID0gZ2V0UGlwZUlkKENvbW1hbmRBcnJbMl0pO1xuXG4gICAgICAgIHBpcGVQcm9taXNlLnRoZW4oKG5hbWVBcnIpID0+e1xuICAgICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICAgICAgbmFtZUFycixcbiAgICAgICAgICAgIENvbW1hbmRBcnJbMl0sXG4gIFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnc2VudCBkaWFsb2cgdG8gJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH1cbiAgXG4gICAgICAgICAgKVxuICAgICAgICB9KVxuICAgICAgXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG5cblxuICAgICAgICBib2FyZC5nZXRTY3J1bURhdGEoeyByZXF1ZXN0OiByZXEsIHJlc3BvbnNlOiByZXMsIFVzZXJJbnB1dDogbWVzc2FnZSB9KS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgICAgICBsb2coXCJzcGFjZSBpZCBcIiArIHJlcS5ib2R5LnNwYWNlSWQpXG4gICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgJ1VuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmQnKSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgbG9nKFwidW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZFwiICsgZXJyKTtcbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfTtcblxuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ0VMJykge1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIGxvZyhcIkVMIHRva2VuIDogXCIgKyBvYXV0aC5vVG9rZW4oKSlcblxuICAgIC8vdmFyIHRva3MgPSBvYXV0aC5vVG9rZW47XG4gICAgbG9nKFwiIDAwMiA6IFwiICsgZXZlbnRUeXBlKVxuXG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3NpbmcgZ2l0aHViIGV2ZW50XCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IGV2ZW50cy5wYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgIHByb21pc2UudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQoJzVhMDliMjM0ZTRiMDkwYmNkN2ZjZjNiMicsXG5cbiAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuXG4gIH1cblxuXG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIC8vdGV4dCA6ICdIZWxsbyBcXG4gV29ybGQgJyxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuLy9cbmNvbnN0IGdldFBpcGVJZCA9IChyZXBvX2lkKT0+e1xuICBcbiAgLy9nZXQgbGFuZXNcbiAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgfSxcblxuICAgIGpzb246IHRydWVcbiAgfTtcbiAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG52YXIgbmFtZUFyciA9IFtdO1xudmFyIG5hbWVJbmR4PTA7XG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgLy9pZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKSB7XG4gICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIiArIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICBuYW1lQXJyW25hbWVJbmR4XSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWU7XG4gICAgICAgICAgbmFtZUFycltuYW1lSW5keCsxXSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuXG4gICAgICAgICAgbG9nKG5hbWVBcnJbbmFtZUluZHhdICtcIiAsIFwiK25hbWVBcnJbbmFtZUluZHgrMV0pXG4gICAgICAgICAgbmFtZUluZHggPSBuYW1lSW5keCsyO1xuXG4gICAgICAgIC8vfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5hbWVBcnI7XG5cbiAgICAgIC8vbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIiArIGVycilcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfSlcbn1cblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgdGFyZ2V0RGlhbG9nSWQsbmFtZUFycixyZXBvX2lkLGlzc3VlX2lkLCBjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXMgOiBcIiArIHRhcmdldERpYWxvZ0lkKVxuXG5cblxuICAgIGxvZyhuYW1lQXJyKVxuXG5cbiAgICB2YXIgYXR0YWNobWVudHMgPSBbXTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGZvcih2YXIgaT0wOyBpPG5hbWVBcnIubGVuZ3RoOyBpPWkrMil7XG4gICAgIGF0dGFjaG1lbnRzW2luZGV4XSA9IGBcbiAgICAge1xuICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCIke25hbWVBcnJbaV19XCIsXG4gICAgICAgICAgICAgICAgdGV4dDogXCJDbGljayBidXR0b24gYmVsb3cgdG8gcGxhY2UgSXNzdWUgaW4gdGhpcyBQaXBlbGluZVwiLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJQbGFjZSBJc3N1ZSBIZXJlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiBcIi9pc3N1ZSAke3JlcG9faWR9ICR7aXNzdWVfaWR9IC1wICR7bmFtZUFycltpKzFdfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1gXG4gICAgaW5kZXgrKztcbiAgICB9XG5cbiAgICBsb2coYXR0YWNobWVudHNbMF0rYXR0YWNobWVudHNbMV0pXG4gIHZhciBxID0gYFxuICBtdXRhdGlvbiB7XG4gICAgY3JlYXRlVGFyZ2V0ZWRNZXNzYWdlKGlucHV0OiB7XG4gICAgICBjb252ZXJzYXRpb25JZDogXCIke3NwYWNlSWR9XCJcbiAgICAgIHRhcmdldFVzZXJJZDogXCIke3VzZXJJZH1cIlxuICAgICAgdGFyZ2V0RGlhbG9nSWQ6IFwiJHt0YXJnZXREaWFsb2dJZH1cIlxuICAgICAgYXR0YWNobWVudHM6IFske2F0dGFjaG1lbnRzfV1cbiAgICAgICAgICAgICBcbiAgICAgIH0pIHtcbiAgICAgIHN1Y2Nlc3NmdWxcbiAgICB9XG4gIH1cbiAgYFxuXG4gIGNvbnN0IHJlcSA9IGFnZW50LnBvc3QoJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJylcbiAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3Rva31gKVxuICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9ncmFwaHFsJylcbiAgICAuc2V0KCdBY2NlcHQtRW5jb2RpbmcnLCAnJylcbiAgICAuc2V0KCd4LWdyYXBocWwtdmlldycsJyBQVUJMSUMsIEJFVEEnKVxuICAgIC5zZW5kKHEucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcblxuICByZXR1cm4gcHJvbWlzaWZ5KHJlcSkudGhlbihyZXMgPT4ge1xuICAgIGxvZyhyZXMuYm9keSlcbiAgICBjb25zb2xlLmRpcihyZXEsIHsgZGVwdGg6IG51bGwgfSlcbiAgICBpZiAocmVzLmJvZHkgJiYgcmVzLmJvZHkuZXJyb3JzKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0Vycm9yIGV4ZWN1dGluZyBHcmFwaFFMIHJlcXVlc3QnKTtcbiAgICAgIGVyci5yZXMgPSByZXM7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfSk7XG5cbn07XG5cblxuZXhwb3J0IGNvbnN0IHByb21pc2lmeSA9IChyZXEpID0+IHtcbiAgdmFyIGRlZmVycmVkID0gcS5kZWZlcigpO1xuXG4gIHJlcS5lbmQoKGVyciwgcmVzKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgPT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ1dXJ1xuICAgIGxvZyhcImZyb20gV1dcIilcbiAgICByZXR1cm47XG5cbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICAgIFwic2hhMT1cIiArIGNyZWF0ZUhtYWMoJ3NoYTEnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnRUwnXG4gICAgbG9nKFwiZ2l0aHViIGV2ZW50XCIpXG4gICAgcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG5cblxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcInRvayA6IFwiICsgdG9rZW4pXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuXG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19