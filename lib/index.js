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

    if (req.body.type === 'message-annotation-added' && req.body.annotationPayload.targetAppId === appId) {
      var command = JSON.parse(req.body.annotationPayload).actionId;
      //log("action id "+req.body.annotationPayload.actionId);
      log("command " + command);

      if (!command) log("no command to process");

      // message represents the message coming in from WW to be processed by the App
      var message = '@scrumbot ' + command;

      board.getScrumData({ request: req, response: res, UserInput: message }).then(function (to_post) {

        log("data got = " + to_post);

        send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
          if (!err) log('Sent message to space %s', req.body.spaceId);
        });
      }).catch(function (err) {
        log("nothing returned from getscrumdata" + err);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImFubm90YXRpb25QYXlsb2FkIiwidGFyZ2V0QXBwSWQiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYWN0aW9uSWQiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0aGVuIiwidG9fcG9zdCIsInNlbmQiLCJzcGFjZUlkIiwiZm9ybWF0IiwidXNlck5hbWUiLCJlcnIiLCJjYXRjaCIsInNjcnVtYm90IiwiY29udGVudCIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsImpzb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiZW52IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJyZWRpcmVjdCIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSIsInBy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Q0Q7QUFDRCxZQUFNMkMsT0FBT1YsSUFBSVcsT0FBSixJQUFlLEdBQTVCO0FBQ0ExRSxZQUFJLG1DQUFKLEVBQXlDeUUsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQTdESDtBQThERCxDQWpFRDs7QUFtRUEsSUFBSS9FLFFBQVFtRSxJQUFSLEtBQWlCYyxNQUFyQixFQUE2QjtBQUMzQmQsT0FBS2UsUUFBUWQsSUFBYixFQUFtQmMsUUFBUWIsR0FBM0IsRUFBZ0MsVUFBQ2pDLEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1BwQixjQUFRVixHQUFSLENBQVkscUJBQVosRUFBbUM4QixHQUFuQztBQUNBO0FBQ0Q7O0FBRUQ5QixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuaW1wb3J0ICogYXMgYm9hcmQgZnJvbSAnLi9zY3J1bV9ib2FyZCc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxuZXhwb3J0IGNvbnN0IHNsYXNoX2NvbW1hbmRzID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PntcblxuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbG9nKFwiUHJvY2Vzc2luZyBzbGFzaCBjb21tYW5kXCIpO1xuXG4gIGlmKCFyZXEpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG5cbiAgbG9nKHJlcS5ib2R5KTtcblxuICAvL2xldCBwYXlMb2FkID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQ7XG4gIC8vbG9nKFwicGF5bG9hZFwiK3BheUxvYWQpO1xuXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAmJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQpIHtcbiAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICBsb2coXCJjb21tYW5kIFwiK2NvbW1hbmQpO1xuXG4gICAgaWYgKCFjb21tYW5kKVxuICAgICAgbG9nKFwibm8gY29tbWFuZCB0byBwcm9jZXNzXCIpO1xuICAgIFxuICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnK2NvbW1hbmQ7XG5cbiAgICBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDptZXNzYWdlfSkudGhlbigodG9fcG9zdCk9PntcbiAgICAgIFxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcblxuICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgIHRva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgIH0pXG4gICAgfSkuY2F0Y2goKGVycik9PntcbiAgICAgIGxvZyhcIm5vdGhpbmcgcmV0dXJuZWQgZnJvbSBnZXRzY3J1bWRhdGFcIiArIGVycik7XG4gICAgfSlcbiAgfTtcblxufVxuXG5leHBvcnQgY29uc3Qgc2NydW1ib3QgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy9oYW5kbGUgbmV3IG1lc3NhZ2VzIGFuZCBpZ25vcmUgdGhlIGFwcCdzIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtY3JlYXRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSBhcHBJZCkge1xuICAgIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgICBsb2coJ2NvbnRlbnQgOiAnK3JlcS5ib2R5LmNvbnRlbnQpO1xuXG4gICAgYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6cmVxLmJvZHkuY29udGVudH0pLnRoZW4oKHRvX3Bvc3QpPT57XG5cblxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcblxuICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgIHRva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgIH0pXG4gICAgfSkuY2F0Y2goKGVycik9PntcbiAgICAgIGxvZyhcIm5vdGhpbmcgcmV0dXJuZWQgZnJvbSBnZXRzY3J1bWRhdGFcIiArIGVycik7XG4gICAgfSlcblxuICAgIC8vY29uc29sZS5kaXIodG9fcG9zdCwge2RlcHRoOm51bGx9KTsgXG5cbiAgICBcbiAgfTtcbn07XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgIT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYikgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHNsYXNoX2NvbW1hbmRzKGFwcElkLCB0b2tlbilcbiAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICByZXNwb25zZS5yZWRpcmVjdCgnaHR0cDovL3dvcmtzcGFjZS5pYm0uY29tJyk7XG4gICAgICAgICAgLypycCh7XG5cbiAgICAgICAgICAgIHVyaTogJ2FwaS5naXRodWIuY29tJ1xuICAgICAgICBcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgIC8vbWVzc2FnZSA9IGRhdGE7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoKVxuICAgICAgICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgICAgICAgICB9KSovXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==