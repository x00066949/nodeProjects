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
    toscana - aip - nlc - consumer - client - id;
    if (req.body.type === 'message-annotation-added' && req.body.userId !== 'toscana-aip-nlc-consumer-client-id') {
      var command = JSON.parse(req.body.annotationPayload).actionId;
      //log("action id "+req.body.annotationPayload.actionId);
      log("command " + command);

      if (!command) log("no command to process");

      // message represents the message coming in from WW to be processed by the App
      var _message = '@scrumbot ' + command;

      board.getScrumData({ request: req, response: res, UserInput: _message }).then(function (to_post) {

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
        rp({
          uri: 'https://api.github.com/user/repos',

          headers: {
            'User-Agent': 'simple_rest_app'

          },
          qs: {
            client_id: process.env.GIT_CLIENT_ID,
            client_secret: process.env.GIT_CLIENT_SECRET
          },
          json: true
        }).then(function (data) {
          message = data;
          log(data);

          response.send(data);
        }).catch(function (err) {
          console.log(err);
          response.send('error : ' + err);
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidG9zY2FuYSIsImFpcCIsIm5sYyIsImNvbnN1bWVyIiwiY2xpZW50IiwiaWQiLCJ0eXBlIiwiY29tbWFuZCIsIkpTT04iLCJwYXJzZSIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0aGVuIiwidG9fcG9zdCIsInNlbmQiLCJzcGFjZUlkIiwiZm9ybWF0IiwidXNlck5hbWUiLCJlcnIiLCJjYXRjaCIsInNjcnVtYm90IiwiY29udGVudCIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsImpzb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiZW52IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJ1cmkiLCJxcyIsImNsaWVudF9pZCIsInByb2Nlc3MiLCJHSVRfQ0xJRU5UX0lEIiwiY2xpZW50X3NlY3JldCIsIkdJVF9DTElFTlRfU0VDUkVUIiwiZGF0YSIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFFWjs7Ozs7Ozs7QUFYQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBV0EsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVPLElBQU1DLGtFQUFpQixTQUFqQkEsY0FBaUIsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSO0FBQUEsU0FBa0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWE7O0FBRTNEO0FBQ0E7QUFDQUEsUUFBSUMsTUFBSixDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCOztBQUVDO0FBQ0Q7QUFDQSxRQUFJSCxJQUFJSSxJQUFKLENBQVNDLE1BQVQsS0FBb0JQLEtBQXhCLEVBQStCO0FBQzdCUSxjQUFRVixHQUFSLENBQVksVUFBWixFQUF3QkksSUFBSUksSUFBNUI7QUFDQTtBQUVEO0FBQ0QsUUFBSUgsSUFBSU0sVUFBSixLQUFtQixHQUF2QixFQUE0QjtBQUMxQlgsVUFBSUssR0FBSjtBQUNBO0FBQ0Q7O0FBRURMLFFBQUksMEJBQUo7O0FBRUEsUUFBRyxDQUFDSSxHQUFKLEVBQ0UsTUFBTSxJQUFJUSxLQUFKLENBQVUscUJBQVYsQ0FBTjs7QUFF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ZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5leHBvcnQgY29uc3Qgc2xhc2hfY29tbWFuZHMgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+e1xuXG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgaWYoIXJlcSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICBsb2cocmVxLmJvZHkpO1xuXG4gIC8vbGV0IHBheUxvYWQgPSByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZDtcbiAgLy9sb2coXCJwYXlsb2FkXCIrcGF5TG9hZCk7XG4gIHRvc2NhbmEtYWlwLW5sYy1jb25zdW1lci1jbGllbnQtaWRcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gJ3Rvc2NhbmEtYWlwLW5sYy1jb25zdW1lci1jbGllbnQtaWQnKSB7XG4gICAgbGV0IGNvbW1hbmQgPSBKU09OLnBhcnNlKHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkKS5hY3Rpb25JZDtcbiAgICAvL2xvZyhcImFjdGlvbiBpZCBcIityZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCk7XG4gICAgbG9nKFwiY29tbWFuZCBcIitjb21tYW5kKTtcblxuICAgIGlmICghY29tbWFuZClcbiAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcbiAgICBcbiAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICBsZXQgbWVzc2FnZSA9ICdAc2NydW1ib3QgJytjb21tYW5kO1xuXG4gICAgYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6bWVzc2FnZX0pLnRoZW4oKHRvX3Bvc3QpPT57XG4gICAgICBcbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG4gIH07XG5cbn1cblxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KTtcblxuICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0OnJlcS5ib2R5LmNvbnRlbnR9KS50aGVuKCh0b19wb3N0KT0+e1xuXG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG5cbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7IFxuXG4gICAgXG4gIH07XG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgIT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYikgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHNsYXNoX2NvbW1hbmRzKGFwcElkLCB0b2tlbilcbiAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICBycCh7XG4gICAgICAgICAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuICAgICAgICBcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=