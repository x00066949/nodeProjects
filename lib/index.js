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
var dialog = function dialog(spaceId, tok, userId, targetDialogId, nameArr, cb) {

  log("trying to build dialog boxes : " + targetDialogId);

  log(nameArr);

  var attachments = [];
  var index = 0;
  for (var i = 0; i < nameArr.length; i = i + 2) {
    attachments[index] = /*istanbul ignore next*/'\n     {\n        type: CARD,\n        cardInput: {\n            type: INFORMATION,\n            informationCardInput: {\n                title: "' + nameArr[i] + '",\n                subtitle: "Sample Subtitle",\n                text: "Sample Text",\n                date: "1500573338000",\n                buttons: [\n                    {\n                        text: "Sample Button Text",\n                        payload: "' + nameArr[i + 1] + '",\n                        style: PRIMARY\n                    }\n                ]\n            }\n        }\n    }';
    index++;
  }

  log(attachments[0] + attachments[1]);
  var q = /*istanbul ignore next*/'\n  mutation {\n    createTargetedMessage(input: {\n      conversationId: "' + spaceId + '"\n      targetUserId: "' + userId + '"\n      targetDialogId: "' + targetDialogId + '"\n      attachments: [' + attachments + ']\n             \n      }) {\n      successful\n    }\n  }\n  ';
  /*
  [
    {
        type: CARD,
        cardInput: {
            type: INFORMATION,
            informationCardInput: {
                title: "Sample Title",
                subtitle: "Sample Subtitle",
                text: "Sample Text",
                date: "1500573338000",
                buttons: [
                    {
                        text: "Sample Button Text",
                        payload: "Sample Button Payload",
                        style: PRIMARY
                    }
                ]*/
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwibmFtZUluZHgiLCJpIiwibGVuZ3RoIiwiaWQiLCJhdHRhY2htZW50cyIsImluZGV4IiwicSIsInNldCIsInJlcGxhY2UiLCJwcm9taXNpZnkiLCJkaXIiLCJkZXB0aCIsImVycm9ycyIsImRlZmVycmVkIiwiZGVmZXIiLCJyZWplY3QiLCJyZXNvbHZlIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJyZWRpcmVjdCIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLE07O0FBQ1o7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztBQWJBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFhQSxJQUFJRyxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFBQWFILFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlJLE9BQU9KLFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUssS0FBS0wsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSU0sYUFBYU4sUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1PLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjtBQUNBLElBQUlDLFNBQUo7O0FBRU8sSUFBTUMsc0VBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSLEVBQWVDLEVBQWY7QUFBQSxTQUFzQixVQUFDQyxHQUFELEVBQU1DLEdBQU4s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QUNELFlBQU15RSxPQUFPNUMsSUFBSTZDLE9BQUosSUFBZSxHQUE1QjtBQUNBM0csWUFBSSxtQ0FBSixFQUF5QzBHLElBQXpDO0FBQ0E7QUFDRCxPQVJEO0FBU0gsR0FyQ0g7QUFzQ0QsQ0F6Q0Q7O0FBMkNBLElBQUlqSCxRQUFRc0csSUFBUixLQUFpQmEsTUFBckIsRUFBNkI7QUFDM0JiLE9BQUtsQyxRQUFRbUMsSUFBYixFQUFtQm5DLFFBQVFDLEdBQTNCLEVBQWdDLFVBQUM3QixHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQckIsY0FBUVosR0FBUixDQUFZLHFCQUFaLEVBQW1DaUMsR0FBbkM7QUFDQTtBQUNEOztBQUVEakMsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcbmltcG9ydCBxIGZyb20gJ3EnO1xuaW1wb3J0IGFnZW50IGZyb20gJ3N1cGVyYWdlbnQnO1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbiwgY2IpID0+IChyZXEsIHJlcykgPT4ge1xuICBsb2coXCIgMDAxIDogXCIgKyBldmVudFR5cGUpXG4gIC8vbG9nKFwidG9rZW4gOiBcIit0b2tlbilcbiAgbG9nKFwiYXBwIGlkIFwiICsgYXBwSWQpXG5cblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKSB7XG4gICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gICAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgICAvLyBvd24gbWVzc2FnZXNcbiAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgfVxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgICAgLy9sb2coXCJhY3Rpb24gaWQgXCIrcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpO1xuICAgICAgbG9nKFwiY29tbWFuZCBcIiArIGNvbW1hbmQpO1xuXG4gICAgICBpZiAoIWNvbW1hbmQpXG4gICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcblxuXG4gICAgICAgIHZhciBQaXBlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzcGlwZWxpbmUqXFxzWzAtOV0vKTtcbiAgICAgICAgXG4gICAgICBpZiAoUGlwZVJlZ2V4LnRlc3QoY29tbWFuZCkpIHtcbiAgICAgICAgdmFyIENvbW1hbmRBcnIgPSBjb21tYW5kLnNwbGl0KCcgJyk7XG5cbiAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nIDogXCIgKyBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS50YXJnZXREaWFsb2dJZClcblxuICAgICAgICB2YXIgcGlwZVByb21pc2UgPSBnZXRQaXBlSWQoQ29tbWFuZEFyclsyXSk7XG5cbiAgICAgICAgcGlwZVByb21pc2UudGhlbigobmFtZUFycikgPT57XG4gICAgICAgICAgZGlhbG9nKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgICAgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQsXG4gICAgICAgICAgICBuYW1lQXJyLFxuICBcbiAgXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfVxuICBcbiAgICAgICAgICApXG4gICAgICAgIH0pXG4gICAgICBcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnICsgY29tbWFuZDtcblxuXG4gICAgICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7IHJlcXVlc3Q6IHJlcSwgcmVzcG9uc2U6IHJlcywgVXNlcklucHV0OiBtZXNzYWdlIH0pLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCAnVW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZCcpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gcHJvY2VzcyBjb21tYW5kXCIgKyBlcnIpO1xuICAgICAgICB9KVxuXG4gICAgICB9XG5cbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy9yZXR1cm47XG5cbiAgfSBlbHNlIHtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG5cbiAgfVxuXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG4vL1xuY29uc3QgZ2V0UGlwZUlkID0gKHJlcG9faWQpPT57XG4gIFxuICAvL2dldCBsYW5lc1xuICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb19pZCArICcvYm9hcmQnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICB9LFxuXG4gICAganNvbjogdHJ1ZVxuICB9O1xuICByZXR1cm4gcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbnZhciBuYW1lQXJyID0gW107XG52YXIgbmFtZUluZHg9MDtcbiAgICAgIGxvZyhkYXRhKVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICAvL2lmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpIHtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIG5hbWVBcnJbbmFtZUluZHhdID0gZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZTtcbiAgICAgICAgICBuYW1lQXJyW25hbWVJbmR4KzFdID0gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG5cbiAgICAgICAgICBsb2cobmFtZUFycltuYW1lSW5keF0gK1wiICwgXCIrbmFtZUFycltuYW1lSW5keCsxXSlcbiAgICAgICAgICBuYW1lSW5keCA9IG5hbWVJbmR4KzI7XG5cbiAgICAgICAgLy99XG4gICAgICB9XG4gICAgICByZXR1cm4gbmFtZUFycjtcblxuICAgICAgLy9sb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgcmV0dXJuIGVycjtcbiAgICB9KVxufVxuXG4vL2RpYWxvZyBib3hlc1xuY29uc3QgZGlhbG9nID0gKHNwYWNlSWQsIHRvaywgdXNlcklkLCB0YXJnZXREaWFsb2dJZCxuYW1lQXJyLCBjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXMgOiBcIiArIHRhcmdldERpYWxvZ0lkKVxuXG5cblxuICAgIGxvZyhuYW1lQXJyKVxuXG5cbiAgICB2YXIgYXR0YWNobWVudHMgPSBbXTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGZvcih2YXIgaT0wOyBpPG5hbWVBcnIubGVuZ3RoOyBpPWkrMil7XG4gICAgIGF0dGFjaG1lbnRzW2luZGV4XSA9IGBcbiAgICAge1xuICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCIke25hbWVBcnJbaV19XCIsXG4gICAgICAgICAgICAgICAgc3VidGl0bGU6IFwiU2FtcGxlIFN1YnRpdGxlXCIsXG4gICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgVGV4dFwiLFxuICAgICAgICAgICAgICAgIGRhdGU6IFwiMTUwMDU3MzMzODAwMFwiLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgQnV0dG9uIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IFwiJHtuYW1lQXJyW2krMV19XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogUFJJTUFSWVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfWBcbiAgICBpbmRleCsrO1xuICAgIH1cblxuICAgIGxvZyhhdHRhY2htZW50c1swXSthdHRhY2htZW50c1sxXSlcbiAgdmFyIHEgPSBgXG4gIG11dGF0aW9uIHtcbiAgICBjcmVhdGVUYXJnZXRlZE1lc3NhZ2UoaW5wdXQ6IHtcbiAgICAgIGNvbnZlcnNhdGlvbklkOiBcIiR7c3BhY2VJZH1cIlxuICAgICAgdGFyZ2V0VXNlcklkOiBcIiR7dXNlcklkfVwiXG4gICAgICB0YXJnZXREaWFsb2dJZDogXCIke3RhcmdldERpYWxvZ0lkfVwiXG4gICAgICBhdHRhY2htZW50czogWyR7YXR0YWNobWVudHN9XVxuICAgICAgICAgICAgIFxuICAgICAgfSkge1xuICAgICAgc3VjY2Vzc2Z1bFxuICAgIH1cbiAgfVxuICBgXG4gIC8qXG4gIFtcbiAgICB7XG4gICAgICAgIHR5cGU6IENBUkQsXG4gICAgICAgIGNhcmRJbnB1dDoge1xuICAgICAgICAgICAgdHlwZTogSU5GT1JNQVRJT04sXG4gICAgICAgICAgICBpbmZvcm1hdGlvbkNhcmRJbnB1dDoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNhbXBsZSBUaXRsZVwiLFxuICAgICAgICAgICAgICAgIHN1YnRpdGxlOiBcIlNhbXBsZSBTdWJ0aXRsZVwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIFRleHRcIixcbiAgICAgICAgICAgICAgICBkYXRlOiBcIjE1MDA1NzMzMzgwMDBcIixcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIEJ1dHRvbiBUZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiBcIlNhbXBsZSBCdXR0b24gUGF5bG9hZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0qL1xuICBjb25zdCByZXEgPSBhZ2VudC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcpXG4gICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2t9YClcbiAgICAuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vZ3JhcGhxbCcpXG4gICAgLnNldCgnQWNjZXB0LUVuY29kaW5nJywgJycpXG4gICAgLnNldCgneC1ncmFwaHFsLXZpZXcnLCcgUFVCTElDLCBCRVRBJylcbiAgICAuc2VuZChxLnJlcGxhY2UoL1xccysvZywgJyAnKSk7XG5cbiAgcmV0dXJuIHByb21pc2lmeShyZXEpLnRoZW4ocmVzID0+IHtcbiAgICBsb2cocmVzLmJvZHkpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgaWYgKHJlcy5ib2R5ICYmIHJlcy5ib2R5LmVycm9ycykge1xuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdFcnJvciBleGVjdXRpbmcgR3JhcGhRTCByZXF1ZXN0Jyk7XG4gICAgICBlcnIucmVzID0gcmVzO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH0pO1xuICAvKnJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnLCB7XG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ2p3dCc6IHRvayxcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9ncmFwaHFsJyxcbiAgICAgICAgJ3gtZ3JhcGhxbC12aWV3JzogJ1BVQkxJQywgQkVUQSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keTogcVxuXG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdmYWlsZWQgZXJyOiAnICsgZXJyKVxuICAgICAgICBjb25zb2xlLmRpcihyZXMsIHsgZGVwdGg6IG51bGwgfSlcbiAgICAgICAgbG9nKCdFcnJvciBjcmVhdGluZyBkaWFsb2cgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9XG4gICk7Ki9cbn07XG5cblxuZXhwb3J0IGNvbnN0IHByb21pc2lmeSA9IChyZXEpID0+IHtcbiAgdmFyIGRlZmVycmVkID0gcS5kZWZlcigpO1xuXG4gIHJlcS5lbmQoKGVyciwgcmVzKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgPT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ1dXJ1xuICAgIGxvZyhcImZyb20gV1dcIilcbiAgICByZXR1cm47XG5cbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICAgIFwic2hhMT1cIiArIGNyZWF0ZUhtYWMoJ3NoYTEnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnRUwnXG4gICAgbG9nKFwiZ2l0aHViIGV2ZW50XCIpXG4gICAgcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG5cblxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcInRvayA6IFwiICsgdG9rZW4pXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuXG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19