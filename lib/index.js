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
    if (req.body.type !== 'action-selected' || req.body.userId === appId) {
      console.log('error %o', req.body);
      return;
    }
    if (res.statusCode !== 201) {
      log(res);
      return;
    }

    log('Got a message %o', req.body);
    gitConnect();

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwidXNlIiwic3RhdGljIiwiX19kaXJuYW1lIiwiZ2l0Q29ubmVjdCIsInVyaSIsImhlYWRlcnMiLCJxcyIsImNsaWVudF9pZCIsInByb2Nlc3MiLCJlbnYiLCJHSVRfQ0xJRU5UX0lEIiwiY2xpZW50X3NlY3JldCIsIkdJVF9DTElFTlRfU0VDUkVUIiwianNvbiIsInRoZW4iLCJkYXRhIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwic2NydW1ib3QiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsInN0YXR1c0NvZGUiLCJ0eXBlIiwiYW5ub3RhdGlvblR5cGUiLCJhbm5vdGF0aW9uUGF5bG9hZCIsInNlbmQiLCJzcGFjZUlkIiwiZm9ybWF0IiwidXNlck5hbWUiLCJpc3N1ZXNfdXJsIiwiZ2V0UmVwbyIsImdldCIsInJlc3BvbnNlIiwicGFyYW1zIiwicmVwbyIsImlzc3VlIiwiWkVOSFVCX1RPS0VOIiwicmVuZGVyIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwiRXJyb3IiLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0IiwiSlNPTiIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFHWjs7Ozs7Ozs7QUFYQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBU0E7O0FBRUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCO0FBQ0E7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjs7QUFFQU4sSUFBSU8sR0FBSixDQUFRVCxRQUFRVSxNQUFSLENBQWVDLFlBQVksT0FBM0IsQ0FBUjtBQUNBO0FBQ0FULElBQUlPLEdBQUosQ0FBUVQsUUFBUVUsTUFBUixDQUFlQyxZQUFZLFNBQTNCLENBQVI7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsYUFBYSxTQUFiQSxVQUFhLEdBQU07QUFDeEJQLEtBQUc7QUFDRlEsU0FBSyx5QkFESDs7QUFHRkMsYUFBUztBQUNMLG9CQUFjO0FBRFQsS0FIUDtBQU1GQyxRQUFJO0FBQ0Y7QUFDQTtBQUNFO0FBQ0FDLGlCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBSnZCO0FBS0FDLHFCQUFnQkgsUUFBUUMsR0FBUixDQUFZRztBQUw1QixLQU5GO0FBYUZDLFVBQU07QUFiSixHQUFILEVBZUVDLElBZkYsQ0FlTyxVQUFDQyxJQUFELEVBQVU7QUFDWmhCLGNBQVVnQixJQUFWO0FBQ0FqQixRQUFJaUIsSUFB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RDs7QUFFRCxRQUFHUixJQUFJbUUsSUFBUCxFQUFhO0FBQ1g5RSxVQUFJLGtDQUFKLEVBQXdDVyxJQUFJbUUsSUFBNUM7O0FBRVI7QUFFTyxLQUxEO0FBUUU7QUFDQUMsVUFBSUMsSUFBSixDQUFTckUsR0FBVCxFQUFjLFVBQUNRLEdBQUQsRUFBTTZELElBQU4sRUFBZTtBQUMzQixZQUFHN0QsR0FBSCxFQUFRO0FBQ044QixhQUFHOUIsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNOEQsT0FBT3RFLElBQUl1RSxPQUFKLElBQWUsR0FBNUI7QUFDQWxGLFlBQUksbUNBQUosRUFBeUNpRixJQUF6QztBQUNEO0FBQ0EsT0FSRDtBQVNILEdBN0JIO0FBOEJELENBakNEOztBQW1DQSxJQUFJdkYsUUFBUStFLElBQVIsS0FBaUJVLE1BQXJCLEVBQTRCO0FBQzFCVixPQUFLL0QsUUFBUWdFLElBQWIsRUFBbUJoRSxRQUFRQyxHQUEzQixFQUFnQyxVQUFDUSxHQUFELEVBQVM7O0FBRXZDLFFBQUdBLEdBQUgsRUFBUTtBQUNOQyxjQUFRcEIsR0FBUixDQUFZLHFCQUFaLEVBQW1DbUIsR0FBbkM7QUFDQTtBQUNEOztBQUVEbkIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEOztBQUVEO0FBQ0FWLEtBQUs4RixZQUFMLENBQWtCekYsR0FBbEIsRUFBdUIwRixNQUF2QixDQUE4QjNFLFFBQVFDLEdBQVIsQ0FBWW1FLElBQVosSUFBb0IsSUFBbEQ7QUFDQSxJQUFHcEUsUUFBUUMsR0FBUixDQUFZbUUsSUFBZixFQUFvQjtBQUNsQjlFLE1BQUksa0NBQUosRUFBd0NVLFFBQVFDLEdBQVIsQ0FBWW1FLElBQXBEO0FBQ0QsQ0FGRCxNQUVLO0FBQ0g5RSxNQUFJLHlCQUFKO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi93YXRzb24nO1xuXG4vL2ltcG9ydCAqIGFzIHNzbCBmcm9tICcuL3NzbCc7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuLy9yZXF1aXJlRW52KFsnbnBtX3BhY2thZ2Vfc2NyaXB0c19HSVRfQ0xJRU5UX0lEJywgJ25wbV9wYWNrYWdlX3NjcmlwdHNfR0lUX0NMSUVOVF9TRUNSRVQnLCAnbnBtX3BhY2thZ2Vfc2NyaXB0c19aRU5IVUJfVE9LRU4nXSk7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIG1lc3NhZ2U7XG5cbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMoX19kaXJuYW1lICsgJy92aWV3JykpO1xuLy9TdG9yZSBhbGwgSFRNTCBmaWxlcyBpbiB2aWV3IGZvbGRlci5cbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMoX19kaXJuYW1lICsgJy9zY3JpcHQnKSk7XG4vL1N0b3JlIGFsbCBKUyBhbmQgQ1NTIGluIFNjcmlwdHMgZm9sZGVyLlxuXG4vL3RvIHNob3cgaW4gYnJvd3NlclxuLy9zZXQgcm91dGUgZm9yIGhvbWVwYWdlIFxuY29uc3QgZ2l0Q29ubmVjdCA9ICgpID0+IHtcblx0cnAoe1xuXHRcdHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJyxcblx0XHRcblx0XHRoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuXHRcdH0sXG5cdFx0cXM6IHtcblx0XHQgIC8vcTogaWQsXG5cdFx0ICAvL2NsaWVudF9pZDogZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAvL2NsaWVudF9zZWNyZXQgOiBlbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQgOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuXHRcdH0sXG5cdFx0anNvbjogdHJ1ZVxuXHQgIH0pXG5cdFx0LnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhO1x0XG4gICAgICBsb2coZGF0YSlcbiAgICAgIFxuXHRcdCAgLy9yZXNwb25zZS5zZW5kKGRhdGEpXG5cdFx0fSlcblx0XHQuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuXHRcdCAgLy9yZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgIH0pXG5cdFxufTtcblxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSxyZXMpID0+IHtcbiAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcbiAgXG4gIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAgLy8gb3duIG1lc3NhZ2VzXG4gIGlmKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpe1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG4gICAgXG4gIH1cbiAgaWYocmVzLnN0YXR1c0NvZGUgIT09IDIwMSApIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZihyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAmJiByZXEuYm9keS5hbm5vdGF0aW9uVHlwZSA9PT0gJ2FjdGlvblNlbGVjdGVkJyl7ICBcbiAgICBjb25zdCBhbm5vdGF0aW9uUGF5bG9hZCA9IHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkO1xuICAgIC8vaWYgKGFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkID09PSAgJycpe1xuICAgICAgICBsb2cocmVxLmJvZHkpO1xuICAgIC8vfVxuXG4gIH0gIFxuXG4gIC8vaGFuZGxlIG5ldyBtZXNzYWdlcyBhbmQgaWdub3JlIHRoZSBhcHAncyBvd24gbWVzc2FnZXNcbiAgaWYocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtY3JlYXRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSBhcHBJZCl7ICBcbiAgICBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgZ2l0Q29ubmVjdCgpO1xuICAgIFxuICAgIC8vc2VuZCB0byBzcGFjZVxuICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UuaXNzdWVzX3VybCApLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZighZXJyKVxuICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICB9KVxuICB9O1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFJlcG8gPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLHJlcykgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuIFxuIC8vIE9ubHkgaGFuZGxlIG1lc3NhZ2UtY3JlYXRlZCBXZWJob29rIGV2ZW50cywgYW5kIGlnbm9yZSB0aGUgYXBwJ3NcbiAvLyBvd24gbWVzc2FnZXNcbiBpZihyZXEuYm9keS50eXBlICE9PSAnYWN0aW9uLXNlbGVjdGVkJyB8fCByZXEuYm9keS51c2VySWQgPT09IGFwcElkKXtcbiAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgIHJldHVybjtcbiAgIFxuIH1cbiBpZihyZXMuc3RhdHVzQ29kZSAhPT0gMjAxICkge1xuICAgbG9nKHJlcyk7XG4gICByZXR1cm47XG4gfVxuICAgXG4gbG9nKCdHb3QgYSBtZXNzYWdlICVvJywgcmVxLmJvZHkpO1xuIGdpdENvbm5lY3QoKTtcbiBcbiAvL3NlbmQgdG8gc3BhY2VcbiBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICB1dGlsLmZvcm1hdChcbiAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgIHJlcS5ib2R5LnVzZXJOYW1lLCBtZXNzYWdlLmlzc3Vlc191cmwgKSxcbiAgIHRva2VuKCksXG4gICAoZXJyLCByZXMpID0+IHtcbiAgICAgaWYoIWVycilcbiAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgfSlcbn07XG5cbmFwcC5nZXQoJy9yLzpyZXBvLzppc3N1ZScsZnVuY3Rpb24ocmVxdWVzdCxyZXNwb25zZSkge1xuXHRycCh7XG5cdFx0dXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nK3JlcXVlc3QucGFyYW1zLnJlcG8rJy9pc3N1ZXMvJytyZXF1ZXN0LnBhcmFtcy5pc3N1ZSxcblx0XHRcblx0XHRoZWFkZXJzOiB7XG5cdFx0XHQnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuXHRcdH0sXG5cdFxuXHRcdGpzb246IHRydWVcbiAgIFx0fSlcblx0XHQudGhlbigoZGF0YSkgPT4ge1xuXHRcdCAgLy9jb25zb2xlLmxvZyhkYXRhKVxuXHRcdCAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuXHRcdH0pXG5cdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHQgIGNvbnNvbGUubG9nKGVycilcblx0XHQgIHJlc3BvbnNlLnJlbmRlcignZXJyb3InKVxuICAgIH0pXG4gIH0pO1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZihlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZihyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgIT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiKSA9PiB7XG4gIC8vIEF1dGhlbnRpY2F0ZSB0aGUgYXBwIGFuZCBnZXQgYW4gT0F1dGggdG9rZW5cbiAgb2F1dGgucnVuKGFwcElkLCBzZWNyZXQsIChlcnIsIHRva2VuKSA9PiB7XG4gICAgaWYoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgICAgfSksXG5cbiAgICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgICAgc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcbiAgXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgXG4gICAgICBpZihlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIrZXJyKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuLy8gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG4gICAgICAgIFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIC8vIExpc3RlbiBvbiB0aGUgY29uZmlndXJlZCBIVFRQUyBwb3J0LCBkZWZhdWx0IHRvIDQ0M1xuICAgICAgICBzc2wuY29uZihlbnYsIChlcnIsIGNvbmYpID0+IHtcbiAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKXtcbiAgbWFpbihwcm9jZXNzLmFyZ3YsIHByb2Nlc3MuZW52LCAoZXJyKSA9PiB7XG4gICAgXG4gICAgaWYoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3Igc3RhcnRpbmcgYXBwOicsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG4gIFxufVxuXG4vL3NldCBsaXN0ZW5pbmcgcG9ydFxuaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4ocHJvY2Vzcy5lbnYuUE9SVCB8fCA5MDAwKTtcbmlmKHByb2Nlc3MuZW52LlBPUlQpe1xuICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgcHJvY2Vzcy5lbnYuUE9SVCk7XG59ZWxzZXtcbiAgbG9nKCdydW5uaW5nIG9uIHBvcnQgOTAwMC4uLicpOyAgXG59XG4iXX0=