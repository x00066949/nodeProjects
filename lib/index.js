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


    var command = JSON.parse(req.body.annotationPayload).actionId;
    //log("action id "+req.body.annotationPayload.actionId);
    log("command " + command);

    //JSON.parse(req.body.annotationPayload.actionId).replace('/repo', '')
    //.match(/(?:[^\s"]+|"[^"]*")+/g);

    if (!command) log("no command to process");

    // message represents the message coming in from WW to be processed by the App
    var message = '@scrumbot ' + command;

    board.getScrumData({ request: req, response: res, UserInput: to_process }).then(function (to_post) {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiY29tbWFuZCIsIkpTT04iLCJwYXJzZSIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0b19wcm9jZXNzIiwidGhlbiIsInRvX3Bvc3QiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiZXJyIiwiY2F0Y2giLCJzY3J1bWJvdCIsInR5cGUiLCJjb250ZW50IiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwianNvbiIsInZlcnNpb24iLCJhbm5vdGF0aW9ucyIsImNvbG9yIiwidGl0bGUiLCJhY3RvciIsIm5hbWUiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0Iiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJlbnYiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInVyaSIsInFzIiwiY2xpZW50X2lkIiwicHJvY2VzcyIsIkdJVF9DTElFTlRfSUQiLCJjbGllbnRfc2VjcmV0IiwiR0lUX0NMSUVOVF9TRUNSRVQiLCJkYXRhIiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUVaOzs7Ozs7OztBQVhBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFXQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRU8sSUFBTUMsa0VBQWlCLFNBQWpCQSxjQUFpQixDQUFDQyxLQUFELEVBQVFDLEtBQVI7QUFBQSxTQUFrQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYTs7QUFFM0Q7QUFDQTtBQUNBQSxRQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUM7QUFDRDtBQUNBLFFBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlAsS0FBeEIsRUFBK0I7QUFDN0JRLGNBQVFWLEdBQVIsQ0FBWSxVQUFaLEVBQXdCSSxJQUFJSSxJQUE1QjtBQUNBO0FBRUQ7QUFDRCxRQUFJSCxJQUFJTSxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCWCxVQUFJSyxHQUFKO0FBQ0E7QUFDRDs7QUFFREwsUUFBSSwwQkFBSjs7QUFFQSxRQUFHLENBQUNJLEdBQUosRUFDRSxNQUFNLElBQUlRLEtBQUosQ0FBVSxxQkFBVixDQUFOOztBQUVGWixRQUFJSSxJQUFJSSxJQUFSOztBQUVBO0FBQ0E7OztB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QTdFLGNBQUk2RSxJQUFKOztBQUVBekQsbUJBQVNLLElBQVQsQ0FBY29ELElBQWQ7QUFDRCxTQWxCSCxFQW1CRy9DLEtBbkJILENBbUJTLFVBQUNELEdBQUQsRUFBUztBQUNkbkIsa0JBQVFWLEdBQVIsQ0FBWTZCLEdBQVo7QUFDQVQsbUJBQVNLLElBQVQsQ0FBYyxhQUFXSSxHQUF6QjtBQUNELFNBdEJIO0FBdUJELE9BeEJEO0FBNEJELEtBbENEO0FBcUNFO0FBQ0FpRCxVQUFJQyxJQUFKLENBQVNoQixHQUFULEVBQWMsVUFBQ2xDLEdBQUQsRUFBTWtELElBQU4sRUFBZTtBQUMzQixZQUFJbEQsR0FBSixFQUFTO0FBQ1BPLGFBQUdQLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTW1ELE9BQU9qQixJQUFJa0IsT0FBSixJQUFlLEdBQTVCO0FBQ0FqRixZQUFJLG1DQUFKLEVBQXlDZ0YsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQTFESDtBQTJERCxDQTlERDs7QUFnRUEsSUFBSXRGLFFBQVFtRSxJQUFSLEtBQWlCcUIsTUFBckIsRUFBNkI7QUFDM0JyQixPQUFLWSxRQUFRWCxJQUFiLEVBQW1CVyxRQUFRVixHQUEzQixFQUFnQyxVQUFDbEMsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUG5CLGNBQVFWLEdBQVIsQ0FBWSxxQkFBWixFQUFtQzZCLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRDdCLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5leHBvcnQgY29uc3Qgc2xhc2hfY29tbWFuZHMgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+e1xuXG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG5cbiAgaWYoIXJlcSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcblxuICBsb2cocmVxLmJvZHkpO1xuXG4gIC8vbGV0IHBheUxvYWQgPSByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZDtcbiAgLy9sb2coXCJwYXlsb2FkXCIrcGF5TG9hZCk7XG5cblxuICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAvL2xvZyhcImFjdGlvbiBpZCBcIityZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCk7XG4gIGxvZyhcImNvbW1hbmQgXCIrY29tbWFuZCk7XG4gIFxuICBcblxuICAvL0pTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQpLnJlcGxhY2UoJy9yZXBvJywgJycpXG4gIC8vLm1hdGNoKC8oPzpbXlxcc1wiXSt8XCJbXlwiXSpcIikrL2cpO1xuXG4gIGlmICghY29tbWFuZClcbiAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG4gIFxuICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcrY29tbWFuZDtcblxuICBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDp0b19wcm9jZXNzfSkudGhlbigodG9fcG9zdCk9PntcbiAgICBcbiAgICBcbiAgICAgICAgICBsb2coXCJkYXRhIGdvdCA9IFwiK3RvX3Bvc3QpO1xuICAgIFxuICAgICAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICAgICAgbG9nKFwibm90aGluZyByZXR1cm5lZCBmcm9tIGdldHNjcnVtZGF0YVwiICsgZXJyKTtcbiAgICAgICAgfSlcbiAgXG5cbn1cblxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KTtcblxuICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0OnJlcS5ib2R5LmNvbnRlbnR9KS50aGVuKCh0b19wb3N0KT0+e1xuXG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG5cbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7IFxuXG4gICAgXG4gIH07XG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIFxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSAhPT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIC8vc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuXG4gICAgICAvL2hhbmRsZSBzbGFzaCBjb21tYW5kc1xuICAgICAgc2xhc2hfY29tbWFuZHMoYXBwSWQsIHRva2VuKVxuICAgICkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJwKHtcbiAgICAgICAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG4gICAgICAgIFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXM6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICAgICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==