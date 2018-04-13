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

          if (command === '/issue pipeline') {
            log("using dialog : " + JSON.parse(req.body.annotationPayload).targetDialogId);
            dialog(req.body.spaceId, token(), req.body.userId, JSON.parse(req.body.annotationPayload).targetDialogId, function (err, res) {
              if (!err) log('sent dialog to %s', req.body.spaceId);
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

//dialog boxes
var dialog = function dialog(spaceId, tok, userId, targetDialogId, cb) {

  log("trying to build dialog boxes : " + targetDialogId);

  var nameArr;
  var idArr;
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
    for (var i = 0; i < data['pipelines'].length; i++) {
      log("checking");
      //if (data['pipelines'][i].name === PipelineName) {
      log("found pipeline id : " + data['pipelines'][i].id);
      nameArr[i] = data['pipelines'][i].name;
      idArr[i] = data['pipelines'][i].id;

      log(nameArr[i] + " , " + idArr[i]);
      //}
    }

    //log("did not find id corresponding to pipe name");
  }).catch(function (err) {
    console.log("error = " + err);
    return err;
  });

  log(idArr);

  var attachments;
  for (var i = 0; i < nameArr.length; i++) {
    /*istanbul ignore next*/'{\n        type: CARD,\n        cardInput: {\n            type: INFORMATION,\n            informationCardInput: {\n                title: "' + nameArr[i] + '",\n                subtitle: "Sample Subtitle",\n                text: "Sample Text",\n                date: "1500573338000",\n                buttons: [\n                    {\n                        text: "Sample Button Text",\n                        payload: "' + idArr[i] + '",\n                        style: PRIMARY\n                    }\n                ]\n            }\n        }\n    }';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsInRhcmdldERpYWxvZ0lkIiwiZGlhbG9nIiwic3BhY2VJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJvVG9rZW4iLCJwcm9taXNlIiwicGFyc2VSZXNwb25zZSIsInRleHQiLCJ0b2siLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsIm5hbWVBcnIiLCJpZEFyciIsInBpcGVsaW5lSWRSZXF1ZXN0IiwidXJpIiwicmVwb19pZCIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJkYXRhIiwiaSIsImxlbmd0aCIsImlkIiwiYXR0YWNobWVudHMiLCJxIiwic2V0IiwicmVwbGFjZSIsInByb21pc2lmeSIsImRpciIsImRlcHRoIiwiZXJyb3JzIiwiZGVmZXJyZWQiLCJkZWZlciIsInJlamVjdCIsInJlc29sdmUiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFDWjs7OztBQUNBOzs7O0FBRUE7Ozs7Ozs7O0FBZEEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQWNBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1NLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjtBQUNBLElBQUlDLFNBQUo7O0FBRU8sSUFBTUMsc0VBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSLEVBQWVDLEVBQWY7QUFBQSxTQUFzQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYztBQUNsRVAsUUFBSSxZQUFZQyxTQUFoQjtBQUNBO0FBQ0FELFFBQUksWUFBWUcsS0FBaEI7O0FBR0EsUUFBSUYsY0FBYyxJQUFsQixFQUF3QjtBQUN0QjtBQUNBO0FBQ0FNLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVB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LElBQUlvQyxJQUFsQyxFQUF3Q3ZGLEVBQXhDOztBQUVBO0FBQ0FWLFVBQUltRixHQUFKLENBQVEsR0FBUixFQUFhLFVBQVU3RixPQUFWLEVBQW1CMEMsUUFBbkIsRUFBNkI7QUFDeENBLGlCQUFTb0UsUUFBVCxDQUFrQiwwQkFBbEI7QUFFRCxPQUhEO0FBT0QsS0FiRDtBQWdCRTtBQUNBQyxVQUFJQyxJQUFKLENBQVN6QyxHQUFULEVBQWMsVUFBQ2hDLEdBQUQsRUFBTXlFLElBQU4sRUFBZTtBQUMzQixZQUFJekUsR0FBSixFQUFTO0FBQ1BuQixhQUFHbUIsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNMEUsT0FBTzFDLElBQUkyQyxPQUFKLElBQWUsR0FBNUI7QUFDQW5HLFlBQUksbUNBQUosRUFBeUNrRyxJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBckNIO0FBc0NELENBekNEOztBQTJDQSxJQUFJeEcsUUFBUTZGLElBQVIsS0FBaUJhLE1BQXJCLEVBQTZCO0FBQzNCYixPQUFLaEMsUUFBUWlDLElBQWIsRUFBbUJqQyxRQUFRQyxHQUEzQixFQUFnQyxVQUFDaEMsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUFosY0FBUVosR0FBUixDQUFZLHFCQUFaLEVBQW1Dd0IsR0FBbkM7QUFDQTtBQUNEOztBQUVEeEIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcbmltcG9ydCBxIGZyb20gJ3EnO1xuaW1wb3J0IGFnZW50IGZyb20gJ3N1cGVyYWdlbnQnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG52YXIgZXZlbnRUeXBlO1xuXG5leHBvcnQgY29uc3QgcHJvY2Vzc19yZXF1ZXN0cyA9IChhcHBJZCwgdG9rZW4sIGNiKSA9PiAocmVxLCByZXMpID0+IHtcbiAgbG9nKFwiIDAwMSA6IFwiICsgZXZlbnRUeXBlKVxuICAvL2xvZyhcInRva2VuIDogXCIrdG9rZW4pXG4gIGxvZyhcImFwcCBpZCBcIiArIGFwcElkKVxuXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJykge1xuICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgIHJldHVybjtcblxuICAgIH1cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gICAgaWYgKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgIGxvZyhcImNvbW1hbmQgXCIgKyBjb21tYW5kKTtcblxuICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG5cblxuICAgICAgaWYgKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKSB7XG4gICAgICAgIGxvZyhcInVzaW5nIGRpYWxvZyA6IFwiICsgSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkudGFyZ2V0RGlhbG9nSWQpXG4gICAgICAgIGRpYWxvZyhyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgIEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLnRhcmdldERpYWxvZ0lkLFxuXG5cbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnICsgY29tbWFuZDtcblxuXG4gICAgICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7IHJlcXVlc3Q6IHJlcSwgcmVzcG9uc2U6IHJlcywgVXNlcklucHV0OiBtZXNzYWdlIH0pLnRoZW4oKHRvX3Bvc3QpID0+IHtcblxuICAgICAgICAgIGxvZyhcInNwYWNlIGlkIFwiICsgcmVxLmJvZHkuc3BhY2VJZClcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiICsgdG9fcG9zdCk7XG5cbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCAnVW5hYmxlIHRvIHByb2Nlc3MgY29tbWFuZCcpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gcHJvY2VzcyBjb21tYW5kXCIgKyBlcnIpO1xuICAgICAgICB9KVxuXG4gICAgICB9XG5cbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSAnRUwnKSB7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgbG9nKFwiRUwgdG9rZW4gOiBcIiArIG9hdXRoLm9Ub2tlbigpKVxuXG4gICAgLy92YXIgdG9rcyA9IG9hdXRoLm9Ub2tlbjtcbiAgICBsb2coXCIgMDAyIDogXCIgKyBldmVudFR5cGUpXG5cbiAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgbG9nKHJlcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG5cbiAgICBpZiAoIXJlcSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciBwcm9taXNlID0gZXZlbnRzLnBhcnNlUmVzcG9uc2UocmVxLCByZXMpXG4gICAgcHJvbWlzZS50aGVuKCh0b19wb3N0KSA9PiB7XG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIgKyB0b19wb3N0KTtcblxuICAgICAgc2VuZCgnNWEwOWIyMzRlNGIwOTBiY2Q3ZmNmM2IyJyxcblxuICAgICAgICB0b19wb3N0LFxuICAgICAgICBvYXV0aC5vVG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy9yZXR1cm47XG5cbiAgfSBlbHNlIHtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG5cbiAgfVxuXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIHRhcmdldERpYWxvZ0lkLCBjYikgPT4ge1xuXG4gIGxvZyhcInRyeWluZyB0byBidWlsZCBkaWFsb2cgYm94ZXMgOiBcIiArIHRhcmdldERpYWxvZ0lkKVxuXG4gIHZhciBuYW1lQXJyO1xuICB2YXIgaWRBcnI7XG4gIC8vZ2V0IGxhbmVzXG4gIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgIH0sXG5cbiAgICBqc29uOiB0cnVlXG4gIH07XG4gIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgIGxvZyhkYXRhKVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICAvL2lmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpIHtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIG5hbWVBcnJbaV0gPSBkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lO1xuICAgICAgICAgIGlkQXJyW2ldID0gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG5cbiAgICAgICAgICBsb2cobmFtZUFycltpXSArXCIgLCBcIitpZEFycltpXSlcbiAgICAgICAgLy99XG4gICAgICB9XG5cbiAgICAgIC8vbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIiArIGVycilcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfSlcblxuICAgIGxvZyhpZEFycilcblxuXG4gICAgdmFyIGF0dGFjaG1lbnRzO1xuICAgIGZvcih2YXIgaT0wOyBpPG5hbWVBcnIubGVuZ3RoOyBpKyspe1xuICAgICAgYHtcbiAgICAgICAgdHlwZTogQ0FSRCxcbiAgICAgICAgY2FyZElucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBJTkZPUk1BVElPTixcbiAgICAgICAgICAgIGluZm9ybWF0aW9uQ2FyZElucHV0OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiJHtuYW1lQXJyW2ldfVwiLFxuICAgICAgICAgICAgICAgIHN1YnRpdGxlOiBcIlNhbXBsZSBTdWJ0aXRsZVwiLFxuICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIFRleHRcIixcbiAgICAgICAgICAgICAgICBkYXRlOiBcIjE1MDA1NzMzMzgwMDBcIixcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIEJ1dHRvbiBUZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiBcIiR7aWRBcnJbaV19XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogUFJJTUFSWVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfWBcbiAgICB9XG5cbiAgICBsb2coYXR0YWNobWVudHNbMF0rYXR0YWNobWVudHNbMV0pXG4gIHZhciBxID0gYFxuICBtdXRhdGlvbiB7XG4gICAgY3JlYXRlVGFyZ2V0ZWRNZXNzYWdlKGlucHV0OiB7XG4gICAgICBjb252ZXJzYXRpb25JZDogXCIke3NwYWNlSWR9XCJcbiAgICAgIHRhcmdldFVzZXJJZDogXCIke3VzZXJJZH1cIlxuICAgICAgdGFyZ2V0RGlhbG9nSWQ6IFwiJHt0YXJnZXREaWFsb2dJZH1cIlxuICAgICAgYXR0YWNobWVudHM6IFtcbiAgICAgIHtcbiAgICAgICAgICB0eXBlOiBDQVJELFxuICAgICAgICAgIGNhcmRJbnB1dDoge1xuICAgICAgICAgICAgICB0eXBlOiBJTkZPUk1BVElPTixcbiAgICAgICAgICAgICAgaW5mb3JtYXRpb25DYXJkSW5wdXQ6IHtcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNhbXBsZSBUaXRsZVwiLFxuICAgICAgICAgICAgICAgICAgc3VidGl0bGU6IFwiU2FtcGxlIFN1YnRpdGxlXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBcIlNhbXBsZSBUZXh0XCIsXG4gICAgICAgICAgICAgICAgICBkYXRlOiBcIjE1MDA1NzMzMzgwMDBcIixcbiAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiU2FtcGxlIEJ1dHRvbiBUZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IFwiU2FtcGxlIEJ1dHRvbiBQYXlsb2FkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBQUklNQVJZXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgXVxuICAgICAgfSkge1xuICAgICAgc3VjY2Vzc2Z1bFxuICAgIH1cbiAgfVxuICBgXG4gIGNvbnN0IHJlcSA9IGFnZW50LnBvc3QoJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJylcbiAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3Rva31gKVxuICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9ncmFwaHFsJylcbiAgICAuc2V0KCdBY2NlcHQtRW5jb2RpbmcnLCAnJylcbiAgICAuc2V0KCd4LWdyYXBocWwtdmlldycsJyBQVUJMSUMsIEJFVEEnKVxuICAgIC5zZW5kKHEucmVwbGFjZSgvXFxzKy9nLCAnICcpKTtcblxuICByZXR1cm4gcHJvbWlzaWZ5KHJlcSkudGhlbihyZXMgPT4ge1xuICAgIGxvZyhyZXMuYm9keSlcbiAgICBjb25zb2xlLmRpcihyZXEsIHsgZGVwdGg6IG51bGwgfSlcbiAgICBpZiAocmVzLmJvZHkgJiYgcmVzLmJvZHkuZXJyb3JzKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0Vycm9yIGV4ZWN1dGluZyBHcmFwaFFMIHJlcXVlc3QnKTtcbiAgICAgIGVyci5yZXMgPSByZXM7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfSk7XG4gIC8qcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vZ3JhcGhxbCcsIHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0JzogdG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBxXG5cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ2ZhaWxlZCBlcnI6ICcgKyBlcnIpXG4gICAgICAgIGNvbnNvbGUuZGlyKHJlcywgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgICBsb2coJ0Vycm9yIGNyZWF0aW5nIGRpYWxvZyAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH1cbiAgKTsqL1xufTtcblxuXG5leHBvcnQgY29uc3QgcHJvbWlzaWZ5ID0gKHJlcSkgPT4ge1xuICB2YXIgZGVmZXJyZWQgPSBxLmRlZmVyKCk7XG5cbiAgcmVxLmVuZCgoZXJyLCByZXMpID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG5cbiAgICBldmVudFR5cGUgPSAnV1cnXG4gICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgIHJldHVybjtcblxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gICAgXCJzaGExPVwiICsgY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcblxuICAgIGV2ZW50VHlwZSA9ICdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfSBlbHNlIHtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEsIHsgZGVwdGg6IG51bGwgfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKFwidG9rIDogXCIgKyB0b2tlbilcbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIC8vc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuXG4gICAgICAvL2hhbmRsZSBzbGFzaCBjb21tYW5kc1xuICAgICAgcHJvY2Vzc19yZXF1ZXN0cyhhcHBJZCwgdG9rZW4pXG5cbiAgICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICByZXNwb25zZS5yZWRpcmVjdCgnaHR0cDovL3dvcmtzcGFjZS5pYm0uY29tJyk7XG5cbiAgICAgICAgfSk7XG5cblxuXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=