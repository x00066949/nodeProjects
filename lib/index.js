/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.scrumbot = exports.slash_commands = undefined;

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

var slash_commands = /*istanbul ignore next*/exports.slash_commands = function slash_commands(appId, token) /*istanbul ignore next*/{
  return function (req, res) {

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

    //let payLoad = req.body.annotationPayload;
    //log("payload"+payLoad);

    if (req.body.type === 'message-annotation-added' /*&& req.body.annotationPayload.targetAppId === appId*/) {
        var command = JSON.parse(req.body.annotationPayload).actionId;
        //log("action id "+req.body.annotationPayload.actionId);
        log("command " + command);

        if (!command) log("no command to process");

        if (command === '/issue pipeline') {
          log("using dialog");
          dialog(req.body.spaceId, token(), req.body.userId, req.body.annotationPayload.targetDialogId, function (err, res) {
            if (!err) log('sent dialog to %s', req.body.spaceId);
          });
        }

        // message represents the message coming in from WW to be processed by the App
        var message = '@scrumbot ' + command;

        board.getScrumData({ request: req, response: res, UserInput: message }).then(function (to_post) {

          log("data got = " + to_post);

          send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
            if (!err) log('Sent message to space %s', req.body.spaceId);
          });
        }).catch(function (err) {
          log("unable to send message to space" + err);
        });
      };
  };
};

var scrumbot = /*istanbul ignore next*/exports.scrumbot = function scrumbot(appId, token) /*istanbul ignore next*/{
  return function (req, res) {
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

    //handle new messages and ignore the app's own messages
    if (req.body.type === 'message-created' && req.body.userId !== appId) {
      log('Got a message %o', req.body);
      log('content : ' + req.body.content);

      board.getScrumData({ request: req, response: res, UserInput: req.body.content }).then(function (to_post) {

        log("data got = " + to_post);

        send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
          if (!err) log('Sent message to space %s', req.body.spaceId);
        });
      }).catch(function (err) {
        log("nothing returned from getscrumdata" + err);
      });

      //console.dir(to_post, {depth:null}); 

    };
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

var dialog = function dialog(spaceId, tok, userId, dialogId, cb) {

  log("trying to build dialog boxes");

  var q = /*istanbul ignore next*/'';

  request.post('https://api.watsonwork.ibm.com/graphql', {

    headers: {
      'jwt': tok,
      'Content-Type': 'application/graphql',
      'x-graphql-view': 'PUBLIC, BETA'
    },
    json: true,
    body: 'mutation createSpace { createSpace(input: { title: "Space title",  members: [' + userId + ']}){ space { ' + spaceId + '}}'

  }, function (err, res) {
    if (err || res.statusCode !== 201) {
      log('failed err: ' + err);
      console.dir(res, { depth: null });
      log('Error creating dialog %o', err || res.statusCode);
      cb(err || new Error(res.statusCode));
      return;
    }
    log('Send result %d, %o', res.statusCode, res.body);
    cb(null, res.body);
  });
};

