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
    message = data;
    log(data);

    //response.send(data)
  }).catch(function (err) {
    console.log(err);
    //response.send('error : '+err)
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

    if (req.body.type === 'message-annotation-added' && req.body.annotationType === 'actionSelected') {
      var annotationPayload = req.body.annotationPayload;
      //if (annotationPayload.actionId ===  ''){
      log(req.body);
      //}
    }

    //handle new messages and ignore the app's own messages
    if (req.body.type === 'message-created' && req.body.userId !== appId) {
      log('Got a message %o', req.body);

      //call gitconnect function
      gitConnect();

      //send to space
      send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, message.issues_url), token(), function (err, res) {
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

    //response.send(data)
  }).catch(function (err) {
    console.log(err);
    //response.send('error : '+err)
  });
};

app.get('/r/:repo/:issue', function (request, response) {
  rp({
    uri: 'https://api.zenhub.io/p1/repositories/' + request.params.repo + '/issues/' + request.params.issue,

    headers: {
      'X-Authentication-Token': process.env.ZENHUB_TOKEN
    },

    json: true
  }).then(function (data) {
    //console.log(data)
    response.send(data);
  }).catch(function (err) {
    console.log(err);
    response.render('error');
  });
});

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

//dialog
var dialog = function dialog(spaceId, text, tok, cb) {
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

      app.get('/callback/', function (req, res) {
        console.log(req.query);
        gsecret = req.query.code;
        res.send("Hi" + gsecret);
      });

      app.post('https://github.com/login/oauth/access_token', {

        json: true,
        // An App message can specify a color, a title, markdown text and
        // an 'actor' useful to show where the message is coming from
        body: {
          client_id: process.env.GIT_CLIENT_ID,
          client_secret: process.env.GIT_CLIENT_SECRET,
          code: gsecret
        }
      }, function (err, res) {
        if (err || res.statusCode !== 201) {
          log('staus: ', res.statusCode);
          cb(err || new Error(res.statusCode));
          return;
        }
        log('Send result %d, %o', res.statusCode, res.body);
        cb(null, res.body);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwiY29udGVudCIsImdzZWNyZXQiLCJnaXRDb25uZWN0IiwidXJpIiwiaGVhZGVycyIsInFzIiwiY2xpZW50X2lkIiwicHJvY2VzcyIsImVudiIsIkdJVF9DTElFTlRfSUQiLCJjbGllbnRfc2VjcmV0IiwiR0lUX0NMSUVOVF9TRUNSRVQiLCJqc29uIiwidGhlbiIsImRhdGEiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJzY3J1bWJvdCIsImFwcElkIiwidG9rZW4iLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwic3RhdHVzQ29kZSIsInR5cGUiLCJhbm5vdGF0aW9uVHlwZSIsImFubm90YXRpb25QYXlsb2FkIiwic2VuZCIsInNwYWNlSWQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImlzc3Vlc191cmwiLCJnZXRSZXBvIiwicmVwb05hbWUiLCJnZXQiLCJyZXNwb25zZSIsInBhcmFtcyIsInJlcG8iLCJpc3N1ZSIsIlpFTkhVQl9UT0tFTiIsInJlbmRlciIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJBdXRob3JpemF0aW9uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsIkVycm9yIiwiZGlhbG9nIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicXVlcnkiLCJjb2RlIiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBRVo7Ozs7Ozs7O0FBVkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQVVBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1NLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7O0FBRUE7QUFDQTtBQUNBLElBQU1DLGFBQWEsU0FBYkEsVUFBYSxHQUFNO0FBQ3ZCTixLQUFHO0FBQ0RPLFNBQUsseUJBREo7O0FBR0RDLGFBQVM7QUFDUCxvQkFBYztBQURQLEtBSFI7QUFNREMsUUFBSTtBQUNGQyxpQkFBV0MsUUFBUUMsR0FBUixDQUFZQyxhQURyQjtBQUVGQyxxQkFBZUgsUUFBUUMsR0FBUixDQUFZRztBQUZ6QixLQU5IO0FBVURDLFVBQU07QUFWTCxHQUFILEVBWUdDLElBWkgsQ0FZUSxVQUFDQyxJQUFELEVBQVU7QUFDZGYsY0FBVWUsSUFBVjtBQUNBaEIsUUFBSWdCLElBQUo7O0FBRUE7QUFDRCxHQWpCSCxFQWtCR0MsS0FsQkgsQ0FrQlMsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLFlBQVFuQixHQUFSLENBQVlrQixHQUFaO0FBQ0E7QUFD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LGFBQUcvQixHQUFIO0FBQ0E7QUFDRDtBQUNELFlBQU1vRSxPQUFPNUUsSUFBSTZFLE9BQUosSUFBZSxHQUE1QjtBQUNBdkYsWUFBSSxtQ0FBSixFQUF5Q3NGLElBQXpDO0FBQ0E7QUFDRCxPQVJEO0FBU0gsR0FyRkg7QUFzRkQsQ0F6RkQ7O0FBMkZBLElBQUk1RixRQUFRZ0YsSUFBUixLQUFpQmMsTUFBckIsRUFBNkI7QUFDM0JkLE9BQUtqRSxRQUFRa0UsSUFBYixFQUFtQmxFLFFBQVFDLEdBQTNCLEVBQWdDLFVBQUNRLEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1BDLGNBQVFuQixHQUFSLENBQVkscUJBQVosRUFBbUNrQixHQUFuQztBQUNBO0FBQ0Q7O0FBRURsQixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciBtZXNzYWdlO1xudmFyIGNvbnRlbnQ7XG52YXIgZ3NlY3JldDtcblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgbG9nKGRhdGEpXG5cbiAgICAgIC8vcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIC8vcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICB9KVxuXG59O1xuXG5leHBvcnQgY29uc3Qgc2NydW1ib3QgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnICYmIHJlcS5ib2R5LmFubm90YXRpb25UeXBlID09PSAnYWN0aW9uU2VsZWN0ZWQnKSB7XG4gICAgY29uc3QgYW5ub3RhdGlvblBheWxvYWQgPSByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZDtcbiAgICAvL2lmIChhbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCA9PT0gICcnKXtcbiAgICBsb2cocmVxLmJvZHkpO1xuICAgIC8vfVxuXG4gIH1cblxuICAvL2hhbmRsZSBuZXcgbWVzc2FnZXMgYW5kIGlnbm9yZSB0aGUgYXBwJ3Mgb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1jcmVhdGVkJyAmJiByZXEuYm9keS51c2VySWQgIT09IGFwcElkKSB7XG4gICAgbG9nKCdHb3QgYSBtZXNzYWdlICVvJywgcmVxLmJvZHkpO1xuXG4gICAgLy9jYWxsIGdpdGNvbm5lY3QgZnVuY3Rpb25cbiAgICBnaXRDb25uZWN0KCk7XG4gICAgXG5cbiAgICAvL3NlbmQgdG8gc3BhY2VcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlLmlzc3Vlc191cmwpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgfSlcbiAgfTtcbn07XG5cblxuXG5cblxuXG5leHBvcnQgY29uc3QgZ2V0UmVwbyA9IChyZXBvTmFtZSkgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcbiAgICB9LFxuICAgIHFzOiB7XG4gICAgXG4gICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgIH0sXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgIGxvZyhkYXRhKVxuXG4gICAgICAvL3Jlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAvL3Jlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgfSlcblxuXG4gIFxufTtcblxuYXBwLmdldCgnL3IvOnJlcG8vOmlzc3VlJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXF1ZXN0LnBhcmFtcy5yZXBvICsgJy9pc3N1ZXMvJyArIHJlcXVlc3QucGFyYW1zLmlzc3VlLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICB9LFxuXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGRhdGEpXG4gICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgcmVzcG9uc2UucmVuZGVyKCdlcnJvcicpXG4gICAgfSlcbn0pO1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgIT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYikgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICBzY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcnAoe1xuICAgICAgICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcbiAgICAgICAgXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxczoge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgICAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIFxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBwLmdldCgnL2NhbGxiYWNrLycsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLnF1ZXJ5KTsgXG4gICAgICAgICAgICBnc2VjcmV0ID0gcmVxLnF1ZXJ5LmNvZGU7XG4gICAgICAgICAgICByZXMuc2VuZChcIkhpXCIrZ3NlY3JldCk7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBwLnBvc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nLCB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVULFxuICAgICAgICAgICAgICBjb2RlOiBnc2VjcmV0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgICAgICAgbG9nKCdzdGF1czogJywgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgICAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==