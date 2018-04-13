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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwibmFtZUluZHgiLCJpIiwibGVuZ3RoIiwiaWQiLCJpc3N1ZV9pZCIsImF0dGFjaG1lbnRzIiwiaW5kZXgiLCJxIiwic2V0IiwicmVwbGFjZSIsInByb21pc2lmeSIsImRpciIsImRlcHRoIiwiZXJyb3JzIiwiZGVmZXJyZWQiLCJkZWZlciIsInJlamVjdCIsInJlc29sdmUiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBYkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQWFBLElBQUlHLFFBQVFGLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUcsYUFBYUgsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUksT0FBT0osUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSyxLQUFLTCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJTSxhQUFhTixRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU8sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBZUMsRUFBZjtBQUFBLFNBQXNCLFVBQUNDLEdBQUQs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RUFBZTtBQUMzQixZQUFJekUsR0FBSixFQUFTO0FBQ1A1QixhQUFHNEIsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNMEUsT0FBTzdDLElBQUk4QyxPQUFKLElBQWUsR0FBNUI7QUFDQTVHLFlBQUksbUNBQUosRUFBeUMyRyxJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJbEgsUUFBUXVHLElBQVIsS0FBaUJhLE1BQXJCLEVBQTZCO0FBQzNCYixPQUFLbkMsUUFBUW9DLElBQWIsRUFBbUJwQyxRQUFRQyxHQUEzQixFQUFnQyxVQUFDN0IsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUHJCLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ2lDLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRGpDLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5pbXBvcnQgcSBmcm9tICdxJztcbmltcG9ydCBhZ2VudCBmcm9tICdzdXBlcmFnZW50JztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgICB2YXIgUGlwZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc3BpcGVsaW5lKlxcc1swLTldKlxcc1swLTldLyk7XG4gICAgICAgIFxuICAgICAgaWYgKFBpcGVSZWdleC50ZXN0KGNvbW1hbmQpKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gY29tbWFuZC5zcGxpdCgnICcpO1xuXG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG5cbiAgICAgICAgdmFyIHBpcGVQcm9taXNlID0gZ2V0UGlwZUlkKENvbW1hbmRBcnJbMl0pO1xuXG4gICAgICAgIHBpcGVQcm9taXNlLnRoZW4oKG5hbWVBcnIpID0+e1xuICAgICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICAgICAgbmFtZUFycixcbiAgICAgICAgICAgIENvbW1hbmRBcnJbMl0sXG4gICAgICAgICAgICBDb21tYW5kQXJyWzNdLFxuICBcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9XG4gIFxuICAgICAgICAgIClcbiAgICAgICAgfSlcbiAgICAgIFxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcgKyBjb21tYW5kO1xuXG5cbiAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHsgcmVxdWVzdDogcmVxLCByZXNwb25zZTogcmVzLCBVc2VySW5wdXQ6IG1lc3NhZ2UgfSkudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICAgICAgbG9nKFwic3BhY2UgaWQgXCIgKyByZXEuYm9keS5zcGFjZUlkKVxuICAgICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsICdVbmFibGUgdG8gcHJvY2VzcyBjb21tYW5kJyksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIGxvZyhcInVuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmRcIiArIGVycik7XG4gICAgICAgIH0pXG5cbiAgICAgIH1cblxuICAgIH07XG5cbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09ICdFTCcpIHtcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICBsb2coXCJFTCB0b2tlbiA6IFwiICsgb2F1dGgub1Rva2VuKCkpXG5cbiAgICAvL3ZhciB0b2tzID0gb2F1dGgub1Rva2VuO1xuICAgIGxvZyhcIiAwMDIgOiBcIiArIGV2ZW50VHlwZSlcblxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIGdpdGh1YiBldmVudFwiKTtcblxuICAgIGlmICghcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgICBsb2cocmVxLmJvZHkpO1xuXG4gICAgdmFyIHByb21pc2UgPSBldmVudHMucGFyc2VSZXNwb25zZShyZXEsIHJlcylcbiAgICBwcm9taXNlLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICBzZW5kKCc1YTA5YjIzNGU0YjA5MGJjZDdmY2YzYjInLFxuXG4gICAgICAgIHRvX3Bvc3QsXG4gICAgICAgIG9hdXRoLm9Ub2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICcpO1xuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICAvL3JldHVybjtcblxuICB9IGVsc2Uge1xuXG4gICAgcmVzLnN0YXR1cyg0MDEpLmVuZCgpO1xuICAgIHJldHVybjtcblxuICB9XG5cblxuXG59XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcbi8vXG5jb25zdCBnZXRQaXBlSWQgPSAocmVwb19pZCk9PntcbiAgXG4gIC8vZ2V0IGxhbmVzXG4gIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgIH0sXG5cbiAgICBqc29uOiB0cnVlXG4gIH07XG4gIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAudGhlbigoZGF0YSkgPT4ge1xudmFyIG5hbWVBcnIgPSBbXTtcbnZhciBuYW1lSW5keD0wO1xuICAgICAgbG9nKGRhdGEpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgIC8vaWYgKGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWUgPT09IFBpcGVsaW5lTmFtZSkge1xuICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIgKyBkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgbmFtZUFycltuYW1lSW5keF0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lO1xuICAgICAgICAgIG5hbWVBcnJbbmFtZUluZHgrMV0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcblxuICAgICAgICAgIGxvZyhuYW1lQXJyW25hbWVJbmR4XSArXCIgLCBcIituYW1lQXJyW25hbWVJbmR4KzFdKVxuICAgICAgICAgIG5hbWVJbmR4ID0gbmFtZUluZHgrMjtcblxuICAgICAgICAvL31cbiAgICAgIH1cbiAgICAgIHJldHVybiBuYW1lQXJyO1xuXG4gICAgICAvL2xvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIgKyBlcnIpXG4gICAgICByZXR1cm4gZXJyO1xuICAgIH0pXG59XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIHRhcmdldERpYWxvZ0lkLG5hbWVBcnIscmVwb19pZCxpc3N1ZV9pZCwgY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzIDogXCIgKyB0YXJnZXREaWFsb2dJZClcblxuXG5cbiAgICBsb2cobmFtZUFycilcblxuXG4gICAgdmFyIGF0dGFjaG1lbnRzID0gW107XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBmb3IodmFyIGk9MDsgaTxuYW1lQXJyLmxlbmd0aDsgaT1pKzIpe1xuICAgICBhdHRhY2htZW50c1tpbmRleF0gPSBgXG4gICAgIHtcbiAgICAgICAgdHlwZTogQ0FSRCxcbiAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBJTkZPUk1BVElPTixcbiAgICAgICAgICAgIGluZm9ybWF0aW9uQ2FyZElucHV0OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiJHtuYW1lQXJyW2ldfVwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IFwiQ2xpY2sgYnV0dG9uIGJlbG93IHRvIHBsYWNlIElzc3VlIGluIHRoaXMgUGlwZWxpbmVcIixcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiUGxhY2UgSXNzdWUgSGVyZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCIvaXNzdWUgJHtyZXBvX2lkfSAke2lzc3VlX2lkfSAtcCAke25hbWVBcnJbaSsxXX1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBQUklNQVJZXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9YFxuICAgIGluZGV4Kys7XG4gICAgfVxuXG4gICAgbG9nKGF0dGFjaG1lbnRzWzBdK2F0dGFjaG1lbnRzWzFdKVxuICB2YXIgcSA9IGBcbiAgbXV0YXRpb24ge1xuICAgIGNyZWF0ZVRhcmdldGVkTWVzc2FnZShpbnB1dDoge1xuICAgICAgY29udmVyc2F0aW9uSWQ6IFwiJHtzcGFjZUlkfVwiXG4gICAgICB0YXJnZXRVc2VySWQ6IFwiJHt1c2VySWR9XCJcbiAgICAgIHRhcmdldERpYWxvZ0lkOiBcIiR7dGFyZ2V0RGlhbG9nSWR9XCJcbiAgICAgIGF0dGFjaG1lbnRzOiBbJHthdHRhY2htZW50c31dXG4gICAgICAgICAgICAgXG4gICAgICB9KSB7XG4gICAgICBzdWNjZXNzZnVsXG4gICAgfVxuICB9XG4gIGBcblxuICBjb25zdCByZXEgPSBhZ2VudC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcpXG4gICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2t9YClcbiAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vZ3JhcGhxbCcpXG4gICAgLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJycpXG4gICAgLnNldCgneC1ncmFwaHFsLXZpZXcnLCcgUFVCTElDLCBCRVRBJylcbiAgICAuc2VuZChxLnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG5cbiAgcmV0dXJuIHByb21pc2lmeShyZXEpLnRoZW4ocmVzID0+IHtcbiAgICBsb2cocmVzLmJvZHkpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgaWYgKHJlcy5ib2R5ICYmIHJlcy5ib2R5LmVycm9ycykge1xuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdFcnJvciBleGVjdXRpbmcgR3JhcGhRTCByZXF1ZXN0Jyk7XG4gICAgICBlcnIucmVzID0gcmVzO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH0pO1xuXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKSA9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==