// Verify Watson Work request signature
var verify = /*istanbul ignore next*/exports.verify = function verify(wsecret) /*istanbul ignore next*/{
  return function (req, res, buf, encoding) {
    if (req.get('X-OUTBOUND-TOKEN') !== /*istanbul ignore next*/(0, _crypto.createHmac)('sha256', wsecret).update(buf).digest('hex')) {
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
var webapp = /*istanbul ignore next*/exports.webapp = function webapp(appId, secret, wsecret, cb) {
  // Authenticate the app and get an OAuth token
  oauth.run(appId, secret, function (err, token) {
    if (err) {
      cb(err);
      return;
    }

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
    slash_commands(appId, token)));
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
        /*rp({
           uri: 'api.github.com'
                   headers: {
            'User-Agent': 'simple_rest_app',
           },
          qs: {
            client_id: process.env.GIT_CLIENT_ID,
            client_secret: process.env.GIT_CLIENT_SECRET
          },
          json: true
        })
          .then((data) => {
            //message = data;
            response.send()
            log(data)
                     response.send(data)
          })
          .catch((err) => {
            console.log(err)
            response.send('error : '+err)
          })*/
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwiZGlhbG9nIiwic3BhY2VJZCIsInRhcmdldERpYWxvZ0lkIiwiZXJyIiwibWVzc2FnZSIsImdldFNjcnVtRGF0YSIsInJlc3BvbnNlIiwiVXNlcklucHV0IiwidGhlbiIsInRvX3Bvc3QiLCJzZW5kIiwiZm9ybWF0IiwidXNlck5hbWUiLCJjYXRjaCIsInNjcnVtYm90IiwiY29udGVudCIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsImpzb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwiZGlhbG9nSWQiLCJxIiwiZGlyIiwiZGVwdGgiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJlbnYiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInJlZGlyZWN0Iiwi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SixDQUFTVCxHQUFULEVBQWMsVUFBQzlDLEdBQUQsRUFBTXVELElBQU4sRUFBZTtBQUMzQixZQUFJdkQsR0FBSixFQUFTO0FBQ1BlLGFBQUdmLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTXdELE9BQU9WLElBQUlXLE9BQUosSUFBZSxHQUE1QjtBQUNBL0UsWUFBSSxtQ0FBSixFQUF5QzhFLElBQXpDO0FBQ0E7QUFDRCxPQVJEO0FBU0gsR0E3REg7QUE4REQsQ0FqRUQ7O0FBbUVBLElBQUlwRixRQUFRd0UsSUFBUixLQUFpQmMsTUFBckIsRUFBNkI7QUFDM0JkLE9BQUtlLFFBQVFkLElBQWIsRUFBbUJjLFFBQVFiLEdBQTNCLEVBQWdDLFVBQUM5QyxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQWixjQUFRVixHQUFSLENBQVkscUJBQVosRUFBbUNzQixHQUFuQztBQUNBO0FBQ0Q7O0FBRUR0QixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuaW1wb3J0ICogYXMgYm9hcmQgZnJvbSAnLi9zY3J1bV9ib2FyZCc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxuZXhwb3J0IGNvbnN0IHNsYXNoX2NvbW1hbmRzID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PntcblxuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gIGlmKCFyZXEpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgbG9nKHJlcS5ib2R5KTtcblxuICAvL2xldCBwYXlMb2FkID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQ7XG4gIC8vbG9nKFwicGF5bG9hZFwiK3BheUxvYWQpO1xuXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAvL2xvZyhcImFjdGlvbiBpZCBcIityZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCk7XG4gICAgbG9nKFwiY29tbWFuZCBcIitjb21tYW5kKTtcblxuICAgIGlmICghY29tbWFuZClcbiAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcbiAgICBcblxuICAgIGlmKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKXtcbiAgICAgIGxvZyhcInVzaW5nIGRpYWxvZ1wiKVxuICAgICAgZGlhbG9nKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgIHRva2VuKCksXG4gICAgICAgIHJlcS5ib2R5LnVzZXJJZCxcbiAgICAgICAgcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQudGFyZ2V0RGlhbG9nSWQsXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ3NlbnQgZGlhbG9nIHRvICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgIH1cblxuICAgICAgKVxuICAgIH1cbiAgICAgIFxuICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnK2NvbW1hbmQ7XG5cblxuICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0Om1lc3NhZ2V9KS50aGVuKCh0b19wb3N0KT0+e1xuICAgICAgXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiK3RvX3Bvc3QpO1xuXG4gICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgfSlcbiAgICB9KS5jYXRjaCgoZXJyKT0+e1xuICAgICAgbG9nKFwidW5hYmxlIHRvIHNlbmQgbWVzc2FnZSB0byBzcGFjZVwiICsgZXJyKTtcbiAgICB9KVxuICB9O1xuXG59XG5cbmV4cG9ydCBjb25zdCBzY3J1bWJvdCA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEsIHJlcykgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvL2hhbmRsZSBuZXcgbWVzc2FnZXMgYW5kIGlnbm9yZSB0aGUgYXBwJ3Mgb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1jcmVhdGVkJyAmJiByZXEuYm9keS51c2VySWQgIT09IGFwcElkKSB7XG4gICAgbG9nKCdHb3QgYSBtZXNzYWdlICVvJywgcmVxLmJvZHkpO1xuICAgIGxvZygnY29udGVudCA6ICcrcmVxLmJvZHkuY29udGVudCk7XG5cbiAgICBcblxuICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0OnJlcS5ib2R5LmNvbnRlbnR9KS50aGVuKCh0b19wb3N0KT0+e1xuXG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG5cbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7IFxuXG4gICAgXG4gIH07XG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgZGlhbG9nSWQsY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzXCIpXG5cbiAgdmFyIHEgPSBgYFxuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnLHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0Jzp0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcgLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiAnbXV0YXRpb24gY3JlYXRlU3BhY2UgeyBjcmVhdGVTcGFjZShpbnB1dDogeyB0aXRsZTogXCJTcGFjZSB0aXRsZVwiLCAgbWVtYmVyczogWycrdXNlcklkKyddfSl7IHNwYWNlIHsgJytzcGFjZUlkKyd9fSdcblxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnZmFpbGVkIGVycjogJytlcnIpXG4gICAgICAgIGNvbnNvbGUuZGlyKHJlcyx7ZGVwdGg6bnVsbH0pXG4gICAgICAgIGxvZygnRXJyb3IgY3JlYXRpbmcgZGlhbG9nICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfVxuICApO1xufTtcblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBzbGFzaF9jb21tYW5kcyhhcHBJZCwgdG9rZW4pXG4gICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuICAgICAgICAgIC8qcnAoe1xuXG4gICAgICAgICAgICB1cmk6ICdhcGkuZ2l0aHViLmNvbSdcbiAgICAgICAgXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxczoge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAvL21lc3NhZ2UgPSBkYXRhO1xuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKClcbiAgICAgICAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIFxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgICAgICAgICAgfSkqL1xuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=