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
      log("result : " + to_post);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiYm9hcmQyIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsIm1lc3NhZ2UiLCJjb250ZW50IiwiZ3NlY3JldCIsImdpdENvbm5lY3QiLCJ1cmkiLCJoZWFkZXJzIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiZW52IiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImlzc3Vlc191cmwiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJnZXRfaXNzdWUiLCJyZXBvaWQiLCJpc3N1ZWlkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwiZmluZFNsYXNoUmVwbyIsImVsZW1lbnQiLCJzY3J1bWJvdCIsImFwcElkIiwidG9rZW4iLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwic3RhdHVzQ29kZSIsInR5cGUiLCJhbm5vdGF0aW9uVHlwZSIsImFubm90YXRpb25QYXlsb2FkIiwibWVzc2FnZTEiLCJ0b19wb3N0IiwibWFrZVJlcXVlc3QiLCJyZXNwb25zZSIsImlzc3VlIiwic2VuZCIsInNwYWNlSWQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImdldFJlcG8iLCJyZXBvTmFtZSIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJBdXRob3JpemF0aW9uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwiRXJyb3IiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0IiwiSlNPTiIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxNOztBQUVaOzs7Ozs7OztBQVpBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFZQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKOztBQUVBO0FBQ0E7QUFDQSxJQUFNQyxhQUFhLFNBQWJBLFVBQWEsR0FBTTtBQUN2Qk4sS0FBRztBQUNETyxTQUFLLHlCQURKOztBQUdEQyxhQUFTO0FBQ1Asb0JBQWM7QUFEUCxLQUhSO0FBTURDLFFBQUk7QUFDRkMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFEckI7QUFFRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFGekIsS0FOSDtBQVVEQyxVQUFNO0FBVkwsR0FBSCxFQVlHQyxJQVpILENBWVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2RmLGNBQVVlLEtBQUtDLFVBQWY7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OztBQTJGQSxJQUFJL0YsUUFBUXFGLElBQVIsS0FBaUJZLE1BQXJCLEVBQTZCO0FBQzNCWixPQUFLdEUsUUFBUXVFLElBQWIsRUFBbUJ2RSxRQUFRQyxHQUEzQixFQUFnQyxVQUFDUyxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQQyxjQUFRcEIsR0FBUixDQUFZLHFCQUFaLEVBQW1DbUIsR0FBbkM7QUFDQTtBQUNEOztBQUVEbkIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgYm9hcmQyIGZyb20gJy4vYm9hcmRfY29weSc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIG1lc3NhZ2U7XG52YXIgY29udGVudDtcbnZhciBnc2VjcmV0O1xuXG4vL3RvIHNob3cgaW4gYnJvd3NlclxuLy9zZXQgcm91dGUgZm9yIGhvbWVwYWdlIFxuY29uc3QgZ2l0Q29ubmVjdCA9ICgpID0+IHtcbiAgcnAoe1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgfSxcbiAgICBxczoge1xuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICB9LFxuICAgIGpzb246IHRydWVcbiAgfSlcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbWVzc2FnZSA9IGRhdGEuaXNzdWVzX3VybDtcblxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICB9KVxuXG59O1xuXG5jb25zdCBnZXRfaXNzdWUgPSAocmVwb2lkLCBpc3N1ZWlkKSA9PntcbiAgICBycCh7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvaWQgKyAnL2lzc3Vlcy8nICsgaXNzdWVpZCxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH0pXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBcbiAgICAgICAgbWVzc2FnZSA9IGRhdGEucGlwZWxpbmUubmFtZVxuICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgbG9nKCdtZXNzYWdlIDogJyttZXNzYWdlKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIFxuICAgICAgfSkgIFxufTtcblxuZnVuY3Rpb24gZmluZFNsYXNoUmVwbyhlbGVtZW50KXtcbiAgcmV0dXJuIGVsZW1lbnQgPSAnL3JlcG9zJ1xufVxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAmJiByZXEuYm9keS5hbm5vdGF0aW9uVHlwZSA9PT0gJ2FjdGlvblNlbGVjdGVkJykge1xuICAgIGNvbnN0IGFubm90YXRpb25QYXlsb2FkID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQ7XG4gICAgLy9pZiAoYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQgPT09ICAnJyl7XG4gICAgbG9nKHJlcS5ib2R5KTtcbiAgICAvL31cblxuICB9XG5cbiAgLy9oYW5kbGUgbmV3IG1lc3NhZ2VzIGFuZCBpZ25vcmUgdGhlIGFwcCdzIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtY3JlYXRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSBhcHBJZCkge1xuICAgIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgICBsb2coJ2NvbnRlbnQgOiAnK3JlcS5ib2R5LmNvbnRlbnQpO1xuXG4gICAgdmFyIG1lc3NhZ2UxID0gcmVxLmJvZHkuY29udGVudDtcblxuICAgIC8vdmFyIHRvX3Bvc3QgPSBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDptZXNzYWdlMX0pO1xuICAgIC8vY29uc29sZS5kaXIodG9fcG9zdCwge2RlcHRoOm51bGx9KTtcblxuICAgIHZhciB0b19wb3N0ID0gYm9hcmQyLm1ha2VSZXF1ZXN0KHtyZXNwb25zZTpyZXMsIGlzc3VlOm1lc3NhZ2UxfSlcbiAgICBsb2coXCJyZXN1bHQgOiBcIit0b19wb3N0KTtcbiAgICBcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxuICAgIC8qdmFyIHRvX3NwbGl0ID0gcmVxLmJvZHkuY29udGVudDtcbiAgICB2YXIgd29yZHMgPSB0b19zcGxpdC5zcGxpdCgpO1xuICAgIGxvZygnYXJyYXkgbGVuZ3RoIDogJyt3b3Jkcy5sZW5ndGgpXG5cbiAgICBsb2cod29yZHMuZmluZEluZGV4KGZpbmRTbGFzaFJlcG8pKTtcbiAgICBsb2codG9fc3BsaXQpO1xuICAgIC8vbWVzc2FnZSA9ICdOb3QgRm91bmQnXG5cbiAgICBpZih0b19zcGxpdCA9PT0gJy9pc3N1ZScpe1xuICAgICAgXG4gICAgICAvL2xldCBnZXRfaXNzdWVfdmFyID0gZ2V0X2lzc3VlKDcxMjQwNDQ2LDEpO1xuICAgICAgXG4gICAgICBcbiAgICAgIC8vc2VuZCB0byBzcGFjZVxuICAgIGdldF9pc3N1ZV92YXIudGhlbihzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlKSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxuICAgICApIH1cbiAgICBpZih0b19zcGxpdCA9PT0gJy9naXQnICl7XG5cbiAgICAgIGxvZygnZ2l0aHViIHJvdXRlJyk7XG4gICAgICBsb2coJ21lc3NhZ2UgYjQgZ2l0UjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL2NhbGwgZ2l0Y29ubmVjdCBmdW5jdGlvblxuICAgICAgbGV0IGdpdENvbm5lY3RfdmFyID0gZ2l0Q29ubmVjdCgpO1xuXG4gICAgICBsb2coJ21lc3NhZ2UgYWZ0ZXIgZ2l0UjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL3NlbmQgdG8gc3BhY2VcbiAgICBnaXRDb25uZWN0X3Zhci50aGVuKHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgfSlcbiAgICApfSAgKi8gIFxuICB9O1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFJlcG8gPSAocmVwb05hbWUpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICBycCh7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgfSxcbiAgICBxczoge1xuICAgIFxuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICB9LFxuICAgIGpzb246IHRydWVcbiAgfSlcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICBsb2coZGF0YSlcblxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICB9KVxufTtcblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSAhPT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIHNjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICBycCh7XG4gICAgICAgICAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuICAgICAgICBcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICAvKmFwcC5nZXQoJy9jYWxsYmFjay8nLCBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcS5xdWVyeSk7IFxuICAgICAgICAgICAgZ3NlY3JldCA9IHJlcS5xdWVyeS5jb2RlO1xuICAgICAgICAgICAgcmVzLnNlbmQoXCJIaVwiK2dzZWNyZXQpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFwcC5wb3N0KFxuICAgICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vbG9naW4vb2F1dGgvYWNjZXNzX3Rva2VuJywge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgICAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVCxcbiAgICAgICAgICAgICAgY29kZTogZ3NlY3JldFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgICAgICAgIGxvZygnc3RhdXM6ICcsIHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICAgICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgICAgICAgfSk7Ki9cblxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==