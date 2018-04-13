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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiY29tbWFuZCIsIkpTT04iLCJwYXJzZSIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJ0eXBlIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwibmFtZUluZHgiLCJpIiwibGVuZ3RoIiwiaWQiLCJpc3N1ZV9pZCIsImF0dGFjaG1lbnRzIiwiaW5kZXgiLCJxIiwic2V0IiwicmVwbGFjZSIsInByb21pc2lmeSIsImRpciIsImRlcHRoIiwiZXJyb3JzIiwiZGVmZXJyZWQiLCJkZWZlciIsInJlamVjdCIsInJlc29sdmUiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBYkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQWFBLElBQUlHLFFBQVFGLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUcsYUFBYUgsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUksT0FBT0osUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSyxLQUFLTCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJTSxhQUFhTixRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU8sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBZUMsRUFBZjtBQUFBLFNBQXNCLFVBQUNDLEdBQUQs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QUksbUNBQUosRUFBeUMyRyxJQUF6QztBQUNELE9BUEQ7QUFRSCxHQXBDSDtBQXFDRCxDQXhDRDs7QUEwQ0EsSUFBSWxILFFBQVF1RyxJQUFSLEtBQWlCYSxNQUFyQixFQUE2QjtBQUMzQmIsT0FBS25DLFFBQVFvQyxJQUFiLEVBQW1CcEMsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQzdCLEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1ByQixjQUFRWixHQUFSLENBQVkscUJBQVosRUFBbUNpQyxHQUFuQztBQUNBO0FBQ0Q7O0FBRURqQyxRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuaW1wb3J0ICogYXMgYm9hcmQgZnJvbSAnLi9zY3J1bV9ib2FyZCc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnLi9pc3N1ZV9ldmVudHMnO1xuaW1wb3J0IHEgZnJvbSAncSc7XG5pbXBvcnQgYWdlbnQgZnJvbSAnc3VwZXJhZ2VudCc7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xudmFyIGV2ZW50VHlwZTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NfcmVxdWVzdHMgPSAoYXBwSWQsIHRva2VuLCBjYikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIGxvZyhcIiAwMDEgOiBcIiArIGV2ZW50VHlwZSlcbiAgbG9nKFwiYXBwIGlkIFwiICsgYXBwSWQpXG5cblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKSB7XG4gICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAvLyBvd24gbWVzc2FnZXNcbiAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG5cbiAgICBpZiAoIWNvbW1hbmQpXG4gICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgJiYgY29tbWFuZCkge1xuXG4gICAgICBsb2coXCJjb21tYW5kIFwiICsgY29tbWFuZCk7XG5cbiAgICAgIHZhciBQaXBlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzcGlwZWxpbmUqXFxzWzAtOV0qXFxzWzAtOV0vKTtcblxuICAgICAgaWYgKFBpcGVSZWdleC50ZXN0KGNvbW1hbmQpKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gY29tbWFuZC5zcGxpdCgnICcpO1xuXG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG5cbiAgICAgICAgdmFyIHBpcGVQcm9taXNlID0gZ2V0UGlwZUlkKENvbW1hbmRBcnJbMl0pO1xuXG4gICAgICAgIHBpcGVQcm9taXNlLnRoZW4oKG5hbWVBcnIpID0+IHtcbiAgICAgICAgICBkaWFsb2cocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgICAgICBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS50YXJnZXREaWFsb2dJZCxcbiAgICAgICAgICAgIG5hbWVBcnIsXG4gICAgICAgICAgICBDb21tYW5kQXJyWzJdLFxuICAgICAgICAgICAgQ29tbWFuZEFyclszXSxcblxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnc2VudCBkaWFsb2cgdG8gJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIClcbiAgICAgICAgfSlcblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcgKyBjb21tYW5kO1xuXG5cbiAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHsgcmVxdWVzdDogcmVxLCByZXNwb25zZTogcmVzLCBVc2VySW5wdXQ6IG1lc3NhZ2UgfSkudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICAgICAgbG9nKFwic3BhY2UgaWQgXCIgKyByZXEuYm9keS5zcGFjZUlkKVxuICAgICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsICdVbmFibGUgdG8gcHJvY2VzcyBjb21tYW5kJyksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIGxvZyhcInVuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmRcIiArIGVycik7XG4gICAgICAgIH0pXG5cbiAgICAgIH1cblxuICAgIH07XG5cbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09ICdFTCcpIHtcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICBsb2coXCJFTCB0b2tlbiA6IFwiICsgb2F1dGgub1Rva2VuKCkpXG4gICAgbG9nKFwiIDAwMiA6IFwiICsgZXZlbnRUeXBlKVxuXG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3NpbmcgZ2l0aHViIGV2ZW50XCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IGV2ZW50cy5wYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgIHByb21pc2UudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQoJzVhMDliMjM0ZTRiMDkwYmNkN2ZjZjNiMicsXG5cbiAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICB9IGVsc2Uge1xuXG4gICAgcmVzLnN0YXR1cyg0MDEpLmVuZCgpO1xuICAgIHJldHVybjtcblxuICB9XG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vL2dldCBwaXBlbGluZSBpZCBmb3IgZGlhbG9nIGJveGVzXG5jb25zdCBnZXRQaXBlSWQgPSAocmVwb19pZCkgPT4ge1xuXG4gIC8vZ2V0IGxhbmVzXG4gIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgIH0sXG5cbiAgICBqc29uOiB0cnVlXG4gIH07XG4gIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgdmFyIG5hbWVBcnIgPSBbXTtcbiAgICAgIHZhciBuYW1lSW5keCA9IDA7XG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIiArIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgbmFtZUFycltuYW1lSW5keF0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lO1xuICAgICAgICBuYW1lQXJyW25hbWVJbmR4ICsgMV0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcblxuICAgICAgICBsb2cobmFtZUFycltuYW1lSW5keF0gKyBcIiAsIFwiICsgbmFtZUFycltuYW1lSW5keCArIDFdKVxuICAgICAgICBuYW1lSW5keCA9IG5hbWVJbmR4ICsgMjtcblxuICAgICAgfVxuICAgICAgcmV0dXJuIG5hbWVBcnI7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgcmV0dXJuIGVycjtcbiAgICB9KVxufVxuXG4vL2RpYWxvZyBib3hlc1xuY29uc3QgZGlhbG9nID0gKHNwYWNlSWQsIHRvaywgdXNlcklkLCB0YXJnZXREaWFsb2dJZCwgbmFtZUFyciwgcmVwb19pZCwgaXNzdWVfaWQsIGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlcyA6IFwiICsgdGFyZ2V0RGlhbG9nSWQpXG4gIGxvZyhuYW1lQXJyKVxuXG4gIHZhciBhdHRhY2htZW50cyA9IFtdO1xuICB2YXIgaW5kZXggPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVBcnIubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICBhdHRhY2htZW50c1tpbmRleF0gPSBgXG4gICAgIHtcbiAgICAgICAgdHlwZTogQ0FSRCxcbiAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBJTkZPUk1BVElPTixcbiAgICAgICAgICAgIGluZm9ybWF0aW9uQ2FyZElucHV0OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiJHtuYW1lQXJyW2ldfVwiLFxuICAgICAgICAgICAgICAgIHN1YnRpdGxlOiBcIlwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IFwiQ2xpY2sgYnV0dG9uIGJlbG93IHRvIHBsYWNlIElzc3VlIGluIHRoaXMgUGlwZWxpbmVcIiwgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZGF0ZTogXCIwXCIsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlBsYWNlIElzc3VlIEhlcmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IFwiL2lzc3VlICR7cmVwb19pZH0gJHtpc3N1ZV9pZH0gLXAgJHtuYW1lQXJyW2kgKyAxXX1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBQUklNQVJZXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9YFxuICAgIGluZGV4Kys7XG4gIH1cblxuICB2YXIgcSA9IGBcbiAgbXV0YXRpb24ge1xuICAgIGNyZWF0ZVRhcmdldGVkTWVzc2FnZShpbnB1dDoge1xuICAgICAgY29udmVyc2F0aW9uSWQ6IFwiJHtzcGFjZUlkfVwiXG4gICAgICB0YXJnZXRVc2VySWQ6IFwiJHt1c2VySWR9XCJcbiAgICAgIHRhcmdldERpYWxvZ0lkOiBcIiR7dGFyZ2V0RGlhbG9nSWR9XCJcbiAgICAgIGF0dGFjaG1lbnRzOiBbJHthdHRhY2htZW50c31dXG4gICAgICAgICAgICAgXG4gICAgICB9KSB7XG4gICAgICBzdWNjZXNzZnVsXG4gICAgfVxuICB9XG4gIGBcblxuICBjb25zdCByZXEgPSBhZ2VudC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcpXG4gICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2t9YClcbiAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vZ3JhcGhxbCcpXG4gICAgLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJycpXG4gICAgLnNldCgneC1ncmFwaHFsLXZpZXcnLCAnIFBVQkxJQywgQkVUQScpXG4gICAgLnNlbmQocS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuXG4gIHJldHVybiBwcm9taXNpZnkocmVxKS50aGVuKHJlcyA9PiB7XG4gICAgbG9nKHJlcy5ib2R5KVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5lcnJvcnMpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignRXJyb3IgZXhlY3V0aW5nIEdyYXBoUUwgcmVxdWVzdCcpO1xuICAgICAgZXJyLnJlcyA9IHJlcztcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcblxufTtcblxuXG5leHBvcnQgY29uc3QgcHJvbWlzaWZ5ID0gKHJlcSkgPT4ge1xuICB2YXIgZGVmZXJyZWQgPSBxLmRlZmVyKCk7XG5cbiAgcmVxLmVuZCgoZXJyLCByZXMpID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnV1cnXG4gICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgIHJldHVybjtcblxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gICAgXCJzaGExPVwiICsgY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfSBlbHNlIHtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEsIHsgZGVwdGg6IG51bGwgfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwidG9rIDogXCIgKyB0b2tlbilcbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvL2hhbmRsZSBzbGFzaCBjb21tYW5kc1xuICAgICAgcHJvY2Vzc19yZXF1ZXN0cyhhcHBJZCwgdG9rZW4pXG5cbiAgICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICByZXNwb25zZS5yZWRpcmVjdCgnaHR0cDovL3dvcmtzcGFjZS5pYm0uY29tJyk7XG5cbiAgICAgICAgfSk7XG5cblxuXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19