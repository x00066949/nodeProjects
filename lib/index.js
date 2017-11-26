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

//import * as ssl from './ssl';

var bodyParser = require('body-parser');
var path = require('path');
var rp = require('request-promise');
var requireEnv = require("require-environment-variables");
//requireEnv(['npm_package_scripts_GIT_CLIENT_ID', 'npm_package_scripts_GIT_CLIENT_SECRET', 'npm_package_scripts_ZENHUB_TOKEN']);

// Setup debug log
var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');

var message;
var content;

app.use(express.static(__dirname + '/view'));
//Store all HTML files in view folder.
app.use(express.static(__dirname + '/script'));
//Store all JS and CSS in Scripts folder.

//to show in browser
//set route for homepage 
var gitConnect = function gitConnect() {
  rp({
    uri: 'https://api.github.com/',

    headers: {
      'User-Agent': 'simple_rest_app'
    },
    qs: {
      //q: id,
      //client_id: env.GIT_CLIENT_ID,
      //client_secret : env.GIT_CLIENT_SECRET
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

var getRepo = /*istanbul ignore next*/exports.getRepo = function getRepo(appId, token) /*istanbul ignore next*/{
  return function (req, res) {
    // Respond to the Webhook right away, as the response message will
    // be sent asynchronously
    res.status(201).end();

    // Only handle message-created Webhook events, and ignore the app's
    // own messages
    if (req.body.type !== 'message-created' || req.body.userId === appId) {
      console.log('error %o', req.body);
      return;
    }
    if (res.statusCode !== 201) {
      log(res);
      return;
    }

    log('Got a message %o', req.body);

    //send to space
    send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, message.issues_url), token(), function (err, res) {
      if (!err) log('Sent message to space %s', req.body.spaceId);
    });
  };
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

      //        http.createServer(app).listen(env.PORT, cb);
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

//set listening port
http.createServer(app).listen(process.env.PORT || 9000);
if (process.env.PORT) {
  log('HTTP server listening on port %d', process.env.PORT);
} else {
  log('running on port 9000...');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwiY29udGVudCIsInVzZSIsInN0YXRpYyIsIl9fZGlybmFtZSIsImdpdENvbm5lY3QiLCJ1cmkiLCJoZWFkZXJzIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiZW52IiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsInNjcnVtYm90IiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ1c2VySWQiLCJzdGF0dXNDb2RlIiwidHlwZSIsImFubm90YXRpb25UeXBlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiaXNzdWVzX3VybCIsImdldFJlcG8iLCJnZXQiLCJyZXNwb25zZSIsInBhcmFtcyIsInJlcG8iLCJpc3N1ZSIsIlpFTkhVQl9UT0tFTiIsInJlbmRlciIsInRleHQiLCJ0b2siLCJjYiIsInBvc3QiLCJBdXRob3JpemF0aW9uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsIkVycm9yIiwiZGlhbG9nIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBR1o7Ozs7Ozs7O0FBWEEsSUFBSUMsVUFBVUMsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFJQyxNQUFNRixTQUFWOztBQVNBOztBQUVBLElBQUlHLGFBQWFGLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQUlHLE9BQU9ILFFBQVEsTUFBUixDQUFYO0FBQ0EsSUFBSUksS0FBS0osUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUssYUFBYUwsUUFBUSwrQkFBUixDQUFqQjtBQUNBOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKOztBQUVBUCxJQUFJUSxHQUFKLENBQVFWLFFBQVFXLE1BQVIsQ0FBZUMsWUFBWSxPQUEzQixDQUFSO0FBQ0E7QUFDQVYsSUFBSVEsR0FBSixDQUFRVixRQUFRVyxNQUFSLENBQWVDLFlBQVksU0FBM0IsQ0FBUjtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFNQyxhQUFhLFNBQWJBLFVBQWEsR0FBTTtBQUN2QlIsS0FBRztBQUNEUyxTQUFLLHlCQURKOztBQUdEQyxhQUFTO0FBQ1Asb0JBQWM7QUFEUCxLQUhSO0FBTURDLFFBQUk7QUFDRjtBQUNBO0FBQ0E7QUFDQUMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFKckI7QUFLRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFMekIsS0FOSDtBQWFEQyxVQUFNO0FBYkwsR0FBSCxFQWVHQyxJQWZILENBZVEsVUFBQ0MsSUFBRCxFQUFVO0FB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RCxJQUFOLEVBQWU7QUFDM0IsWUFBSTlELEdBQUosRUFBUztBQUNQOEIsYUFBRzlCLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTStELE9BQU92RSxJQUFJd0UsT0FBSixJQUFlLEdBQTVCO0FBQ0FwRixZQUFJLG1DQUFKLEVBQXlDbUYsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQTdCSDtBQThCRCxDQWpDRDs7QUFtQ0EsSUFBSXpGLFFBQVFpRixJQUFSLEtBQWlCVSxNQUFyQixFQUE2QjtBQUMzQlYsT0FBS2hFLFFBQVFpRSxJQUFiLEVBQW1CakUsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQ1EsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUEMsY0FBUXJCLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ29CLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRHBCLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRDs7QUFFRDtBQUNBVixLQUFLZ0csWUFBTCxDQUFrQjNGLEdBQWxCLEVBQXVCNEYsTUFBdkIsQ0FBOEI1RSxRQUFRQyxHQUFSLENBQVlvRSxJQUFaLElBQW9CLElBQWxEO0FBQ0EsSUFBSXJFLFFBQVFDLEdBQVIsQ0FBWW9FLElBQWhCLEVBQXNCO0FBQ3BCaEYsTUFBSSxrQ0FBSixFQUF3Q1csUUFBUUMsR0FBUixDQUFZb0UsSUFBcEQ7QUFDRCxDQUZELE1BRU87QUFDTGhGLE1BQUkseUJBQUo7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5cbi8vaW1wb3J0ICogYXMgc3NsIGZyb20gJy4vc3NsJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG4vL3JlcXVpcmVFbnYoWyducG1fcGFja2FnZV9zY3JpcHRzX0dJVF9DTElFTlRfSUQnLCAnbnBtX3BhY2thZ2Vfc2NyaXB0c19HSVRfQ0xJRU5UX1NFQ1JFVCcsICducG1fcGFja2FnZV9zY3JpcHRzX1pFTkhVQl9UT0tFTiddKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgbWVzc2FnZTtcbnZhciBjb250ZW50O1xuXG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKF9fZGlybmFtZSArICcvdmlldycpKTtcbi8vU3RvcmUgYWxsIEhUTUwgZmlsZXMgaW4gdmlldyBmb2xkZXIuXG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKF9fZGlybmFtZSArICcvc2NyaXB0JykpO1xuLy9TdG9yZSBhbGwgSlMgYW5kIENTUyBpbiBTY3JpcHRzIGZvbGRlci5cblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIC8vcTogaWQsXG4gICAgICAvL2NsaWVudF9pZDogZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAvL2NsaWVudF9zZWNyZXQgOiBlbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhO1xuICAgICAgbG9nKGRhdGEpXG5cbiAgICAgIC8vcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgIC8vcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICB9KVxuXG59O1xuXG5leHBvcnQgY29uc3Qgc2NydW1ib3QgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcblxuICB9XG4gIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgbG9nKHJlcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnICYmIHJlcS5ib2R5LmFubm90YXRpb25UeXBlID09PSAnYWN0aW9uU2VsZWN0ZWQnKSB7XG4gICAgY29uc3QgYW5ub3RhdGlvblBheWxvYWQgPSByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZDtcbiAgICAvL2lmIChhbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCA9PT0gICcnKXtcbiAgICBsb2cocmVxLmJvZHkpO1xuICAgIC8vfVxuXG4gIH1cblxuICAvL2hhbmRsZSBuZXcgbWVzc2FnZXMgYW5kIGlnbm9yZSB0aGUgYXBwJ3Mgb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1jcmVhdGVkJyAmJiByZXEuYm9keS51c2VySWQgIT09IGFwcElkKSB7XG4gICAgbG9nKCdHb3QgYSBtZXNzYWdlICVvJywgcmVxLmJvZHkpO1xuXG4gICAgLy9jYWxsIGdpdGNvbm5lY3QgZnVuY3Rpb25cbiAgICBnaXRDb25uZWN0KCk7XG4gICAgXG5cbiAgICAvL3NlbmQgdG8gc3BhY2VcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlLmlzc3Vlc191cmwpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgfSlcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRSZXBvID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudHlwZSAhPT0gJ21lc3NhZ2UtY3JlYXRlZCcgfHwgcmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgXG4gIC8vc2VuZCB0byBzcGFjZVxuICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgdXRpbC5mb3JtYXQoXG4gICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlLmlzc3Vlc191cmwpLFxuICAgIHRva2VuKCksXG4gICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoIWVycilcbiAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICB9KVxufTtcblxuYXBwLmdldCgnL3IvOnJlcG8vOmlzc3VlJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXF1ZXN0LnBhcmFtcy5yZXBvICsgJy9pc3N1ZXMvJyArIHJlcXVlc3QucGFyYW1zLmlzc3VlLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICB9LFxuXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGRhdGEpXG4gICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgcmVzcG9uc2UucmVuZGVyKCdlcnJvcicpXG4gICAgfSlcbn0pO1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICBhY3Rvcjoge1xuICAgICAgICAgICAgbmFtZTogJ2dpdGh1YiBpc3N1ZSBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgIT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYikgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICBzY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIC8vICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG5cbi8vc2V0IGxpc3RlbmluZyBwb3J0XG5odHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3Rlbihwcm9jZXNzLmVudi5QT1JUIHx8IDkwMDApO1xuaWYgKHByb2Nlc3MuZW52LlBPUlQpIHtcbiAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHByb2Nlc3MuZW52LlBPUlQpO1xufSBlbHNlIHtcbiAgbG9nKCdydW5uaW5nIG9uIHBvcnQgOTAwMC4uLicpO1xufVxuIl19