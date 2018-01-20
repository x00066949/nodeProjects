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

var /*istanbul ignore next*/_board_copy = require('./board_copy');

/*istanbul ignore next*/var board2 = _interopRequireWildcard(_board_copy);

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

function findSlashRepo(element) {
  return element = '/repos';
}
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

      var message1 = req.body.content;

      //var to_post = board.getScrumData({request:req, response:res, UserInput:message1});
      //console.dir(to_post, {depth:null});

      var to_post = board2.makeRequest({ response: res, issue: message1 });
      console.dir(to_post, { depth: null });

      send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
        if (!err) log('Sent message to space %s', req.body.spaceId);
      });
      /*var to_split = req.body.content;
      var words = to_split.split();
      log('array length : '+words.length)
       log(words.findIndex(findSlashRepo));
      log(to_split);
      //message = 'Not Found'
       if(to_split === '/issue'){
        
        //let get_issue_var = get_issue(71240446,1);
        
        
        //send to space
      get_issue_var.then(send(req.body.spaceId,
        util.format(
          'Hey %s, result is: %s',
          req.body.userName, message),
        token(),
        (err, res) => {
          if (!err)
            log('Sent message to space %s', req.body.spaceId);
      })
       ) }
      if(to_split === '/git' ){
         log('github route');
        log('message b4 gitR: '+message)
        
        //call gitconnect function
        let gitConnect_var = gitConnect();
         log('message after gitR: '+message)
        
        //send to space
      gitConnect_var.then(send(req.body.spaceId,
        util.format(
          'Hey %s, result is: %s',
          req.body.userName, message),
        token(),
        (err, res) => {
          if (!err)
            log('Sent message to space %s', req.body.spaceId);
        })
      )}  */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiYm9hcmQyIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsIm1lc3NhZ2UiLCJjb250ZW50IiwiZ3NlY3JldCIsImdpdENvbm5lY3QiLCJ1cmkiLCJoZWFkZXJzIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiZW52IiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImlzc3Vlc191cmwiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJnZXRfaXNzdWUiLCJyZXBvaWQiLCJpc3N1ZWlkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwiZmluZFNsYXNoUmVwbyIsImVsZW1lbnQiLCJzY3J1bWJvdCIsImFwcElkIiwidG9rZW4iLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwic3RhdHVzQ29kZSIsInR5cGUiLCJhbm5vdGF0aW9uVHlwZSIsImFubm90YXRpb25QYXlsb2FkIiwibWVzc2FnZTEiLCJ0b19wb3N0IiwibWFrZVJlcXVlc3QiLCJyZXNwb25zZSIsImlzc3VlIiwiZGlyIiwiZGVwdGgiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiZ2V0UmVwbyIsInJlcG9OYW1lIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJFcnJvciIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLE07O0FBRVo7Ozs7Ozs7O0FBWkEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQVlBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjs7QUFFQTtBQUNBLElBQU1NLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7O0FBRUE7QUFDQTtBQUNBLElBQU1DLGFBQWEsU0FBYkEsVUFBYSxHQUFNO0FBQ3ZCTixLQUFHO0FBQ0RPLFNBQUsseUJBREo7O0FBR0RDLGFBQVM7QUFDUCxvQkFBYztBQURQLEtBSFI7QUFNREMsUUFBSTtBQUNGQyxpQkFBV0MsUUFBUUMsR0FBUixDQUFZQyxhQURyQjtBQUVGQyxxQkFBZUgsUUFBUUMsR0FBUixDQUFZRztBQUZ6QixLQU5IO0FBVURDLFVBQU07QUFWTCxHQUFILEVBWUdDLElBWkgsQ0FZUSxVQUFDQyxJQUFELEVBQVU7QUFDZGYsY0FB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QXlDMkYsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQXJGSDtBQXNGRCxDQXpGRDs7QUEyRkEsSUFBSWpHLFFBQVF1RixJQUFSLEtBQWlCWSxNQUFyQixFQUE2QjtBQUMzQlosT0FBS3hFLFFBQVF5RSxJQUFiLEVBQW1CekUsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQ1MsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUEMsY0FBUXBCLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ21CLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRG5CLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGJvYXJkMiBmcm9tICcuL2JvYXJkX2NvcHknO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciBtZXNzYWdlO1xudmFyIGNvbnRlbnQ7XG52YXIgZ3NlY3JldDtcblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhLmlzc3Vlc191cmw7XG5cbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgfSlcblxufTtcblxuY29uc3QgZ2V0X2lzc3VlID0gKHJlcG9pZCwgaXNzdWVpZCkgPT57XG4gICAgcnAoe1xuICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb2lkICsgJy9pc3N1ZXMvJyArIGlzc3VlaWQsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgXG4gICAgICAgIG1lc3NhZ2UgPSBkYXRhLnBpcGVsaW5lLm5hbWVcbiAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIGxvZygnbWVzc2FnZSA6ICcrbWVzc2FnZSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICBcbiAgICAgIH0pICBcbn07XG5cbmZ1bmN0aW9uIGZpbmRTbGFzaFJlcG8oZWxlbWVudCl7XG4gIHJldHVybiBlbGVtZW50ID0gJy9yZXBvcydcbn1cbmV4cG9ydCBjb25zdCBzY3J1bWJvdCA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEsIHJlcykgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgJiYgcmVxLmJvZHkuYW5ub3RhdGlvblR5cGUgPT09ICdhY3Rpb25TZWxlY3RlZCcpIHtcbiAgICBjb25zdCBhbm5vdGF0aW9uUGF5bG9hZCA9IHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkO1xuICAgIC8vaWYgKGFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkID09PSAgJycpe1xuICAgIGxvZyhyZXEuYm9keSk7XG4gICAgLy99XG5cbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KTtcblxuICAgIHZhciBtZXNzYWdlMSA9IHJlcS5ib2R5LmNvbnRlbnQ7XG5cbiAgICAvL3ZhciB0b19wb3N0ID0gYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6bWVzc2FnZTF9KTtcbiAgICAvL2NvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7XG5cbiAgICB2YXIgdG9fcG9zdCA9IGJvYXJkMi5tYWtlUmVxdWVzdCh7cmVzcG9uc2U6cmVzLCBpc3N1ZTptZXNzYWdlMX0pXG4gICAgY29uc29sZS5kaXIodG9fcG9zdCwge2RlcHRoOm51bGx9KTtcbiAgICBcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxuICAgIC8qdmFyIHRvX3NwbGl0ID0gcmVxLmJvZHkuY29udGVudDtcbiAgICB2YXIgd29yZHMgPSB0b19zcGxpdC5zcGxpdCgpO1xuICAgIGxvZygnYXJyYXkgbGVuZ3RoIDogJyt3b3Jkcy5sZW5ndGgpXG5cbiAgICBsb2cod29yZHMuZmluZEluZGV4KGZpbmRTbGFzaFJlcG8pKTtcbiAgICBsb2codG9fc3BsaXQpO1xuICAgIC8vbWVzc2FnZSA9ICdOb3QgRm91bmQnXG5cbiAgICBpZih0b19zcGxpdCA9PT0gJy9pc3N1ZScpe1xuICAgICAgXG4gICAgICAvL2xldCBnZXRfaXNzdWVfdmFyID0gZ2V0X2lzc3VlKDcxMjQwNDQ2LDEpO1xuICAgICAgXG4gICAgICBcbiAgICAgIC8vc2VuZCB0byBzcGFjZVxuICAgIGdldF9pc3N1ZV92YXIudGhlbihzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlKSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxuICAgICApIH1cbiAgICBpZih0b19zcGxpdCA9PT0gJy9naXQnICl7XG5cbiAgICAgIGxvZygnZ2l0aHViIHJvdXRlJyk7XG4gICAgICBsb2coJ21lc3NhZ2UgYjQgZ2l0UjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL2NhbGwgZ2l0Y29ubmVjdCBmdW5jdGlvblxuICAgICAgbGV0IGdpdENvbm5lY3RfdmFyID0gZ2l0Q29ubmVjdCgpO1xuXG4gICAgICBsb2coJ21lc3NhZ2UgYWZ0ZXIgZ2l0UjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL3NlbmQgdG8gc3BhY2VcbiAgICBnaXRDb25uZWN0X3Zhci50aGVuKHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgfSlcbiAgICApfSAgKi8gIFxuICB9O1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFJlcG8gPSAocmVwb05hbWUpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICBycCh7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgfSxcbiAgICBxczoge1xuICAgIFxuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICB9LFxuICAgIGpzb246IHRydWVcbiAgfSlcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICBsb2coZGF0YSlcblxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICB9KVxufTtcblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSAhPT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIHNjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICBycCh7XG4gICAgICAgICAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuICAgICAgICBcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICAvKmFwcC5nZXQoJy9jYWxsYmFjay8nLCBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcS5xdWVyeSk7IFxuICAgICAgICAgICAgZ3NlY3JldCA9IHJlcS5xdWVyeS5jb2RlO1xuICAgICAgICAgICAgcmVzLnNlbmQoXCJIaVwiK2dzZWNyZXQpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFwcC5wb3N0KFxuICAgICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vbG9naW4vb2F1dGgvYWNjZXNzX3Rva2VuJywge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgICAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVCxcbiAgICAgICAgICAgICAgY29kZTogZ3NlY3JldFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgICAgICAgIGxvZygnc3RhdXM6ICcsIHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICAgICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgICAgICAgfSk7Ki9cblxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==