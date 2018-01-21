/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.getRepo = exports.scrumbot = undefined;

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

var message;
var content;
var gsecret;

//to show in browser
//set route for homepage 
var gitConnect = function gitConnect() {
  rp({
    uri: 'https://api.github.com/',

    headers: {
      'User-Agent': 'simple_rest_app'
    },
    qs: {
      client_id: process.env.GIT_CLIENT_ID,
      client_secret: process.env.GIT_CLIENT_SECRET
    },
    json: true
  }).then(function (data) {
    message = data.issues_url;
  }).catch(function (err) {
    console.log(err);
  });
};

var get_issue = function get_issue(repoid, issueid) {
  rp({
    uri: 'https://api.zenhub.io/p1/repositories/' + repoid + '/issues/' + issueid,

    headers: {
      'X-Authentication-Token': process.env.ZENHUB_TOKEN
    },

    json: true
  }).then(function (data) {

    message = data.pipeline.name;
    log(data);
    log('message : ' + message);
  }).catch(function (err) {
    console.log(err);
  });
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

      var message1 = req.body.content;

      var to_post = board.getScrumData({ request: req, response: res, UserInput: message1 });
      //console.dir(to_post, {depth:null});


      send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
        if (!err) log('Sent message to space %s', req.body.spaceId);
      });
    };
  };
};

var getRepo = /*istanbul ignore next*/exports.getRepo = function getRepo(repoName) {
  // Respond to the Webhook right away, as the response message will
  // be sent asynchronously
  res.status(201).end();
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
  }).catch(function (err) {
    console.log(err);
  });
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
    scrumbot(appId, token)));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsIm1lc3NhZ2UiLCJjb250ZW50IiwiZ3NlY3JldCIsImdpdENvbm5lY3QiLCJ1cmkiLCJoZWFkZXJzIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiZW52IiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImlzc3Vlc191cmwiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJnZXRfaXNzdWUiLCJyZXBvaWQiLCJpc3N1ZWlkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwic2NydW1ib3QiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsInN0YXR1c0NvZGUiLCJ0eXBlIiwibWVzc2FnZTEiLCJ0b19wb3N0IiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiZ2V0UmVwbyIsInJlcG9OYW1lIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJFcnJvciIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFFWjs7Ozs7Ozs7QUFYQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBV0EsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsT0FBSjs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsYUFBYSxTQUFiQSxVQUFhLEdBQU07QUFDdkJOLEtBQUc7QUFDRE8sU0FBSyx5QkFESjs7QUFHREMsYUFBUztBQUNQLG9CQUFjO0FBRFAsS0FIUjtBQU1EQyxRQUFJO0FBQ0ZDLGlCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBRHJCO0FBRUZDLHFCQUFlSCxRQUFRQyxHQUFSLENBQVlHO0FBRnpCLEtBTkg7QUFVREMsVUFBTTtBQVZMLEdBQUgsRUFZR0MsSUFaSCxDQVlRLFVBQUNDLElBQUQsRUFBVTtBQUNkZixjQUFVZSxLQUFLQyxVQUFmO0FBRUQsR0FmSCxFQWdCR0MsS0FoQkgsQ0FnQlMsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLFlBQVFwQixHQUFSLENBQVltQixHQUFaO0FBQ0QsR0Fs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U0FBSCxFQWFHQyxJQWJILENBYVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2RmLG9CQUFVZSxJQUFWO0FBQ0FoQixjQUFJZ0IsSUFBSjs7QUFFQXlCLG1CQUFTRSxJQUFULENBQWMzQixJQUFkO0FBQ0QsU0FsQkgsRUFtQkdFLEtBbkJILENBbUJTLFVBQUNDLEdBQUQsRUFBUztBQUNkQyxrQkFBUXBCLEdBQVIsQ0FBWW1CLEdBQVo7QUFDQXNCLG1CQUFTRSxJQUFULENBQWMsYUFBV3hCLEdBQXpCO0FBQ0QsU0F0Qkg7QUF1QkQsT0F4QkQ7QUE0QkQsS0FsQ0Q7QUFxQ0U7QUFDQWdFLFVBQUlDLElBQUosQ0FBUzFFLEdBQVQsRUFBYyxVQUFDUyxHQUFELEVBQU1pRSxJQUFOLEVBQWU7QUFDM0IsWUFBSWpFLEdBQUosRUFBUztBQUNQZ0MsYUFBR2hDLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTWtFLE9BQU8zRSxJQUFJNEUsT0FBSixJQUFlLEdBQTVCO0FBQ0F0RixZQUFJLG1DQUFKLEVBQXlDcUYsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQTFESDtBQTJERCxDQTlERDs7QUFnRUEsSUFBSTNGLFFBQVFpRixJQUFSLEtBQWlCWSxNQUFyQixFQUE2QjtBQUMzQlosT0FBS2xFLFFBQVFtRSxJQUFiLEVBQW1CbkUsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQ1MsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUEMsY0FBUXBCLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ21CLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRG5CLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgbWVzc2FnZTtcbnZhciBjb250ZW50O1xudmFyIGdzZWNyZXQ7XG5cbi8vdG8gc2hvdyBpbiBicm93c2VyXG4vL3NldCByb3V0ZSBmb3IgaG9tZXBhZ2UgXG5jb25zdCBnaXRDb25uZWN0ID0gKCkgPT4ge1xuICBycCh7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcbiAgICB9LFxuICAgIHFzOiB7XG4gICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgIH0sXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtZXNzYWdlID0gZGF0YS5pc3N1ZXNfdXJsO1xuXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH0pXG5cbn07XG5cbmNvbnN0IGdldF9pc3N1ZSA9IChyZXBvaWQsIGlzc3VlaWQpID0+e1xuICAgIHJwKHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9pZCArICcvaXNzdWVzLycgKyBpc3N1ZWlkLFxuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgICB9LFxuXG4gICAgICBqc29uOiB0cnVlXG4gICAgfSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIFxuICAgICAgICBtZXNzYWdlID0gZGF0YS5waXBlbGluZS5uYW1lXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBsb2coJ21lc3NhZ2UgOiAnK21lc3NhZ2UpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgXG4gICAgICB9KSAgXG59O1xuXG5leHBvcnQgY29uc3Qgc2NydW1ib3QgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy9oYW5kbGUgbmV3IG1lc3NhZ2VzIGFuZCBpZ25vcmUgdGhlIGFwcCdzIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtY3JlYXRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSBhcHBJZCkge1xuICAgIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgICBsb2coJ2NvbnRlbnQgOiAnK3JlcS5ib2R5LmNvbnRlbnQpO1xuXG4gICAgdmFyIG1lc3NhZ2UxID0gcmVxLmJvZHkuY29udGVudDtcblxuICAgIHZhciB0b19wb3N0ID0gYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6bWVzc2FnZTF9KTtcbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7XG5cblxuICAgIFxuICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgIH0pXG4gICAgXG4gIH07XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UmVwbyA9IChyZXBvTmFtZSkgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcbiAgICB9LFxuICAgIHFzOiB7XG4gICAgXG4gICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgIH0sXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgIGxvZyhkYXRhKVxuXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH0pXG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJwKHtcbiAgICAgICAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG4gICAgICAgIFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXM6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICAgICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==