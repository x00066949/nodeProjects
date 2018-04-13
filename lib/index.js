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
  var q = /*istanbul ignore next*/'\n  mutation {\n    createTargetedMessage(input: {\n      conversationId: "' + spaceId + '"\n      targetUserId: "' + userId + '"\n      targetDialogId: "' + targetDialogId + '"\n      attachments: [' + attachments + ']\n              }\n          }\n      }\n      ]\n      }) {\n      successful\n    }\n  }\n  ';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwibmFtZUluZHgiLCJpIiwibGVuZ3RoIiwiaWQiLCJhdHRhY2htZW50cyIsImluZGV4IiwicSIsInNldCIsInJlcGxhY2UiLCJwcm9taXNpZnkiLCJkaXIiLCJkZXB0aCIsImVycm9ycyIsImRlZmVycmVkIiwiZGVmZXIiLCJyZWplY3QiLCJyZXNvbHZlIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJyZWRpcmVjdCIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLE07O0FBQ1o7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OztBQWJBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFhQSxJQUFJRyxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFBQWFILFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlJLE9BQU9KLFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUssS0FBS0wsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSU0sYUFBYU4sUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1PLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjtBQUNBLElBQUlDLFNBQUo7O0FBRU8sSUFBTUMsc0VBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSLEVBQWVDLEVBQWY7QUFBQSxTQUFzQixVQUFDQyxHQUFELEVBQU1DLEdBQU4s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QUFDRCxZQUFNeUUsT0FBTzVDLElBQUk2QyxPQUFKLElBQWUsR0FBNUI7QUFDQTNHLFlBQUksbUNBQUosRUFBeUMwRyxJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJakgsUUFBUXNHLElBQVIsS0FBaUJhLE1BQXJCLEVBQTZCO0FBQzNCYixPQUFLbEMsUUFBUW1DLElBQWIsRUFBbUJuQyxRQUFRQyxHQUEzQixFQUFnQyxVQUFDN0IsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUHJCLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ2lDLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRGpDLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5pbXBvcnQgcSBmcm9tICdxJztcbmltcG9ydCBhZ2VudCBmcm9tICdzdXBlcmFnZW50JztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgICB2YXIgUGlwZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc3BpcGVsaW5lKlxcc1swLTldLyk7XG4gICAgICAgIFxuICAgICAgaWYgKFBpcGVSZWdleC50ZXN0KGNvbW1hbmQpKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gY29tbWFuZC5zcGxpdCgnICcpO1xuXG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG5cbiAgICAgICAgdmFyIHBpcGVQcm9taXNlID0gZ2V0UGlwZUlkKENvbW1hbmRBcnJbMl0pO1xuXG4gICAgICAgIHBpcGVQcm9taXNlLnRoZW4oKG5hbWVBcnIpID0+e1xuICAgICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICAgICAgbmFtZUFycixcbiAgXG4gIFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnc2VudCBkaWFsb2cgdG8gJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH1cbiAgXG4gICAgICAgICAgKVxuICAgICAgICB9KVxuICAgICAgXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG5cblxuICAgICAgICBib2FyZC5nZXRTY3J1bURhdGEoeyByZXF1ZXN0OiByZXEsIHJlc3BvbnNlOiByZXMsIFVzZXJJbnB1dDogbWVzc2FnZSB9KS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgICAgICBsb2coXCJzcGFjZSBpZCBcIiArIHJlcS5ib2R5LnNwYWNlSWQpXG4gICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgJ1VuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmQnKSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgbG9nKFwidW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZFwiICsgZXJyKTtcbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfTtcblxuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ0VMJykge1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIGxvZyhcIkVMIHRva2VuIDogXCIgKyBvYXV0aC5vVG9rZW4oKSlcblxuICAgIC8vdmFyIHRva3MgPSBvYXV0aC5vVG9rZW47XG4gICAgbG9nKFwiIDAwMiA6IFwiICsgZXZlbnRUeXBlKVxuXG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3NpbmcgZ2l0aHViIGV2ZW50XCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IGV2ZW50cy5wYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgIHByb21pc2UudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQoJzVhMDliMjM0ZTRiMDkwYmNkN2ZjZjNiMicsXG5cbiAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuXG4gIH1cblxuXG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIC8vdGV4dCA6ICdIZWxsbyBcXG4gV29ybGQgJyxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuLy9cbmNvbnN0IGdldFBpcGVJZCA9IChyZXBvX2lkKT0+e1xuICBcbiAgLy9nZXQgbGFuZXNcbiAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgfSxcblxuICAgIGpzb246IHRydWVcbiAgfTtcbiAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG52YXIgbmFtZUFyciA9IFtdO1xudmFyIG5hbWVJbmR4PTA7XG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgLy9pZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKSB7XG4gICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIiArIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICBuYW1lQXJyW25hbWVJbmR4XSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWU7XG4gICAgICAgICAgbmFtZUFycltuYW1lSW5keCsxXSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuXG4gICAgICAgICAgbG9nKG5hbWVBcnJbbmFtZUluZHhdICtcIiAsIFwiK25hbWVBcnJbbmFtZUluZHgrMV0pXG4gICAgICAgICAgbmFtZUluZHggPSBuYW1lSW5keCsyO1xuXG4gICAgICAgIC8vfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5hbWVBcnI7XG5cbiAgICAgIC8vbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIiArIGVycilcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfSlcbn1cblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgdGFyZ2V0RGlhbG9nSWQsbmFtZUFyciwgY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzIDogXCIgKyB0YXJnZXREaWFsb2dJZClcblxuXG5cbiAgICBsb2cobmFtZUFycilcblxuXG4gICAgdmFyIGF0dGFjaG1lbnRzID0gW107XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBmb3IodmFyIGk9MDsgaTxuYW1lQXJyLmxlbmd0aDsgaT1pKzIpe1xuICAgICBhdHRhY2htZW50c1tpbmRleF0gPSBgXG4gICAgIHtcbiAgICAgICAgdHlwZTogQ0FSRCxcbiAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBJTkZPUk1BVElPTixcbiAgICAgICAgICAgIGluZm9ybWF0aW9uQ2FyZElucHV0OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiJHtuYW1lQXJyW2ldfVwiLFxuICAgICAgICAgICAgICAgIHN1YnRpdGxlOiBcIlNhbXBsZSBTdWJ0aXRsZVwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIFRleHRcIixcbiAgICAgICAgICAgICAgICBkYXRlOiBcIjE1MDA1NzMzMzgwMDBcIixcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIEJ1dHRvbiBUZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiBcIiR7bmFtZUFycltpKzFdfVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1gXG4gICAgaW5kZXgrKztcbiAgICB9XG5cbiAgICBsb2coYXR0YWNobWVudHNbMF0rYXR0YWNobWVudHNbMV0pXG4gIHZhciBxID0gYFxuICBtdXRhdGlvbiB7XG4gICAgY3JlYXRlVGFyZ2V0ZWRNZXNzYWdlKGlucHV0OiB7XG4gICAgICBjb252ZXJzYXRpb25JZDogXCIke3NwYWNlSWR9XCJcbiAgICAgIHRhcmdldFVzZXJJZDogXCIke3VzZXJJZH1cIlxuICAgICAgdGFyZ2V0RGlhbG9nSWQ6IFwiJHt0YXJnZXREaWFsb2dJZH1cIlxuICAgICAgYXR0YWNobWVudHM6IFske2F0dGFjaG1lbnRzfV1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF1cbiAgICAgIH0pIHtcbiAgICAgIHN1Y2Nlc3NmdWxcbiAgICB9XG4gIH1cbiAgYFxuICAvKlxuICBbXG4gICAge1xuICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTYW1wbGUgVGl0bGVcIixcbiAgICAgICAgICAgICAgICBzdWJ0aXRsZTogXCJTYW1wbGUgU3VidGl0bGVcIixcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBUZXh0XCIsXG4gICAgICAgICAgICAgICAgZGF0ZTogXCIxNTAwNTczMzM4MDAwXCIsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBCdXR0b24gVGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCJTYW1wbGUgQnV0dG9uIFBheWxvYWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBQUklNQVJZXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdKi9cbiAgY29uc3QgcmVxID0gYWdlbnQucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnKVxuICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rfWApXG4gICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2dyYXBocWwnKVxuICAgIC5zZXQoJ0FjY2VwdC1FbmNvZGluZycsICcnKVxuICAgIC5zZXQoJ3gtZ3JhcGhxbC12aWV3JywnIFBVQkxJQywgQkVUQScpXG4gICAgLnNlbmQocS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuXG4gIHJldHVybiBwcm9taXNpZnkocmVxKS50aGVuKHJlcyA9PiB7XG4gICAgbG9nKHJlcy5ib2R5KVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5lcnJvcnMpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignRXJyb3IgZXhlY3V0aW5nIEdyYXBoUUwgcmVxdWVzdCcpO1xuICAgICAgZXJyLnJlcyA9IHJlcztcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbiAgLypyZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJywge1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOiB0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHFcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJyArIGVycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApOyovXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKSA9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==