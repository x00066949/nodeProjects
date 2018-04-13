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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJSZWdleCIsImJvZHlQYXJzZXIiLCJwYXRoIiwicnAiLCJyZXF1aXJlRW52IiwibG9nIiwiZXZlbnRUeXBlIiwicHJvY2Vzc19yZXF1ZXN0cyIsImFwcElkIiwidG9rZW4iLCJjYiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiUGlwZVJlZ2V4IiwiUmVnRXhwIiwidGVzdCIsIkNvbW1hbmRBcnIiLCJzcGxpdCIsInRhcmdldERpYWxvZ0lkIiwicGlwZVByb21pc2UiLCJnZXRQaXBlSWQiLCJ0aGVuIiwibmFtZUFyciIsImRpYWxvZyIsInNwYWNlSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInJlcG9faWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwiaSIsImxlbmd0aCIsImlkIiwiYXR0YWNobWVudHMiLCJpbmRleCIsInEiLCJzZXQiLCJyZXBsYWNlIiwicHJvbWlzaWZ5IiwiZGlyIiwiZGVwdGgiLCJlcnJvcnMiLCJkZWZlcnJlZCIsImRlZmVyIiwicmVqZWN0IiwicmVzb2x2ZSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUNaOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFiQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBYUEsSUFBSUcsUUFBUUYsUUFBUSxPQUFSLENBQVo7QUFDQSxJQUFJRyxhQUFhSCxRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJSSxPQUFPSixRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlLLEtBQUtMLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlNLGFBQWFOLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTyxNQUFNLDZDQUFNLHFCQUFOLENBQVo7QUFDQSxJQUFJQyxTQUFKOztBQUVPLElBQU1DLHNFQUFtQixTQUFuQkEsZ0JBQW1CLENBQUNDLEtBQUQsRUFBUUMsS0FBUixFQUFlQyxFQUFmO0FBQUEsU0FBc0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDbEVQ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T0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJaEgsUUFBUXFHLElBQVIsS0FBaUJhLE1BQXJCLEVBQTZCO0FBQzNCYixPQUFLakMsUUFBUWtDLElBQWIsRUFBbUJsQyxRQUFRQyxHQUEzQixFQUFnQyxVQUFDN0IsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUHJCLGNBQVFaLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ2lDLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRGpDLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5pbXBvcnQgcSBmcm9tICdxJztcbmltcG9ydCBhZ2VudCBmcm9tICdzdXBlcmFnZW50JztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgICB2YXIgUGlwZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc3BpcGVsaW5lKlxcc1swLTldLyk7XG4gICAgICAgIFxuICAgICAgaWYgKFBpcGVSZWdleC50ZXN0KGNvbW1hbmQpKSB7XG4gICAgICAgIHZhciBDb21tYW5kQXJyID0gY29tbWFuZC5zcGxpdCgnICcpO1xuXG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG5cbiAgICAgICAgdmFyIHBpcGVQcm9taXNlID0gZ2V0UGlwZUlkKENvbW1hbmRBcnJbMl0pO1xuXG4gICAgICAgIHBpcGVQcm9taXNlLnRoZW4oKG5hbWVBcnIpID0+e1xuICAgICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuICAgICAgICAgICAgbmFtZUFycixcbiAgXG4gIFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnc2VudCBkaWFsb2cgdG8gJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH1cbiAgXG4gICAgICAgICAgKVxuICAgICAgICB9KVxuICAgICAgXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgICAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJyArIGNvbW1hbmQ7XG5cblxuICAgICAgICBib2FyZC5nZXRTY3J1bURhdGEoeyByZXF1ZXN0OiByZXEsIHJlc3BvbnNlOiByZXMsIFVzZXJJbnB1dDogbWVzc2FnZSB9KS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgICAgICBsb2coXCJzcGFjZSBpZCBcIiArIHJlcS5ib2R5LnNwYWNlSWQpXG4gICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIiArIHRvX3Bvc3QpO1xuXG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIDogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgJ1VuYWJsZSB0byBwcm9jZXNzIGNvbW1hbmQnKSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgbG9nKFwidW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZFwiICsgZXJyKTtcbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfTtcblxuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ0VMJykge1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIGxvZyhcIkVMIHRva2VuIDogXCIgKyBvYXV0aC5vVG9rZW4oKSlcblxuICAgIC8vdmFyIHRva3MgPSBvYXV0aC5vVG9rZW47XG4gICAgbG9nKFwiIDAwMiA6IFwiICsgZXZlbnRUeXBlKVxuXG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZyhcIlByb2Nlc3NpbmcgZ2l0aHViIGV2ZW50XCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IGV2ZW50cy5wYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgIHByb21pc2UudGhlbigodG9fcG9zdCkgPT4ge1xuXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQoJzVhMDliMjM0ZTRiMDkwYmNkN2ZjZjNiMicsXG5cbiAgICAgICAgdG9fcG9zdCxcbiAgICAgICAgb2F1dGgub1Rva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vcmV0dXJuO1xuXG4gIH0gZWxzZSB7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuXG4gIH1cblxuXG5cbn1cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIC8vdGV4dCA6ICdIZWxsbyBcXG4gV29ybGQgJyxcbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuLy9cbmNvbnN0IGdldFBpcGVJZCA9IChyZXBvX2lkKT0+e1xuICBcbiAgLy9nZXQgbGFuZXNcbiAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgfSxcblxuICAgIGpzb246IHRydWVcbiAgfTtcbiAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG52YXIgbmFtZUFyciA9IFtdO1xuICAgICAgbG9nKGRhdGEpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aCoyOyBpPWkrMikge1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICAvL2lmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpIHtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIG5hbWVBcnJbaV0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lO1xuICAgICAgICAgIG5hbWVBcnJbaSsxXSA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuXG4gICAgICAgICAgbG9nKG5hbWVBcnJbaV0gK1wiICwgXCIrbmFtZUFycltpKzFdKVxuICAgICAgICAvL31cbiAgICAgIH1cbiAgICAgIHJldHVybiBuYW1lQXJyO1xuXG4gICAgICAvL2xvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIgKyBlcnIpXG4gICAgICByZXR1cm4gZXJyO1xuICAgIH0pXG59XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIHRhcmdldERpYWxvZ0lkLG5hbWVBcnIsIGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlcyA6IFwiICsgdGFyZ2V0RGlhbG9nSWQpXG5cblxuXG4gICAgbG9nKG5hbWVBcnIpXG5cblxuICAgIHZhciBhdHRhY2htZW50cztcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGZvcih2YXIgaT0wOyBpPG5hbWVBcnIubGVuZ3RoOyBpPWkrMil7XG4gICAgIGF0dGFjaG1lbnRzW2luZGV4XSA9IGBcbiAgICAge1xuICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICBjYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCIke25hbWVBcnJbaV19XCIsXG4gICAgICAgICAgICAgICAgc3VidGl0bGU6IFwiU2FtcGxlIFN1YnRpdGxlXCIsXG4gICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgVGV4dFwiLFxuICAgICAgICAgICAgICAgIGRhdGU6IFwiMTUwMDU3MzMzODAwMFwiLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgQnV0dG9uIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IFwiJHtuYW1lQXJyW2krMV19XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogUFJJTUFSWVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfWBcbiAgICBpbmRleCsrO1xuICAgIH1cblxuICAgIGxvZyhhdHRhY2htZW50c1swXSthdHRhY2htZW50c1sxXSlcbiAgdmFyIHEgPSBgXG4gIG11dGF0aW9uIHtcbiAgICBjcmVhdGVUYXJnZXRlZE1lc3NhZ2UoaW5wdXQ6IHtcbiAgICAgIGNvbnZlcnNhdGlvbklkOiBcIiR7c3BhY2VJZH1cIlxuICAgICAgdGFyZ2V0VXNlcklkOiBcIiR7dXNlcklkfVwiXG4gICAgICB0YXJnZXREaWFsb2dJZDogXCIke3RhcmdldERpYWxvZ0lkfVwiXG4gICAgICBhdHRhY2htZW50czogW1xuICAgICAge1xuICAgICAgICAgIHR5cGU6IENBUkQsXG4gICAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICAgIHR5cGU6IElORk9STUFUSU9OLFxuICAgICAgICAgICAgICBpbmZvcm1hdGlvbkNhcmRJbnB1dDoge1xuICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiU2FtcGxlIFRpdGxlXCIsXG4gICAgICAgICAgICAgICAgICBzdWJ0aXRsZTogXCJTYW1wbGUgU3VidGl0bGVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIFRleHRcIixcbiAgICAgICAgICAgICAgICAgIGRhdGU6IFwiMTUwMDU3MzMzODAwMFwiLFxuICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTYW1wbGUgQnV0dG9uIFRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogXCJTYW1wbGUgQnV0dG9uIFBheWxvYWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFBSSU1BUllcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICBdXG4gICAgICB9KSB7XG4gICAgICBzdWNjZXNzZnVsXG4gICAgfVxuICB9XG4gIGBcbiAgY29uc3QgcmVxID0gYWdlbnQucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnKVxuICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rfWApXG4gICAgLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2dyYXBocWwnKVxuICAgIC5zZXQoJ0FjY2VwdC1FbmNvZGluZycsICcnKVxuICAgIC5zZXQoJ3gtZ3JhcGhxbC12aWV3JywnIFBVQkxJQywgQkVUQScpXG4gICAgLnNlbmQocS5yZXBsYWNlKC9cXHMrL2csICcgJykpO1xuXG4gIHJldHVybiBwcm9taXNpZnkocmVxKS50aGVuKHJlcyA9PiB7XG4gICAgbG9nKHJlcy5ib2R5KVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5lcnJvcnMpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignRXJyb3IgZXhlY3V0aW5nIEdyYXBoUUwgcmVxdWVzdCcpO1xuICAgICAgZXJyLnJlcyA9IHJlcztcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbiAgLypyZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJywge1xuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdqd3QnOiB0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcsXG4gICAgICAgICd4LWdyYXBocWwtdmlldyc6ICdQVUJMSUMsIEJFVEEnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHFcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJyArIGVycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApOyovXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwcm9taXNpZnkgPSAocmVxKSA9PiB7XG4gIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcblxuICByZXEuZW5kKChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdXVydcbiAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgcmV0dXJuO1xuXG4gIH1cblxuICBlbHNlIGlmIChyZXEuZ2V0KCdYLUhVQi1TSUdOQVRVUkUnKSA9PT1cbiAgICBcInNoYTE9XCIgKyBjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuXG4gICAgZXZlbnRUeXBlID0gJ0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9IGVsc2Uge1xuICAgIGxvZyhcIk5vdCBldmVudCBmcm9tIFdXIG9yIGdpdGh1YlwiKVxuICAgIGNvbnNvbGUuZGlyKHJlcSwgeyBkZXB0aDogbnVsbCB9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG5cbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcblxuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYiwgZXZlbnRUeXBlKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coXCJ0b2sgOiBcIiArIHRva2VuKVxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBwcm9jZXNzX3JlcXVlc3RzKGFwcElkLCB0b2tlbilcblxuICAgICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnJlZGlyZWN0KCdodHRwOi8vd29ya3NwYWNlLmlibS5jb20nKTtcblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==