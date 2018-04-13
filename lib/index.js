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

          var PipeRegex = new RegExp(/^\/issue*\spipeline*\s[0-9]/);

          if (PipeRegex.test(command)) {
            var CommandArr = command.split(' ');

            log("using dialog : " + JSON.parse(req.body.annotationPayload).targetDialogId);

            var pipePromise = getPipeId(CommandArr[2]);

            pipePromise.then(function (nameArr) {
              dialog(req.body.spaceId, token(), req.body.userId, JSON.parse(req.body.annotationPayload).targetDialogId, nameArr, function (err, res) {
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
    var nameArr;
    log(data);
    for (var i = 0; i < data['pipelines'].length * 2; i = i + 2) {
      log("checking");
      //if (data['pipelines'][i].name === PipelineName) {
      log("found pipeline id : " + data['pipelines'][i].id);
      nameArr[i] = data['pipelines'][i].name;
      nameArr[i + 1] = data['pipelines'][i].id;

      log(nameArr[i] + " , " + nameArr[i + 1]);
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
var dialog = function dialog(spaceId, tok, userId, targetDialogId, nameArr, cb) {

  log("trying to build dialog boxes : " + targetDialogId);

  log(nameArr);

  var attachments;
  var index = 0;
  for (var i = 0; i < nameArr.length; i = i + 2) {
    attachments[index] = /*istanbul ignore next*/'\n     {\n        type: CARD,\n        cardInput: {\n            type: INFORMATION,\n            informationCardInput: {\n                title: "' + nameArr[i] + '",\n                subtitle: "Sample Subtitle",\n                text: "Sample Text",\n                date: "1500573338000",\n                buttons: [\n                    {\n                        text: "Sample Button Text",\n                        payload: "' + nameArr[i + 1] + '",\n                        style: PRIMARY\n                    }\n                ]\n            }\n        }\n    }';
    index++;
  }

  log(attachments[0] + attachments[1]);
  var q = /*istanbul ignore next*/'\n  mutation {\n    createTargetedMessage(input: {\n      conversationId: "' + spaceId + '"\n      targetUserId: "' + userId + '"\n      targetDialogId: "' + targetDialogId + '"\n      attachments: [\n      {\n          type: CARD,\n          cardInput: {\n              type: INFORMATION,\n              informationCardInput: {\n                  title: "Sample Title",\n                  subtitle: "Sample Subtitle",\n                  text: "Sample Text",\n                  date: "1500573338000",\n                  buttons: [\n                      {\n                          text: "Sample Button Text",\n                          payload: "Sample Button Payload",\n                          style: PRIMARY\n                      }\n                  ]\n              }\n          }\n      }\n      ]\n      }) {\n      successful\n    }\n  }\n  ';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwiaSIsImxlbmd0aCIsImlkIiwiYXR0YWNobWVudHMiLCJpbmRleCIsInEiLCJzZXQiLCJyZXBsYWNlIiwicHJvbWlzaWZ5IiwiZGlyIiwiZGVwdGgiLCJlcnJvcnMiLCJkZWZlcnJlZCIsImRlZmVyIiwicmVqZWN0IiwicmVzb2x2ZSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUNaOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFiQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBYUEsSUFBSUcsUUFBUUYsUUFBUSxPQUFSLENBQVo7QUFDQSxJQUFJRyxhQUFhSCxRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJSSxPQUFPSixRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlLLEtBQUtMLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlNLGFBQWFOLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTyxNQUFNLDZDQUFNLHFCQUFOLENBQVo7QUFDQSxJQUFJQyxTQUFKOztBQUVPLElBQU1DLHNFQUFtQixTQUFuQkEsZ0JBQW1CLENBQUNDLEtBQUQsRUFBUUMsS0FBUixFQUFlQyxFQUFmO0FBQUEsU0FBc0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDbEVQ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QUFTSCxHQXJDSDtBQXNDRCxDQXpDRDs7QUEyQ0EsSUFBSWhILFFBQVFxRyxJQUFSLEtBQWlCYSxNQUFyQixFQUE2QjtBQUMzQmIsT0FBS2pDLFFBQVFrQyxJQUFiLEVBQW1CbEMsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQzdCLEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1ByQixjQUFRWixHQUFSLENBQVkscUJBQVosRUFBbUNpQyxHQUFuQztBQUNBO0FBQ0Q7O0FBRURqQyxRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuaW1wb3J0ICogYXMgYm9hcmQgZnJvbSAnLi9zY3J1bV9ib2FyZCc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnLi9pc3N1ZV9ldmVudHMnO1xuaW1wb3J0IHEgZnJvbSAncSc7XG5pbXBvcnQgYWdlbnQgZnJvbSAnc3VwZXJhZ2VudCc7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xudmFyIGV2ZW50VHlwZTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NfcmVxdWVzdHMgPSAoYXBwSWQsIHRva2VuLCBjYikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIGxvZyhcIiAwMDEgOiBcIiArIGV2ZW50VHlwZSlcbiAgLy9sb2coXCJ0b2tlbiA6IFwiK3Rva2VuKVxuICBsb2coXCJhcHAgaWQgXCIgKyBhcHBJZClcblxuXG4gIGlmIChldmVudFR5cGUgPT09ICdXVycpIHtcbiAgICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAgIC8vIG93biBtZXNzYWdlc1xuICAgIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgICByZXR1cm47XG5cbiAgICB9XG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcblxuICAgIGlmICghcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgICBsb2cocmVxLmJvZHkpO1xuXG4gICAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnIC8qJiYgcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQudGFyZ2V0QXBwSWQgPT09IGFwcElkKi8pIHtcbiAgICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gICAgICAvL2xvZyhcImFjdGlvbiBpZCBcIityZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCk7XG4gICAgICBsb2coXCJjb21tYW5kIFwiICsgY29tbWFuZCk7XG5cbiAgICAgIGlmICghY29tbWFuZClcbiAgICAgICAgbG9nKFwibm8gY29tbWFuZCB0byBwcm9jZXNzXCIpO1xuXG5cbiAgICAgICAgdmFyIFBpcGVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNwaXBlbGluZSpcXHNbMC05XS8pO1xuICAgICAgICBcbiAgICAgIGlmIChQaXBlUmVnZXgudGVzdChjb21tYW5kKSkge1xuICAgICAgICB2YXIgQ29tbWFuZEFyciA9IGNvbW1hbmQuc3BsaXQoJyAnKTtcblxuICAgICAgICBsb2coXCJ1c2luZyBkaWFsb2cgOiBcIiArIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkKVxuXG4gICAgICAgIHZhciBwaXBlUHJvbWlzZSA9IGdldFBpcGVJZChDb21tYW5kQXJyWzJdKTtcblxuICAgICAgICBwaXBlUHJvbWlzZS50aGVuKChuYW1lQXJyKSA9PntcbiAgICAgICAgICBkaWFsb2cocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgICAgICBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS50YXJnZXREaWFsb2dJZCxcbiAgICAgICAgICAgIG5hbWVBcnIsXG4gIFxuICBcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9XG4gIFxuICAgICAgICAgIClcbiAgICAgICAgfSlcbiAgICAgIFxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcgKyBjb21tYW5kO1xuXG5cbiAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHsgcmVxdWVzdDogcmVxLCByZXNwb25zZTogcmVzLCBVc2VySW5wdXQ6IG1lc3NhZ2UgfSkudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICAgICAgbG9nKFwic3BhY2UgaWQgXCIgKyByZXEuYm9keS5zcGFjZUlkKVxuICAgICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCA6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsICdVbmFibGUgdG8gcHJvY2VzcyBjb21tYW5kJyksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIGxvZyhcInVuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmRcIiArIGVycik7XG4gICAgICAgIH0pXG5cbiAgICAgIH1cblxuICAgIH07XG5cbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09ICdFTCcpIHtcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICBsb2coXCJFTCB0b2tlbiA6IFwiICsgb2F1dGgub1Rva2VuKCkpXG5cbiAgICAvL3ZhciB0b2tzID0gb2F1dGgub1Rva2VuO1xuICAgIGxvZyhcIiAwMDIgOiBcIiArIGV2ZW50VHlwZSlcblxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIGdpdGh1YiBldmVudFwiKTtcblxuICAgIGlmICghcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgICBsb2cocmVxLmJvZHkpO1xuXG4gICAgdmFyIHByb21pc2UgPSBldmVudHMucGFyc2VSZXNwb25zZShyZXEsIHJlcylcbiAgICBwcm9taXNlLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICBzZW5kKCc1YTA5YjIzNGU0YjA5MGJjZDdmY2YzYjInLFxuXG4gICAgICAgIHRvX3Bvc3QsXG4gICAgICAgIG9hdXRoLm9Ub2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICcpO1xuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICAvL3JldHVybjtcblxuICB9IGVsc2Uge1xuXG4gICAgcmVzLnN0YXR1cyg0MDEpLmVuZCgpO1xuICAgIHJldHVybjtcblxuICB9XG5cblxuXG59XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcbi8vXG5jb25zdCBnZXRQaXBlSWQgPSAocmVwb19pZCk9PntcbiAgXG4gIC8vZ2V0IGxhbmVzXG4gIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgIH0sXG5cbiAgICBqc29uOiB0cnVlXG4gIH07XG4gIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAudGhlbigoZGF0YSkgPT4ge1xudmFyIG5hbWVBcnI7XG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoKjI7IGk9aSsyKSB7XG4gICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgIC8vaWYgKGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWUgPT09IFBpcGVsaW5lTmFtZSkge1xuICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIgKyBkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgbmFtZUFycltpXSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWU7XG4gICAgICAgICAgbmFtZUFycltpKzFdID0gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG5cbiAgICAgICAgICBsb2cobmFtZUFycltpXSArXCIgLCBcIituYW1lQXJyW2krMV0pXG4gICAgICAgIC8vfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5hbWVBcnI7XG5cbiAgICAgIC8vbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIiArIGVycilcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfSlcbn1cblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgdGFyZ2V0RGlhbG9nSWQsbmFtZUFyciwgY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzIDogXCIgKyB0YXJnZXREaWFsb2dJZClcblxuXG5cbiAgICBsb2cobmFtZUFycilcblxuXG4gICAgdmFyIGF0dGFjaG1lbnRzO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgZm9yKHZhciBpPTA7IGk8bmFtZUFyci5sZW5ndGg7IGk9aSsyKXtcbiAgICAgYXR0YWNobWVudHNbaW5kZXhdID0gYFxuICAgICB7XG4gICAgICAgIHR5cGU6IENBUkQsXG4gICAgICAgIGNhcmRJbnB1dDoge1xuICAgICAgICAgICAgdHlwZTogSU5GT1JNQVRJT04sXG4gICAgICAgICAgICBpbmZvcm1hdGlvbkNhcmRJbnB1dDoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIiR7bmFtZUFycltpXX1cIixcbiAgICAgICAgICAgICAgICBzdWJ0aXRsZTogXCJTYW1wbGUgU3VidGl0bGVcIixcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBUZXh0XCIsXG4gICAgICAgICAgICAgICAgZGF0ZTogXCIxNTAwNTczMzM4MDAwXCIsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBCdXR0b24gVGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCIke25hbWVBcnJbaSsxXX1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBQUklNQVJZXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9YFxuICAgIGluZGV4Kys7XG4gICAgfVxuXG4gICAgbG9nKGF0dGFjaG1lbnRzWzBdK2F0dGFjaG1lbnRzWzFdKVxuICB2YXIgcSA9IGBcbiAgbXV0YXRpb24ge1xuICAgIGNyZWF0ZVRhcmdldGVkTWVzc2FnZShpbnB1dDoge1xuICAgICAgY29udmVyc2F0aW9uSWQ6IFwiJHtzcGFjZUlkfVwiXG4gICAgICB0YXJnZXRVc2VySWQ6IFwiJHt1c2VySWR9XCJcbiAgICAgIHRhcmdldERpYWxvZ0lkOiBcIiR7dGFyZ2V0RGlhbG9nSWR9XCJcbiAgICAgIGF0dGFjaG1lbnRzOiBbXG4gICAgICB7XG4gICAgICAgICAgdHlwZTogQ0FSRCxcbiAgICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgdHlwZTogSU5GT1JNQVRJT04sXG4gICAgICAgICAgICAgIGluZm9ybWF0aW9uQ2FyZElucHV0OiB7XG4gICAgICAgICAgICAgICAgICB0aXRsZTogXCJTYW1wbGUgVGl0bGVcIixcbiAgICAgICAgICAgICAgICAgIHN1YnRpdGxlOiBcIlNhbXBsZSBTdWJ0aXRsZVwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgVGV4dFwiLFxuICAgICAgICAgICAgICAgICAgZGF0ZTogXCIxNTAwNTczMzM4MDAwXCIsXG4gICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBCdXR0b24gVGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiBcIlNhbXBsZSBCdXR0b24gUGF5bG9hZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogUFJJTUFSWVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF1cbiAgICAgIH0pIHtcbiAgICAgIHN1Y2Nlc3NmdWxcbiAgICB9XG4gIH1cbiAgYFxuICBjb25zdCByZXEgPSBhZ2VudC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcpXG4gICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2t9YClcbiAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vZ3JhcGhxbCcpXG4gICAgLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJycpXG4gICAgLnNldCgneC1ncmFwaHFsLXZpZXcnLCcgUFVCTElDLCBCRVRBJylcbiAgICAuc2VuZChxLnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG5cbiAgcmV0dXJuIHByb21pc2lmeShyZXEpLnRoZW4ocmVzID0+IHtcbiAgICBsb2cocmVzLmJvZHkpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgaWYgKHJlcy5ib2R5ICYmIHJlcy5ib2R5LmVycm9ycykge1xuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdFcnJvciBleGVjdXRpbmcgR3JhcGhRTCByZXF1ZXN0Jyk7XG4gICAgICBlcnIucmVzID0gcmVzO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH0pO1xuICAvKnJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnLCB7XG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ2p3dCc6IHRvayxcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9ncmFwaHFsJyxcbiAgICAgICAgJ3gtZ3JhcGhxbC12aWV3JzogJ1BVQkxJQywgQkVUQSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keTogcVxuXG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdmYWlsZWQgZXJyOiAnICsgZXJyKVxuICAgICAgICBjb25zb2xlLmRpcihyZXMsIHsgZGVwdGg6IG51bGwgfSlcbiAgICAgICAgbG9nKCdFcnJvciBjcmVhdGluZyBkaWFsb2cgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9XG4gICk7Ki9cbn07XG5cblxuZXhwb3J0IGNvbnN0IHByb21pc2lmeSA9IChyZXEpID0+IHtcbiAgdmFyIGRlZmVycmVkID0gcS5kZWZlcigpO1xuXG4gIHJlcS5lbmQoKGVyciwgcmVzKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgPT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ1dXJ1xuICAgIGxvZyhcImZyb20gV1dcIilcbiAgICByZXR1cm47XG5cbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICAgIFwic2hhMT1cIiArIGNyZWF0ZUhtYWMoJ3NoYTEnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnRUwnXG4gICAgbG9nKFwiZ2l0aHViIGV2ZW50XCIpXG4gICAgcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG5cblxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcInRvayA6IFwiICsgdG9rZW4pXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuXG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19