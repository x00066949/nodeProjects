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

      var to_post = board.getScrumData({ request: req, response: res, message1: message1 });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsIm1lc3NhZ2UiLCJjb250ZW50IiwiZ3NlY3JldCIsImdpdENvbm5lY3QiLCJ1cmkiLCJoZWFkZXJzIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiZW52IiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImlzc3Vlc191cmwiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJnZXRfaXNzdWUiLCJyZXBvaWQiLCJpc3N1ZWlkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwiZmluZFNsYXNoUmVwbyIsImVsZW1lbnQiLCJzY3J1bWJvdCIsImFwcElkIiwidG9rZW4iLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwic3RhdHVzQ29kZSIsInR5cGUiLCJhbm5vdGF0aW9uVHlwZSIsImFubm90YXRpb25QYXlsb2FkIiwibWVzc2FnZTEiLCJ0b19wb3N0IiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJkaXIiLCJkZXB0aCIsInNlbmQiLCJzcGFjZUlkIiwiZm9ybWF0IiwidXNlck5hbWUiLCJnZXRSZXBvIiwicmVwb05hbWUiLCJ0ZXh0IiwidG9rIiwiY2IiLCJwb3N0IiwiQXV0aG9yaXphdGlvbiIsInZlcnNpb24iLCJhbm5vdGF0aW9ucyIsImNvbG9yIiwidGl0bGUiLCJhY3RvciIsIkVycm9yIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUVaOzs7Ozs7OztBQVhBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFXQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKOztBQUVBO0FBQ0E7QUFDQSxJQUFNQyxhQUFhLFNBQWJBLFVBQWEsR0FBTTtBQUN2Qk4sS0FBRztBQUNETyxTQUFLLHlCQURKOztBQUdEQyxhQUFTO0FBQ1Asb0JBQWM7QUFEUCxLQUhSO0FBTURDLFFBQUk7QUFDRkMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFEckI7QUFFRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFGekIsS0FOSDtBQVVEQyxVQUFNO0FBVkwsR0FBSCxFQVlHQyxJQVpILENBWVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2RmLGNBQVVlLEtBQUtDLFVBQWY7QUFFRCxHQWZILEVBZ0JHQyxL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QVNILEdBckZIO0FBc0ZELENBekZEOztBQTJGQSxJQUFJaEcsUUFBUXNGLElBQVIsS0FBaUJZLE1BQXJCLEVBQTZCO0FBQzNCWixPQUFLdkUsUUFBUXdFLElBQWIsRUFBbUJ4RSxRQUFRQyxHQUEzQixFQUFnQyxVQUFDUyxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQQyxjQUFRcEIsR0FBUixDQUFZLHFCQUFaLEVBQW1DbUIsR0FBbkM7QUFDQTtBQUNEOztBQUVEbkIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciBtZXNzYWdlO1xudmFyIGNvbnRlbnQ7XG52YXIgZ3NlY3JldDtcblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhLmlzc3Vlc191cmw7XG5cbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgfSlcblxufTtcblxuY29uc3QgZ2V0X2lzc3VlID0gKHJlcG9pZCwgaXNzdWVpZCkgPT57XG4gICAgcnAoe1xuICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb2lkICsgJy9pc3N1ZXMvJyArIGlzc3VlaWQsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgXG4gICAgICAgIG1lc3NhZ2UgPSBkYXRhLnBpcGVsaW5lLm5hbWVcbiAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIGxvZygnbWVzc2FnZSA6ICcrbWVzc2FnZSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICBcbiAgICAgIH0pICBcbn07XG5cbmZ1bmN0aW9uIGZpbmRTbGFzaFJlcG8oZWxlbWVudCl7XG4gIHJldHVybiBlbGVtZW50ID0gJy9yZXBvcydcbn1cbmV4cG9ydCBjb25zdCBzY3J1bWJvdCA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEsIHJlcykgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgJiYgcmVxLmJvZHkuYW5ub3RhdGlvblR5cGUgPT09ICdhY3Rpb25TZWxlY3RlZCcpIHtcbiAgICBjb25zdCBhbm5vdGF0aW9uUGF5bG9hZCA9IHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkO1xuICAgIC8vaWYgKGFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkID09PSAgJycpe1xuICAgIGxvZyhyZXEuYm9keSk7XG4gICAgLy99XG5cbiAgfVxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWNyZWF0ZWQnICYmIHJlcS5ib2R5LnVzZXJJZCAhPT0gYXBwSWQpIHtcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgbG9nKCdjb250ZW50IDogJytyZXEuYm9keS5jb250ZW50KTtcblxuICAgIHZhciBtZXNzYWdlMSA9IHJlcS5ib2R5LmNvbnRlbnQ7XG5cbiAgICB2YXIgdG9fcG9zdCA9IGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgbWVzc2FnZTF9KTtcbiAgICBjb25zb2xlLmRpcih0b19wb3N0LCB7ZGVwdGg6bnVsbH0pO1xuICAgIFxuICAgIFxuICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgIH0pXG4gICAgLyp2YXIgdG9fc3BsaXQgPSByZXEuYm9keS5jb250ZW50O1xuICAgIHZhciB3b3JkcyA9IHRvX3NwbGl0LnNwbGl0KCk7XG4gICAgbG9nKCdhcnJheSBsZW5ndGggOiAnK3dvcmRzLmxlbmd0aClcblxuICAgIGxvZyh3b3Jkcy5maW5kSW5kZXgoZmluZFNsYXNoUmVwbykpO1xuICAgIGxvZyh0b19zcGxpdCk7XG4gICAgLy9tZXNzYWdlID0gJ05vdCBGb3VuZCdcblxuICAgIGlmKHRvX3NwbGl0ID09PSAnL2lzc3VlJyl7XG4gICAgICBcbiAgICAgIC8vbGV0IGdldF9pc3N1ZV92YXIgPSBnZXRfaXNzdWUoNzEyNDA0NDYsMSk7XG4gICAgICBcbiAgICAgIFxuICAgICAgLy9zZW5kIHRvIHNwYWNlXG4gICAgZ2V0X2lzc3VlX3Zhci50aGVuKHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgIH0pXG4gICAgICkgfVxuICAgIGlmKHRvX3NwbGl0ID09PSAnL2dpdCcgKXtcblxuICAgICAgbG9nKCdnaXRodWIgcm91dGUnKTtcbiAgICAgIGxvZygnbWVzc2FnZSBiNCBnaXRSOiAnK21lc3NhZ2UpXG4gICAgICBcbiAgICAgIC8vY2FsbCBnaXRjb25uZWN0IGZ1bmN0aW9uXG4gICAgICBsZXQgZ2l0Q29ubmVjdF92YXIgPSBnaXRDb25uZWN0KCk7XG5cbiAgICAgIGxvZygnbWVzc2FnZSBhZnRlciBnaXRSOiAnK21lc3NhZ2UpXG4gICAgICBcbiAgICAgIC8vc2VuZCB0byBzcGFjZVxuICAgIGdpdENvbm5lY3RfdmFyLnRoZW4oc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgbWVzc2FnZSksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmICghZXJyKVxuICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICAgICl9ICAqLyAgXG4gIH07XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UmVwbyA9IChyZXBvTmFtZSkgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcbiAgICB9LFxuICAgIHFzOiB7XG4gICAgXG4gICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgIH0sXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgIGxvZyhkYXRhKVxuXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH0pXG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJwKHtcbiAgICAgICAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG4gICAgICAgIFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXM6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICAgICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qYXBwLmdldCgnL2NhbGxiYWNrLycsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLnF1ZXJ5KTsgXG4gICAgICAgICAgICBnc2VjcmV0ID0gcmVxLnF1ZXJ5LmNvZGU7XG4gICAgICAgICAgICByZXMuc2VuZChcIkhpXCIrZ3NlY3JldCk7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBwLnBvc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nLCB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVULFxuICAgICAgICAgICAgICBjb2RlOiBnc2VjcmV0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgICAgICAgbG9nKCdzdGF1czogJywgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgICAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICAgICAgICB9KTsqL1xuXG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19