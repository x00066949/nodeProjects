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
      var to_split = req.body;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwiY29udGVudCIsImdzZWNyZXQiLCJnaXRDb25uZWN0IiwidXJpIiwiaGVhZGVycyIsInFzIiwiY2xpZW50X2lkIiwicHJvY2VzcyIsImVudiIsIkdJVF9DTElFTlRfSUQiLCJjbGllbnRfc2VjcmV0IiwiR0lUX0NMSUVOVF9TRUNSRVQiLCJqc29uIiwidGhlbiIsImRhdGEiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJzY3J1bWJvdCIsImFwcElkIiwidG9rZW4iLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwic3RhdHVzQ29kZSIsInR5cGUiLCJhbm5vdGF0aW9uVHlwZSIsImFubm90YXRpb25QYXlsb2FkIiwidG9fc3BsaXQiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiaXNzdWVzX3VybCIsImdldFJlcG8iLCJyZXBvTmFtZSIsImdldF9pc3N1ZSIsInJlcGlkIiwiaXNzdWVpZCIsImdldCIsInJlc3BvbnNlIiwicmVwb2lkIiwiWkVOSFVCX1RPS0VOIiwicmVuZGVyIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwiRXJyb3IiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0IiwiSlNPTiIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFFWjs7Ozs7Ozs7QUFWQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBVUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKO0FBQ0EsSUFBSUMsT0FBSjs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsYUFBYSxTQUFiQSxVQUFhLEdBQU07QUFDdkJOLEtBQUc7QUFDRE8sU0FBSyx5QkFESjs7QUFHREMsYUFBUztBQUNQLG9CQUFjO0FBRFAsS0FIUjtBQU1EQyxRQUFJO0FBQ0ZDLGlCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBRHJCO0FBRUZDLHFCQUFlSCxRQUFRQyxHQUFSLENBQVlHO0FBRnpCLEtBTkg7QUFVREMsVUFBTTtBQVZMLEdBQUgsRUFZR0MsSUFaSCxDQVlRLFVBQUNDLElBQUQsRUFBVTtBQUNkZixjQUFVZSxJQUFWO0FBQ0FoQixRQUFJZ0IsSUFBSjs7QUFFQTtBQUNELEdBakJILEVBa0JHQyxLQWxCSCxDQWtCUyxVQUFDQyxHQUFELEVBQVM7QUFDZEMsWUFBUW5CLEdBQVIsQ0FBWWtCLEdBQVo7QUFDQTtB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LCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciBtZXNzYWdlO1xudmFyIGNvbnRlbnQ7XG52YXIgZ3NlY3JldDtcblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgbG9nKGRhdGEpXG5cbiAgICAgIC8vcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIC8vcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICB9KVxuXG59O1xuXG5leHBvcnQgY29uc3Qgc2NydW1ib3QgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnICYmIHJlcS5ib2R5LmFubm90YXRpb25UeXBlID09PSAnYWN0aW9uU2VsZWN0ZWQnKSB7XG4gICAgY29uc3QgYW5ub3RhdGlvblBheWxvYWQgPSByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZDtcbiAgICAvL2lmIChhbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCA9PT0gICcnKXtcbiAgICBsb2cocmVxLmJvZHkpO1xuICAgIC8vfVxuXG4gIH1cblxuICAvL2hhbmRsZSBuZXcgbWVzc2FnZXMgYW5kIGlnbm9yZSB0aGUgYXBwJ3Mgb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1jcmVhdGVkJyAmJiByZXEuYm9keS51c2VySWQgIT09IGFwcElkKSB7XG4gICAgbG9nKCdHb3QgYSBtZXNzYWdlICVvJywgcmVxLmJvZHkpO1xuICAgIHZhciB0b19zcGxpdCA9IHJlcS5ib2R5O1xuXG5cbiAgICAvL2NhbGwgZ2l0Y29ubmVjdCBmdW5jdGlvblxuICAgIGdpdENvbm5lY3QoKTtcbiAgICBcblxuICAgIC8vc2VuZCB0byBzcGFjZVxuICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UuaXNzdWVzX3VybCksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmICghZXJyKVxuICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICB9O1xufTtcblxuXG5cblxuXG5cbmV4cG9ydCBjb25zdCBnZXRSZXBvID0gKHJlcG9OYW1lKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcbiAgcnAoe1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICBcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgbG9nKGRhdGEpXG5cbiAgICAgIC8vcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIC8vcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICB9KVxuXG5cbiAgXG59O1xuXG5jb25zdCBnZXRfaXNzdWUgPSAocmVwaWQsIGlzc3VlaWQpID0+e1xuICBhcHAuZ2V0KGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgIHJwKHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9pZCArICcvaXNzdWVzLycgKyBpc3N1ZWlkLFxuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgICB9LFxuXG4gICAgICBqc29uOiB0cnVlXG4gICAgfSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIC8vY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgcmVzcG9uc2UucmVuZGVyKCdlcnJvcicpXG4gICAgICB9KVxuICB9KTtcbn07XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLypcbi8vZGlhbG9nXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuKi9cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSAhPT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL3NjcnVtYm90JyxcblxuICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgIHR5cGU6ICcqLyonLFxuICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgfSksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgIHNjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICBycCh7XG4gICAgICAgICAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuICAgICAgICBcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgIHJlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICAvKmFwcC5nZXQoJy9jYWxsYmFjay8nLCBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcS5xdWVyeSk7IFxuICAgICAgICAgICAgZ3NlY3JldCA9IHJlcS5xdWVyeS5jb2RlO1xuICAgICAgICAgICAgcmVzLnNlbmQoXCJIaVwiK2dzZWNyZXQpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFwcC5wb3N0KFxuICAgICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vbG9naW4vb2F1dGgvYWNjZXNzX3Rva2VuJywge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgICAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVCxcbiAgICAgICAgICAgICAgY29kZTogZ3NlY3JldFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgICAgICAgIGxvZygnc3RhdXM6ICcsIHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICAgICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgICAgICAgfSk7Ki9cblxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==