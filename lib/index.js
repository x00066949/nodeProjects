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
  var nameArr;
  //var idArr;
  //get lanes
  var pipelineIdRequest = {
    uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

    headers: {
      'X-Authentication-Token': process.env.ZENHUB_TOKEN
    },

    json: true
  };
  rp(pipelineIdRequest).then(function (data) {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwiaSIsImxlbmd0aCIsImlkIiwiYXR0YWNobWVudHMiLCJpbmRleCIsInEiLCJzZXQiLCJyZXBsYWNlIiwicHJvbWlzaWZ5IiwiZGlyIiwiZGVwdGgiLCJlcnJvcnMiLCJkZWZlcnJlZCIsImRlZmVyIiwicmVqZWN0IiwicmVzb2x2ZSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUNaOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFiQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBYUEsSUFBSUcsUUFBUUYsUUFBUSxPQUFSLENBQVo7QUFDQSxJQUFJRyxhQUFhSCxRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJSSxPQUFPSixRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlLLEtBQUtMLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlNLGFBQWFOLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTyxNQUFNLDZDQUFNLHFCQUFOLENBQVo7QUFDQSxJQUFJQyxTQUFKOztBQUVPLElBQU1DLHNFQUFtQixTQUFuQkEsZ0JBQW1CLENBQUNDLEtBQUQsRUFBUUMsS0FBUixFQUFlQyxFQUFmO0FBQUEsU0FBc0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDbEVQ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R0FyQ0g7QUFzQ0QsQ0F6Q0Q7O0FBMkNBLElBQUloSCxRQUFRcUcsSUFBUixLQUFpQmEsTUFBckIsRUFBNkI7QUFDM0JiLE9BQUtqQyxRQUFRa0MsSUFBYixFQUFtQmxDLFFBQVFDLEdBQTNCLEVBQWdDLFVBQUM3QixHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQckIsY0FBUVosR0FBUixDQUFZLHFCQUFaLEVBQW1DaUMsR0FBbkM7QUFDQTtBQUNEOztBQUVEakMsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcbmltcG9ydCBxIGZyb20gJ3EnO1xuaW1wb3J0IGFnZW50IGZyb20gJ3N1cGVyYWdlbnQnO1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbiwgY2IpID0+IChyZXEsIHJlcykgPT4ge1xuICBsb2coXCIgMDAxIDogXCIgKyBldmVudFR5cGUpXG4gIC8vbG9nKFwidG9rZW4gOiBcIit0b2tlbilcbiAgbG9nKFwiYXBwIGlkIFwiICsgYXBwSWQpXG5cblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKSB7XG4gICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAvLyBvd24gbWVzc2FnZXNcbiAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgICAgbG9nKFwiY29tbWFuZCBcIiArIGNvbW1hbmQpO1xuXG4gICAgICBpZiAoIWNvbW1hbmQpXG4gICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcblxuXG4gICAgICAgIHZhciBQaXBlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzcGlwZWxpbmUqXFxzWzAtOV0vKTtcbiAgICAgICAgXG4gICAgICBpZiAoUGlwZVJlZ2V4LnRlc3QoY29tbWFuZCkpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBjb21tYW5kLnNwbGl0KCcgJyk7XG5cbiAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nIDogXCIgKyBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS50YXJnZXREaWFsb2dJZClcblxuICAgICAgICB2YXIgcGlwZVByb21pc2UgPSBnZXRQaXBlSWQoQ29tbWFuZEFyclsyXSk7XG5cbiAgICAgICAgcGlwZVByb21pc2UudGhlbigobmFtZUFycikgPT57XG4gICAgICAgICAgZGlhbG9nKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgICAgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQsXG4gICAgICAgICAgICBuYW1lQXJyLFxuICBcbiAgXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfVxuICBcbiAgICAgICAgICApXG4gICAgICAgIH0pXG4gICAgICBcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnICsgY29tbWFuZDtcblxuXG4gICAgICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7IHJlcXVlc3Q6IHJlcSwgcmVzcG9uc2U6IHJlcywgVXNlcklucHV0OiBtZXNzYWdlIH0pLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCAnVW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZCcpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gcHJvY2VzcyBjb21tYW5kXCIgKyBlcnIpO1xuICAgICAgICB9KVxuXG4gICAgICB9XG5cbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy9yZXR1cm47XG5cbiAgfSBlbHNlIHtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG5cbiAgfVxuXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG4vL1xuY29uc3QgZ2V0UGlwZUlkID0gKHJlcG9faWQpPT57XG4gIHZhciBuYW1lQXJyO1xuICAvL3ZhciBpZEFycjtcbiAgLy9nZXQgbGFuZXNcbiAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgfSxcblxuICAgIGpzb246IHRydWVcbiAgfTtcbiAgcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgbG9nKGRhdGEpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aCoyOyBpPWkrMikge1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICAvL2lmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpIHtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIG5hbWVBcnJbaV0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lO1xuICAgICAgICAgIG5hbWVBcnJbaSsxXSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuXG4gICAgICAgICAgbG9nKG5hbWVBcnJbaV0gK1wiICwgXCIrbmFtZUFycltpKzFdKVxuICAgICAgICAvL31cbiAgICAgIH1cbiAgICAgIHJldHVybiBuYW1lQXJyO1xuXG4gICAgICAvL2xvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIgKyBlcnIpXG4gICAgICByZXR1cm4gZXJyO1xuICAgIH0pXG59XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIHRhcmdldERpYWxvZ0lkLG5hbWVBcnIsIGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlcyA6IFwiICsgdGFyZ2V0RGlhbG9nSWQpXG5cblxuXG4gICAgbG9nKG5hbWVBcnIpXG5cblxuICAgIHZhciBhdHRhY2htZW50cztcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGZvcih2YXIgaT0wOyBpPG5hbWVBcnIubGVuZ3RoOyBpPWkrMil7XG4gICAgIGF0dGFjaG1lbnRzW2luZGV4XSA9IGBcbiAgICAge1xuICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCIke25hbWVBcnJbaV19XCIsXG4gICAgICAgICAgICAgICAgc3VidGl0bGU6IFwiU2FtcGxlIFN1YnRpdGxlXCIsXG4gICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgVGV4dFwiLFxuICAgICAgICAgICAgICAgIGRhdGU6IFwiMTUwMDU3MzMzODAwMFwiLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgQnV0dG9uIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IFwiJHtuYW1lQXJyW2krMV19XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogUFJJTUFSWVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfWBcbiAgICBpbmRleCsrO1xuICAgIH1cblxuICAgIGxvZyhhdHRhY2htZW50c1swXSthdHRhY2htZW50c1sxXSlcbiAgdmFyIHEgPSBgXG4gIG11dGF0aW9uIHtcbiAgICBjcmVhdGVUYXJnZXRlZE1lc3NhZ2UoaW5wdXQ6IHtcbiAgICAgIGNvbnZlcnNhdGlvbklkOiBcIiR7c3BhY2VJZH1cIlxuICAgICAgdGFyZ2V0VXNlcklkOiBcIiR7dXNlcklkfVwiXG4gICAgICB0YXJnZXREaWFsb2dJZDogXCIke3RhcmdldERpYWxvZ0lkfVwiXG4gICAgICBhdHRhY2htZW50czogW1xuICAgICAge1xuICAgICAgICAgIHR5cGU6IENBUkQsXG4gICAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgICBpbmZvcm1hdGlvbkNhcmRJbnB1dDoge1xuICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiU2FtcGxlIFRpdGxlXCIsXG4gICAgICAgICAgICAgICAgICBzdWJ0aXRsZTogXCJTYW1wbGUgU3VidGl0bGVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIFRleHRcIixcbiAgICAgICAgICAgICAgICAgIGRhdGU6IFwiMTUwMDU3MzMzODAwMFwiLFxuICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgQnV0dG9uIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCJTYW1wbGUgQnV0dG9uIFBheWxvYWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICBdXG4gICAgICB9KSB7XG4gICAgICBzdWNjZXNzZnVsXG4gICAgfVxuICB9XG4gIGBcbiAgY29uc3QgcmVxID0gYWdlbnQucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnKVxuICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rfWApXG4gICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2dyYXBocWwnKVxuICAgIC5zZXQoJ0FjY2VwdC1FbmNvZGluZycsICcnKVxuICAgIC5zZXQoJ3gtZ3JhcGhxbC12aWV3JywnIFBVQkxJQywgQkVUQScpXG4gICAgLnNlbmQocS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuXG4gIHJldHVybiBwcm9taXNpZnkocmVxKS50aGVuKHJlcyA9PiB7XG4gICAgbG9nKHJlcy5ib2R5KVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5lcnJvcnMpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignRXJyb3IgZXhlY3V0aW5nIEdyYXBoUUwgcmVxdWVzdCcpO1xuICAgICAgZXJyLnJlcyA9IHJlcztcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbiAgLypyZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJywge1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOiB0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHFcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJyArIGVycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApOyovXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKSA9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==