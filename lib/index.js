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

    var command = req.body.annotationPayload.actionId;

    //JSON.parse(req.body.annotationPayload.actionId).replace('/repo', '')
    //.match(/(?:[^\s"]+|"[^"]*")+/g);

    if (!command) log("no command to process");

    var repo_name = '@scrumbot ' + command + ' 7';

    board.getScrumData({ request: req, response: res, UserInput: repo_name }).then(function (to_post) {

      log("data got = " + to_post);

      send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
        if (!err) log('Sent message to space %s', req.body.spaceId);
      });
    }).catch(function (err) {
      log("nothing returned from getscrumdata" + err);
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiY29tbWFuZCIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJyZXBvX25hbWUiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsInNwYWNlSWQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImVyciIsImNhdGNoIiwic2NydW1ib3QiLCJ0eXBlIiwiY29udGVudCIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsImpzb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwidXJpIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImRhdGEiLCJtZXNzYWdlIiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUVaOzs7Ozs7OztBQVhBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFXQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRU8sSUFBTUMsa0VBQWlCLFNBQWpCQSxjQUFpQixDQUFDQyxLQUFELEVBQVFDLEtBQVI7QUFBQSxTQUFrQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYTs7QUFFM0Q7QUFDQTtBQUNBQSxRQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUM7QUFDRDtBQUNBLFFBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlAsS0FBeEIsRUFBK0I7QUFDN0JRLGNBQVFWLEdBQVIsQ0FBWSxVQUFaLEVBQXdCSSxJQUFJSSxJQUE1QjtBQUNBO0FBRUQ7QUFDRCxRQUFJSCxJQUFJTSxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCWCxVQUFJSyxHQUFKO0FBQ0E7QUFDRDs7QUFFREwsUUFBSSwwQkFBSjs7QUFFQSxRQUFHLENBQUNJLEdBQUosRUFDRSxNQUFNLElBQUlRLEtBQUosQ0FBVSxxQkFBVixDQUFOOztBQUVGWixRQUFJSSxJQUFJSSxJQUFSOztBQUVBLFFBQUlLLFVBQVVULElBQUlJ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LFVBQUNELEdBQUQsRUFBUztBQUNkaEIsa0JBQVFWLEdBQVIsQ0FBWTBCLEdBQVo7QUFDQVIsbUJBQVNJLElBQVQsQ0FBYyxhQUFXSSxHQUF6QjtBQUNELFNBdEJIO0FBdUJELE9BeEJEO0FBNEJELEtBbENEO0FBcUNFO0FBQ0FtRCxVQUFJQyxJQUFKLENBQVNqQixHQUFULEVBQWMsVUFBQ25DLEdBQUQsRUFBTW9ELElBQU4sRUFBZTtBQUMzQixZQUFJcEQsR0FBSixFQUFTO0FBQ1BPLGFBQUdQLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTXFELE9BQU9sQixJQUFJbUIsT0FBSixJQUFlLEdBQTVCO0FBQ0FoRixZQUFJLG1DQUFKLEVBQXlDK0UsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQTFESDtBQTJERCxDQTlERDs7QUFnRUEsSUFBSXJGLFFBQVFpRSxJQUFSLEtBQWlCc0IsTUFBckIsRUFBNkI7QUFDM0J0QixPQUFLWSxRQUFRWCxJQUFiLEVBQW1CVyxRQUFRVixHQUEzQixFQUFnQyxVQUFDbkMsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUGhCLGNBQVFWLEdBQVIsQ0FBWSxxQkFBWixFQUFtQzBCLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRDFCLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5leHBvcnQgY29uc3Qgc2xhc2hfY29tbWFuZHMgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+e1xuXG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgaWYoIXJlcSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICBsb2cocmVxLmJvZHkpO1xuXG4gIGxldCBjb21tYW5kID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQ7XG4gIFxuICAvL0pTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpLnJlcGxhY2UoJy9yZXBvJywgJycpXG4gIC8vLm1hdGNoKC8oPzpbXlxcc1wiXSt8XCJbXlwiXSpcIikrL2cpO1xuXG4gIGlmICghY29tbWFuZClcbiAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG4gIFxuICBsZXQgcmVwb19uYW1lID0gJ0BzY3J1bWJvdCAnK2NvbW1hbmQgKycgNyc7XG5cbiAgYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6cmVwb19uYW1lfSkudGhlbigodG9fcG9zdCk9PntcbiAgICBcbiAgICBcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiK3RvX3Bvc3QpO1xuICAgIFxuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICAgICAgbG9nKFwibm90aGluZyByZXR1cm5lZCBmcm9tIGdldHNjcnVtZGF0YVwiICsgZXJyKTtcbiAgICAgICAgfSlcbiAgXG5cbn1cblxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KTtcblxuICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0OnJlcS5ib2R5LmNvbnRlbnR9KS50aGVuKCh0b19wb3N0KT0+e1xuXG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG5cbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7IFxuXG4gICAgXG4gIH07XG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBzbGFzaF9jb21tYW5kcyhhcHBJZCwgdG9rZW4pXG4gICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcnAoe1xuICAgICAgICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcbiAgICAgICAgXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxczoge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgICAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIFxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19