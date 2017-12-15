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
    var message = data.issues_url;
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
      log('content : ' + req.body.content);

      var to_split = req.body.content;
      log(to_split);
      //message = 'Not Found'

      if (to_split === '/issue') {
        log('zenhub route');

        log('message b4 zenR: ' + message);

        get_issue(71240446, 1);
        log('message after znR: ' + message);

        //send to space
        send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, message), token(), function (err, res) {
          if (!err) log('Sent message to space %s', req.body.spaceId);
        });
      }
      if (to_split === '/git') {

        log('github route');
        log('message b4 gitR: ' + message);

        //call gitconnect function
        gitConnect();

        log('message after gitR: ' + message);

        //send to space
        send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, message), token(), function (err, res) {
          if (!err) log('Sent message to space %s', req.body.spaceId);
        });
      }
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

var get_issue = function get_issue(repid, issueid) {
  app.get(function (request, response) {
    rp({
      uri: 'https://api.zenhub.io/p1/repositories/' + repoid + '/issues/' + issueid,

      headers: {
        'X-Authentication-Token': process.env.ZENHUB_TOKEN
      },

      json: true
    }).then(function (data) {
      //console.log(data)
      response.send(data);
      var message = data.pipeline.name;
      log('message : ' + message);
    }).catch(function (err) {
      console.log(err);
      response.render('error');
    });
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

/*
//dialog
const dialog = (spaceId, text, tok, cb) => {
  request.post(
    'https://api.watsonwork.ibm.com/v1/spaces/' + spaceId + '/messages', {
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
    }, (err, res) => {
      if (err || res.statusCode !== 201) {
        log('Error sending message %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    });
};
*/
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

      /*app.get('/callback/', function (req, res) {
          console.log(req.query); 
          gsecret = req.query.code;
          res.send("Hi"+gsecret);
       });
       app.post(
        'https://github.com/login/oauth/access_token', {
          
          json: true,
          // An App message can specify a color, a title, markdown text and
          // an 'actor' useful to show where the message is coming from
          body: {
            client_id: process.env.GIT_CLIENT_ID,
            client_secret: process.env.GIT_CLIENT_SECRET,
            code: gsecret
          }
        }, (err, res) => {
          if (err || res.statusCode !== 201) {
            log('staus: ', res.statusCode);
            cb(err || new Error(res.statusCode));
            return;
          }
          log('Send result %d, %o', res.statusCode, res.body);
          cb(null, res.body);
        });*/
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwiY29udGVudCIsImdzZWNyZXQiLCJnaXRDb25uZWN0IiwidXJpIiwiaGVhZGVycyIsInFzIiwiY2xpZW50X2lkIiwicHJvY2VzcyIsImVudiIsIkdJVF9DTElFTlRfSUQiLCJjbGllbnRfc2VjcmV0IiwiR0lUX0NMSUVOVF9TRUNSRVQiLCJqc29uIiwidGhlbiIsImRhdGEiLCJpc3N1ZXNfdXJsIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwic2NydW1ib3QiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsInN0YXR1c0NvZGUiLCJ0eXBlIiwiYW5ub3RhdGlvblR5cGUiLCJhbm5vdGF0aW9uUGF5bG9hZCIsInRvX3NwbGl0IiwiZ2V0X2lzc3VlIiwic2VuZCIsInNwYWNlSWQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImdldFJlcG8iLCJyZXBvTmFtZSIsInJlcGlkIiwiaXNzdWVpZCIsImdldCIsInJlc3BvbnNlIiwicmVwb2lkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwicmVuZGVyIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJFcnJvciIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUVaOzs7Ozs7OztBQVZBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFVQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKOztBQUVBO0FBQ0E7QUFDQSxJQUFNQyxhQUFhLFNBQWJBLFVBQWEsR0FBTTtBQUN2Qk4sS0FBRztBQUNETyxTQUFLLHlCQURKOztBQUdEQyxhQUFTO0FBQ1Asb0JBQWM7QUFEUCxLQUhSO0FBTURDLFFBQUk7QUFDRkMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFEckI7QUFFRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFGekIsS0FOSDtBQVVEQyxVQUFNO0FBVkwsR0FBSCxFQVlHQyxJQVpILENBWVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2QsUUFBSWYsVUFBVWUsS0FBS0MsVUFBbkI7QUFDQWpCLFFBQUlnQixJQUFKOztBQUVBO0FBQ0QsR0FqQkgsRUFrQkdFLEtBbEJILENBa0JTLFVBQUNDLEdBQUQsRUFBUztBQUNkQyxZQUFRcEIs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LElBQWQ7QUFDRCxTQWxCSCxFQW1CR0UsS0FuQkgsQ0FtQlMsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLGtCQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUNBMEIsbUJBQVNULElBQVQsQ0FBYyxhQUFXakIsR0FBekI7QUFDRCxTQXRCSDtBQXVCRCxPQXhCRDs7QUEwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkQsS0E3REQ7QUFnRUU7QUFDQWlFLFVBQUlDLElBQUosQ0FBUzNFLEdBQVQsRUFBYyxVQUFDUyxHQUFELEVBQU1rRSxJQUFOLEVBQWU7QUFDM0IsWUFBSWxFLEdBQUosRUFBUztBQUNQa0MsYUFBR2xDLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTW1FLE9BQU81RSxJQUFJNkUsT0FBSixJQUFlLEdBQTVCO0FBQ0F2RixZQUFJLG1DQUFKLEVBQXlDc0YsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQXJGSDtBQXNGRCxDQXpGRDs7QUEyRkEsSUFBSTVGLFFBQVFrRixJQUFSLEtBQWlCWSxNQUFyQixFQUE2QjtBQUMzQlosT0FBS25FLFFBQVFvRSxJQUFiLEVBQW1CcEUsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQ1MsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUEMsY0FBUXBCLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ21CLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRG5CLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIG1lc3NhZ2U7XG52YXIgY29udGVudDtcbnZhciBnc2VjcmV0O1xuXG4vL3RvIHNob3cgaW4gYnJvd3NlclxuLy9zZXQgcm91dGUgZm9yIGhvbWVwYWdlIFxuY29uc3QgZ2l0Q29ubmVjdCA9ICgpID0+IHtcbiAgcnAoe1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgfSxcbiAgICBxczoge1xuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICB9LFxuICAgIGpzb246IHRydWVcbiAgfSlcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgdmFyIG1lc3NhZ2UgPSBkYXRhLmlzc3Vlc191cmw7XG4gICAgICBsb2coZGF0YSlcblxuICAgICAgLy9yZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgLy9yZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgIH0pXG5cbn07XG5cbmV4cG9ydCBjb25zdCBzY3J1bWJvdCA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEsIHJlcykgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgJiYgcmVxLmJvZHkuYW5ub3RhdGlvblR5cGUgPT09ICdhY3Rpb25TZWxlY3RlZCcpIHtcbiAgICBjb25zdCBhbm5vdGF0aW9uUGF5bG9hZCA9IHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkO1xuICAgIC8vaWYgKGFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkID09PSAgJycpe1xuICAgIGxvZyhyZXEuYm9keSk7XG4gICAgLy99XG5cbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KVxuICAgIFxuICAgIHZhciB0b19zcGxpdCA9IHJlcS5ib2R5LmNvbnRlbnQ7XG4gICAgbG9nKHRvX3NwbGl0KTtcbiAgICAvL21lc3NhZ2UgPSAnTm90IEZvdW5kJ1xuXG4gICAgaWYodG9fc3BsaXQgPT09ICcvaXNzdWUnKXtcbiAgICAgIGxvZygnemVuaHViIHJvdXRlJyk7XG5cbiAgICAgIGxvZygnbWVzc2FnZSBiNCB6ZW5SOiAnK21lc3NhZ2UpXG4gICAgICBcbiAgICAgIGdldF9pc3N1ZSg3MTI0MDQ0NiwxKTtcbiAgICAgIGxvZygnbWVzc2FnZSBhZnRlciB6blI6ICcrbWVzc2FnZSlcbiAgICAgIFxuICAgICAgLy9zZW5kIHRvIHNwYWNlXG4gICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgbWVzc2FnZSksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmICghZXJyKVxuICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgfSlcbiAgICB9XG4gICAgaWYodG9fc3BsaXQgPT09ICcvZ2l0JyApe1xuXG4gICAgICBsb2coJ2dpdGh1YiByb3V0ZScpO1xuICAgICAgbG9nKCdtZXNzYWdlIGI0IGdpdFI6ICcrbWVzc2FnZSlcbiAgICAgIFxuICAgICAgLy9jYWxsIGdpdGNvbm5lY3QgZnVuY3Rpb25cbiAgICAgIGdpdENvbm5lY3QoKTtcblxuICAgICAgbG9nKCdtZXNzYWdlIGFmdGVyIGdpdFI6ICcrbWVzc2FnZSlcbiAgICAgIFxuICAgICAgLy9zZW5kIHRvIHNwYWNlXG4gICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgbWVzc2FnZSksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmICghZXJyKVxuICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgfSlcbiAgICB9XG4gICAgXG4gICAgXG5cbiAgICBcbiAgfTtcbn07XG5cblxuXG5cblxuXG5leHBvcnQgY29uc3QgZ2V0UmVwbyA9IChyZXBvTmFtZSkgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcbiAgICB9LFxuICAgIHFzOiB7XG4gICAgXG4gICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgIH0sXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgIGxvZyhkYXRhKVxuXG4gICAgICAvL3Jlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAvL3Jlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgfSlcblxuXG4gIFxufTtcblxuY29uc3QgZ2V0X2lzc3VlID0gKHJlcGlkLCBpc3N1ZWlkKSA9PntcbiAgYXBwLmdldChmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICBycCh7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvaWQgKyAnL2lzc3Vlcy8nICsgaXNzdWVpZCxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH0pXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAvL2NvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBkYXRhLnBpcGVsaW5lLm5hbWVcbiAgICAgICAgbG9nKCdtZXNzYWdlIDogJyttZXNzYWdlKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgcmVzcG9uc2UucmVuZGVyKCdlcnJvcicpXG4gICAgICB9KVxuICB9KTtcbn07XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLypcbi8vZGlhbG9nXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuKi9cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSAhPT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIHNjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICBycCh7XG4gICAgICAgICAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuICAgICAgICBcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICAvKmFwcC5nZXQoJy9jYWxsYmFjay8nLCBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcS5xdWVyeSk7IFxuICAgICAgICAgICAgZ3NlY3JldCA9IHJlcS5xdWVyeS5jb2RlO1xuICAgICAgICAgICAgcmVzLnNlbmQoXCJIaVwiK2dzZWNyZXQpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFwcC5wb3N0KFxuICAgICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vbG9naW4vb2F1dGgvYWNjZXNzX3Rva2VuJywge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgICAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVCxcbiAgICAgICAgICAgICAgY29kZTogZ3NlY3JldFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgICAgICAgIGxvZygnc3RhdXM6ICcsIHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICAgICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgICAgICAgfSk7Ki9cblxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==