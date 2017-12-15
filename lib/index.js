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
    message = data.issues_url;
    log(data);

    //response.send(data)
  }).catch(function (err) {
    console.log(err);
    //response.send('error : '+err)
  });
};
var get_issue = function get_issue(repoid, issueid) {
  //app.get(function (request, response) {
  rp({
    uri: 'https://api.zenhub.io/p1/repositories/' + repoid + '/issues/' + issueid,

    headers: {
      'X-Authentication-Token': process.env.ZENHUB_TOKEN
    },

    json: true
  }).then(function (data) {
    //console.log(data)
    response.send(data);
    message = data.pipeline.name;
    log(data);
    log('message : ' + message);
  }).catch(function (err) {
    console.log(err);
    response.render('error');
  });
  //});
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwiY29udGVudCIsImdzZWNyZXQiLCJnaXRDb25uZWN0IiwidXJpIiwiaGVhZGVycyIsInFzIiwiY2xpZW50X2lkIiwicHJvY2VzcyIsImVudiIsIkdJVF9DTElFTlRfSUQiLCJjbGllbnRfc2VjcmV0IiwiR0lUX0NMSUVOVF9TRUNSRVQiLCJqc29uIiwidGhlbiIsImRhdGEiLCJpc3N1ZXNfdXJsIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwiZ2V0X2lzc3VlIiwicmVwb2lkIiwiaXNzdWVpZCIsIlpFTkhVQl9UT0tFTiIsInJlc3BvbnNlIiwic2VuZCIsInBpcGVsaW5lIiwibmFtZSIsInJlbmRlciIsInNjcnVtYm90IiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJzdGF0dXNDb2RlIiwidHlwZSIsImFubm90YXRpb25UeXBlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJ0b19zcGxpdCIsInNwYWNlSWQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImdldFJlcG8iLCJyZXBvTmFtZSIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJBdXRob3JpemF0aW9uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwiRXJyb3IiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJnZXQiLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0IiwiSlNPTiIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFFWjs7Ozs7Ozs7QUFWQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBVUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsT0FBSjs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsYUFBYSxTQUFiQSxVQUFhLEdBQU07QUFDdkJOLEtBQUc7QUFDRE8sU0FBSyx5QkFESjs7QUFHREMsYUFBUztBQUNQLG9CQUFjO0FBRFAsS0FIUjtBQU1EQyxRQUFJO0FBQ0ZDLGlCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBRHJCO0FBRUZDLHFCQUFlSCxRQUFRQyxHQUFSLENBQVlHO0FBRnpCLEtBTkg7QUFVREMsVUFBTTtBQVZMLEdBQUgsRUFZR0MsSUFaSCxDQVlRLFVBQUNDLElBQUQsRUFBVTtBQUNkZixjQUFVZSxLQUFLQyxVQUFmO0FBQ0FqQixRQUFJZ0IsSUFBSjs7QUFFQTtBQUNELEdBakJILEVBa0JHRSxLQWxCSCxDQWtCUyxVQUFDQyxHQUFELEVBQVM7QUFDZEMsWUFBUXBCLEdBQVIsQ0FBWW1CLEdB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QUFZbUIsR0FBWjtBQUNBTSxtQkFBU0MsSUFBVCxDQUFjLGFBQVdQLEdBQXpCO0FBQ0QsU0F0Qkg7QUF1QkQsT0F4QkQ7O0FBMEJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJELEtBN0REO0FBZ0VFO0FBQ0FnRSxVQUFJQyxJQUFKLENBQVMxRSxHQUFULEVBQWMsVUFBQ1MsR0FBRCxFQUFNaUUsSUFBTixFQUFlO0FBQzNCLFlBQUlqRSxHQUFKLEVBQVM7QUFDUGdDLGFBQUdoQyxHQUFIO0FBQ0E7QUFDRDtBQUNELFlBQU1rRSxPQUFPM0UsSUFBSTRFLE9BQUosSUFBZSxHQUE1QjtBQUNBdEYsWUFBSSxtQ0FBSixFQUF5Q3FGLElBQXpDO0FBQ0E7QUFDRCxPQVJEO0FBU0gsR0FyRkg7QUFzRkQsQ0F6RkQ7O0FBMkZBLElBQUkzRixRQUFRaUYsSUFBUixLQUFpQlksTUFBckIsRUFBNkI7QUFDM0JaLE9BQUtsRSxRQUFRbUUsSUFBYixFQUFtQm5FLFFBQVFDLEdBQTNCLEVBQWdDLFVBQUNTLEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1BDLGNBQVFwQixHQUFSLENBQVkscUJBQVosRUFBbUNtQixHQUFuQztBQUNBO0FBQ0Q7O0FBRURuQixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciBtZXNzYWdlO1xudmFyIGNvbnRlbnQ7XG52YXIgZ3NlY3JldDtcblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhLmlzc3Vlc191cmw7XG4gICAgICBsb2coZGF0YSlcblxuICAgICAgLy9yZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgLy9yZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgIH0pXG5cbn07XG5jb25zdCBnZXRfaXNzdWUgPSAocmVwb2lkLCBpc3N1ZWlkKSA9PntcbiAgLy9hcHAuZ2V0KGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgIHJwKHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9pZCArICcvaXNzdWVzLycgKyBpc3N1ZWlkLFxuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgICB9LFxuXG4gICAgICBqc29uOiB0cnVlXG4gICAgfSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIC8vY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgICBtZXNzYWdlID0gZGF0YS5waXBlbGluZS5uYW1lXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBsb2coJ21lc3NhZ2UgOiAnK21lc3NhZ2UpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICByZXNwb25zZS5yZW5kZXIoJ2Vycm9yJylcbiAgICAgIH0pXG4gIC8vfSk7XG59O1xuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAmJiByZXEuYm9keS5hbm5vdGF0aW9uVHlwZSA9PT0gJ2FjdGlvblNlbGVjdGVkJykge1xuICAgIGNvbnN0IGFubm90YXRpb25QYXlsb2FkID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQ7XG4gICAgLy9pZiAoYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQgPT09ICAnJyl7XG4gICAgbG9nKHJlcS5ib2R5KTtcbiAgICAvL31cblxuICB9XG5cbiAgLy9oYW5kbGUgbmV3IG1lc3NhZ2VzIGFuZCBpZ25vcmUgdGhlIGFwcCdzIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtY3JlYXRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSBhcHBJZCkge1xuICAgIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgICBsb2coJ2NvbnRlbnQgOiAnK3JlcS5ib2R5LmNvbnRlbnQpXG4gICAgXG4gICAgdmFyIHRvX3NwbGl0ID0gcmVxLmJvZHkuY29udGVudDtcbiAgICBsb2codG9fc3BsaXQpO1xuICAgIC8vbWVzc2FnZSA9ICdOb3QgRm91bmQnXG5cbiAgICBpZih0b19zcGxpdCA9PT0gJy9pc3N1ZScpe1xuICAgICAgbG9nKCd6ZW5odWIgcm91dGUnKTtcblxuICAgICAgbG9nKCdtZXNzYWdlIGI0IHplblI6ICcrbWVzc2FnZSlcbiAgICAgIFxuICAgICAgZ2V0X2lzc3VlKDcxMjQwNDQ2LDEpO1xuICAgICAgbG9nKCdtZXNzYWdlIGFmdGVyIHpuUjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL3NlbmQgdG8gc3BhY2VcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlKSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxuICAgIH1cbiAgICBpZih0b19zcGxpdCA9PT0gJy9naXQnICl7XG5cbiAgICAgIGxvZygnZ2l0aHViIHJvdXRlJyk7XG4gICAgICBsb2coJ21lc3NhZ2UgYjQgZ2l0UjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL2NhbGwgZ2l0Y29ubmVjdCBmdW5jdGlvblxuICAgICAgZ2l0Q29ubmVjdCgpO1xuXG4gICAgICBsb2coJ21lc3NhZ2UgYWZ0ZXIgZ2l0UjogJyttZXNzYWdlKVxuICAgICAgXG4gICAgICAvL3NlbmQgdG8gc3BhY2VcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlKSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxuICAgIH1cbiAgICBcbiAgICBcblxuICAgIFxuICB9O1xufTtcblxuXG5cblxuXG5cbmV4cG9ydCBjb25zdCBnZXRSZXBvID0gKHJlcG9OYW1lKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcbiAgcnAoe1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICBcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgbG9nKGRhdGEpXG5cbiAgICAgIC8vcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIC8vcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICB9KVxuXG5cbiAgXG59O1xuXG5cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vKlxuLy9kaWFsb2dcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG4qL1xuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJwKHtcbiAgICAgICAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG4gICAgICAgIFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXM6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICAgICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qYXBwLmdldCgnL2NhbGxiYWNrLycsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLnF1ZXJ5KTsgXG4gICAgICAgICAgICBnc2VjcmV0ID0gcmVxLnF1ZXJ5LmNvZGU7XG4gICAgICAgICAgICByZXMuc2VuZChcIkhpXCIrZ3NlY3JldCk7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBwLnBvc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nLCB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGpzb246IHRydWUsXG4gICAgICAgICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVULFxuICAgICAgICAgICAgICBjb2RlOiBnc2VjcmV0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgICAgICAgbG9nKCdzdGF1czogJywgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgICAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICAgICAgICB9KTsqL1xuXG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3J0ID0gZW52LlNTTFBPUlQgfHwgNDQzO1xuICAgICAgICAgIGxvZygnSFRUUFMgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcG9ydCk7XG4gICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxufVxuIl19