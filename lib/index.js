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

    if (req.body.type === 'message-annotation-added' && req.body.userId !== 'toscana-aip-nlc-consumer-client-id') {
      var command = JSON.parse(req.body.annotationPayload).actionId;
      //log("action id "+req.body.annotationPayload.actionId);
      log("command " + command);

      if (!command) log("no command to process");

      // message represents the message coming in from WW to be processed by the App
      var _message = '@scrumbot ' + command;

      board.getScrumData({ request: req, response: res, UserInput: _message }).then(function (to_post) {

        log("data got = " + to_post);

        send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, 'hello \n World'), token(), function (err, res) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsInNsYXNoX2NvbW1hbmRzIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJjb25zb2xlIiwic3RhdHVzQ29kZSIsIkVycm9yIiwidHlwZSIsImNvbW1hbmQiLCJKU09OIiwicGFyc2UiLCJhbm5vdGF0aW9uUGF5bG9hZCIsImFjdGlvbklkIiwibWVzc2FnZSIsImdldFNjcnVtRGF0YSIsInJlc3BvbnNlIiwiVXNlcklucHV0IiwidGhlbiIsInRvX3Bvc3QiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiZXJyIiwiY2F0Y2giLCJzY3J1bWJvdCIsImNvbnRlbnQiLCJ0ZXh0IiwidG9rIiwiY2IiLCJwb3N0IiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwidXJpIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJH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QUFXRHBDLGdCQUFNO0FBWEwsU0FBSCxFQWFHaEIsSUFiSCxDQWFRLFVBQUNxRCxJQUFELEVBQVU7QUFDZHpELG9CQUFVeUQsSUFBVjtBQUNBNUUsY0FBSTRFLElBQUo7O0FBRUF2RCxtQkFBU0ksSUFBVCxDQUFjbUQsSUFBZDtBQUNELFNBbEJILEVBbUJHOUMsS0FuQkgsQ0FtQlMsVUFBQ0QsR0FBRCxFQUFTO0FBQ2RuQixrQkFBUVYsR0FBUixDQUFZNkIsR0FBWjtBQUNBUixtQkFBU0ksSUFBVCxDQUFjLGFBQVdJLEdBQXpCO0FBQ0QsU0F0Qkg7QUF1QkQsT0F4QkQ7QUE0QkQsS0FsQ0Q7QUFxQ0U7QUFDQWdELFVBQUlDLElBQUosQ0FBU2hCLEdBQVQsRUFBYyxVQUFDakMsR0FBRCxFQUFNaUQsSUFBTixFQUFlO0FBQzNCLFlBQUlqRCxHQUFKLEVBQVM7QUFDUE0sYUFBR04sR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNa0QsT0FBT2pCLElBQUlrQixPQUFKLElBQWUsR0FBNUI7QUFDQWhGLFlBQUksbUNBQUosRUFBeUMrRSxJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBMURIO0FBMkRELENBOUREOztBQWdFQSxJQUFJckYsUUFBUWtFLElBQVIsS0FBaUJxQixNQUFyQixFQUE2QjtBQUMzQnJCLE9BQUtZLFFBQVFYLElBQWIsRUFBbUJXLFFBQVFWLEdBQTNCLEVBQWdDLFVBQUNqQyxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQbkIsY0FBUVYsR0FBUixDQUFZLHFCQUFaLEVBQW1DNkIsR0FBbkM7QUFDQTtBQUNEOztBQUVEN0IsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbmV4cG9ydCBjb25zdCBzbGFzaF9jb21tYW5kcyA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEsIHJlcykgPT57XG5cbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcblxuICBpZighcmVxKVxuICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuXG4gIGxvZyhyZXEuYm9keSk7XG5cbiAgLy9sZXQgcGF5TG9hZCA9IHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkO1xuICAvL2xvZyhcInBheWxvYWRcIitwYXlMb2FkKTtcblxuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSAndG9zY2FuYS1haXAtbmxjLWNvbnN1bWVyLWNsaWVudC1pZCcpIHtcbiAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICBsb2coXCJjb21tYW5kIFwiK2NvbW1hbmQpO1xuXG4gICAgaWYgKCFjb21tYW5kKVxuICAgICAgbG9nKFwibm8gY29tbWFuZCB0byBwcm9jZXNzXCIpO1xuICAgIFxuICAgIC8vIG1lc3NhZ2UgcmVwcmVzZW50cyB0aGUgbWVzc2FnZSBjb21pbmcgaW4gZnJvbSBXVyB0byBiZSBwcm9jZXNzZWQgYnkgdGhlIEFwcFxuICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnK2NvbW1hbmQ7XG5cbiAgICBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDptZXNzYWdlfSkudGhlbigodG9fcG9zdCk9PntcbiAgICAgIFxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcblxuICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgJ2hlbGxvIFxcbiBXb3JsZCcpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG4gIH07XG5cbn1cblxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KTtcblxuICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0OnJlcS5ib2R5LmNvbnRlbnR9KS50aGVuKCh0b19wb3N0KT0+e1xuXG5cbiAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG5cbiAgICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgIH0pLmNhdGNoKChlcnIpPT57XG4gICAgICBsb2coXCJub3RoaW5nIHJldHVybmVkIGZyb20gZ2V0c2NydW1kYXRhXCIgKyBlcnIpO1xuICAgIH0pXG5cbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7IFxuXG4gICAgXG4gIH07XG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG5cbiAgICAgIC8vaGFuZGxlIHNsYXNoIGNvbW1hbmRzXG4gICAgICBzbGFzaF9jb21tYW5kcyhhcHBJZCwgdG9rZW4pXG4gICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcnAoe1xuICAgICAgICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcbiAgICAgICAgXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxczoge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgICAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIFxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19