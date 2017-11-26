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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwidXNlIiwic3RhdGljIiwiX19kaXJuYW1lIiwiZ2l0Q29ubmVjdCIsInVyaSIsImhlYWRlcnMiLCJxcyIsImNsaWVudF9pZCIsInByb2Nlc3MiLCJlbnYiLCJHSVRfQ0xJRU5UX0lEIiwiY2xpZW50X3NlY3JldCIsIkdJVF9DTElFTlRfU0VDUkVUIiwianNvbiIsInRoZW4iLCJkYXRhIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwic2NydW1ib3QiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsInN0YXR1c0NvZGUiLCJ0eXBlIiwiYW5ub3RhdGlvblR5cGUiLCJhbm5vdGF0aW9uUGF5bG9hZCIsInNlbmQiLCJzcGFjZUlkIiwiZm9ybWF0IiwidXNlck5hbWUiLCJpc3N1ZXNfdXJsIiwiZ2V0UmVwbyIsImdldCIsInJlc3BvbnNlIiwicGFyYW1zIiwicmVwbyIsImlzc3VlIiwiWkVOSFVCX1RPS0VOIiwicmVuZGVyIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJuYW1lIiwiRXJyb3IiLCJkaWFsb2ciLCJ2ZXJpZnkiLCJ3c2VjcmV0IiwiYnVmIiwiZW5jb2RpbmciLCJ1cGRhdGUiLCJkaWdlc3QiLCJjaGFsbGVuZ2UiLCJuZXh0IiwiSlNPTiIsInN0cmluZ2lmeSIsInNldCIsIndlYmFwcCIsInNlY3JldCIsInJ1biIsIm1haW4iLCJhcmd2IiwiU0NSVU1CT1RfQVBQSUQiLCJTQ1JVTUJPVF9TRUNSRVQiLCJTQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCIsIlBPUlQiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJjcmVhdGVTZXJ2ZXIiLCJsaXN0ZW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsTzs7QUFDWjs7QUFDQTs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsSzs7QUFHWjs7Ozs7Ozs7QUFYQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBU0E7O0FBRUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCO0FBQ0E7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjs7QUFFQU4sSUFBSU8sR0FBSixDQUFRVCxRQUFRVSxNQUFSLENBQWVDLFlBQVksT0FBM0IsQ0FBUjtBQUNBO0FBQ0FULElBQUlPLEdBQUosQ0FBUVQsUUFBUVUsTUFBUixDQUFlQyxZQUFZLFNBQTNCLENBQVI7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsYUFBYSxTQUFiQSxVQUFhLEdBQU07QUFDeEJQLEtBQUc7QUFDRlEsU0FBSyx5QkFESDs7QUFHRkMsYUFBUztBQUNMLG9CQUFjO0FBRFQsS0FIUDtBQU1GQyxRQUFJO0FBQ0Y7QUFDQTtBQUNFO0FBQ0FDLGlCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBSnZCO0FBS0FDLHFCQUFnQkgsUUFBUUMsR0FBUixDQUFZRztBQUw1QixLQU5GO0FBYUZDLFVBQU07QUFiSixHQUFILEVBZUVDLElBZkYsQ0FlTyxVQUFDQyxJQUFELEVBQVU7QUFDWmhCLGNBQVVnQixJQUFWO0FBQ0FqQixR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RCxHQUFILEVBQVE7QUFDTjhCLGFBQUc5QixHQUFIO0FBQ0E7QUFDRDtBQUNELFlBQU0rRCxPQUFPdkUsSUFBSXdFLE9BQUosSUFBZSxHQUE1QjtBQUNBbkYsWUFBSSxtQ0FBSixFQUF5Q2tGLElBQXpDO0FBQ0Q7QUFDQSxPQVJEO0FBU0gsR0E3Qkg7QUE4QkQsQ0FqQ0Q7O0FBbUNBLElBQUl4RixRQUFRZ0YsSUFBUixLQUFpQlUsTUFBckIsRUFBNEI7QUFDMUJWLE9BQUtoRSxRQUFRaUUsSUFBYixFQUFtQmpFLFFBQVFDLEdBQTNCLEVBQWdDLFVBQUNRLEdBQUQsRUFBUzs7QUFFdkMsUUFBR0EsR0FBSCxFQUFRO0FBQ05DLGNBQVFwQixHQUFSLENBQVkscUJBQVosRUFBbUNtQixHQUFuQztBQUNBO0FBQ0Q7O0FBRURuQixRQUFJLGFBQUo7QUFDRCxHQVJEO0FBVUQ7O0FBRUQ7QUFDQVYsS0FBSytGLFlBQUwsQ0FBa0IxRixHQUFsQixFQUF1QjJGLE1BQXZCLENBQThCNUUsUUFBUUMsR0FBUixDQUFZb0UsSUFBWixJQUFvQixJQUFsRDtBQUNBLElBQUdyRSxRQUFRQyxHQUFSLENBQVlvRSxJQUFmLEVBQW9CO0FBQ2xCL0UsTUFBSSxrQ0FBSixFQUF3Q1UsUUFBUUMsR0FBUixDQUFZb0UsSUFBcEQ7QUFDRCxDQUZELE1BRUs7QUFDSC9FLE1BQUkseUJBQUo7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5cbi8vaW1wb3J0ICogYXMgc3NsIGZyb20gJy4vc3NsJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG4vL3JlcXVpcmVFbnYoWyducG1fcGFja2FnZV9zY3JpcHRzX0dJVF9DTElFTlRfSUQnLCAnbnBtX3BhY2thZ2Vfc2NyaXB0c19HSVRfQ0xJRU5UX1NFQ1JFVCcsICducG1fcGFja2FnZV9zY3JpcHRzX1pFTkhVQl9UT0tFTiddKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgbWVzc2FnZTtcblxuYXBwLnVzZShleHByZXNzLnN0YXRpYyhfX2Rpcm5hbWUgKyAnL3ZpZXcnKSk7XG4vL1N0b3JlIGFsbCBIVE1MIGZpbGVzIGluIHZpZXcgZm9sZGVyLlxuYXBwLnVzZShleHByZXNzLnN0YXRpYyhfX2Rpcm5hbWUgKyAnL3NjcmlwdCcpKTtcbi8vU3RvcmUgYWxsIEpTIGFuZCBDU1MgaW4gU2NyaXB0cyBmb2xkZXIuXG5cbi8vdG8gc2hvdyBpbiBicm93c2VyXG4vL3NldCByb3V0ZSBmb3IgaG9tZXBhZ2UgXG5jb25zdCBnaXRDb25uZWN0ID0gKCkgPT4ge1xuXHRycCh7XG5cdFx0dXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nLFxuXHRcdFxuXHRcdGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG5cdFx0fSxcblx0XHRxczoge1xuXHRcdCAgLy9xOiBpZCxcblx0XHQgIC8vY2xpZW50X2lkOiBlbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIC8vY2xpZW50X3NlY3JldCA6IGVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldCA6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG5cdFx0fSxcblx0XHRqc29uOiB0cnVlXG5cdCAgfSlcblx0XHQudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbWVzc2FnZSA9IGRhdGE7XHRcbiAgICAgIGxvZyhkYXRhKVxuICAgICAgXG5cdFx0ICAvL3Jlc3BvbnNlLnNlbmQoZGF0YSlcblx0XHR9KVxuXHRcdC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG5cdFx0ICAvL3Jlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgfSlcblx0XG59O1xuXG5leHBvcnQgY29uc3Qgc2NydW1ib3QgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLHJlcykgPT4ge1xuICAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICBcbiAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCl7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgIHJldHVybjtcbiAgICBcbiAgfVxuICBpZihyZXMuc3RhdHVzQ29kZSAhPT0gMjAxICkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmKHJlcS5ib2R5LnR5cGUgPT09ICdtZXNzYWdlLWFubm90YXRpb24tYWRkZWQnICYmIHJlcS5ib2R5LmFubm90YXRpb25UeXBlID09PSAnYWN0aW9uU2VsZWN0ZWQnKXsgIFxuICAgIGNvbnN0IGFubm90YXRpb25QYXlsb2FkID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQ7XG4gICAgLy9pZiAoYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQgPT09ICAnJyl7XG4gICAgICAgIGxvZyhyZXEuYm9keSk7XG4gICAgLy99XG5cbiAgfSAgXG5cbiAgLy9oYW5kbGUgbmV3IG1lc3NhZ2VzIGFuZCBpZ25vcmUgdGhlIGFwcCdzIG93biBtZXNzYWdlc1xuICBpZihyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1jcmVhdGVkJyAmJiByZXEuYm9keS51c2VySWQgIT09IGFwcElkKXsgIFxuICAgIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgICBnaXRDb25uZWN0KCk7XG4gICAgXG4gICAgLy9zZW5kIHRvIHNwYWNlXG4gICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgbWVzc2FnZS5pc3N1ZXNfdXJsICksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgIH0pXG4gIH07XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UmVwbyA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEscmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gXG4gLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuIC8vIG93biBtZXNzYWdlc1xuIGlmKHJlcS5ib2R5LnR5cGUgIT09ICdhY3Rpb24tc2VsZWN0ZWQnIHx8IHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpe1xuICAgY29uc29sZS5sb2coJ2Vycm9yICVvJywgcmVxLmJvZHkpO1xuICAgcmV0dXJuO1xuICAgXG4gfVxuIGlmKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEgKSB7XG4gICBsb2cocmVzKTtcbiAgIHJldHVybjtcbiB9XG4gICBcbiBsb2coJ0dvdCBhIG1lc3NhZ2UgJW8nLCByZXEuYm9keSk7XG4gZ2l0Q29ubmVjdCgpO1xuIFxuIC8vc2VuZCB0byBzcGFjZVxuIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgIHV0aWwuZm9ybWF0KFxuICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UuaXNzdWVzX3VybCApLFxuICAgdG9rZW4oKSxcbiAgIChlcnIsIHJlcykgPT4ge1xuICAgICBpZighZXJyKVxuICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICB9KVxufTtcblxuYXBwLmdldCgnL3IvOnJlcG8vOmlzc3VlJyxmdW5jdGlvbihyZXF1ZXN0LHJlc3BvbnNlKSB7XG5cdHJwKHtcblx0XHR1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycrcmVxdWVzdC5wYXJhbXMucmVwbysnL2lzc3Vlcy8nK3JlcXVlc3QucGFyYW1zLmlzc3VlLFxuXHRcdFxuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG5cdFx0fSxcblx0XG5cdFx0anNvbjogdHJ1ZVxuICAgXHR9KVxuXHRcdC50aGVuKChkYXRhKSA9PiB7XG5cdFx0ICAvL2NvbnNvbGUubG9nKGRhdGEpXG5cdFx0ICByZXNwb25zZS5zZW5kKGRhdGEpXG5cdFx0fSlcblx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdCAgY29uc29sZS5sb2coZXJyKVxuXHRcdCAgcmVzcG9uc2UucmVuZGVyKCdlcnJvcicpXG4gICAgfSlcbiAgfSk7XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vL2RpYWxvZ1xuY29uc3QgZGlhbG9nID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmKGVyciB8fCByZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZygnRXJyb3Igc2VuZGluZyBtZXNzYWdlICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2coJ1NlbmQgcmVzdWx0ICVkLCAlbycsIHJlcy5zdGF0dXNDb2RlLCByZXMuYm9keSk7XG4gICAgICBjYihudWxsLCByZXMuYm9keSk7XG4gICAgfSk7XG59O1xuXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSAhPT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpKSB7XG4gICAgbG9nKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZihlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgICAgLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlIGFuZCBwYXJzZSByZXF1ZXN0IGJvZHlcbiAgICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgICB2ZXJpZnk6IHZlcmlmeSh3c2VjcmV0KVxuICAgICAgICB9KSxcblxuICAgICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgICAgY2hhbGxlbmdlKHdzZWNyZXQpLFxuXG4gICAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgICBzY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuICBcbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG4gICAgICBcbiAgICAgIGlmKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIitlcnIpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZihlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4vLyAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgLy8gaHR0cHMuY3JlYXRlU2VydmVyKGNvbmYsIGFwcCkubGlzdGVuKHBvcnQsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpe1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcbiAgICBcbiAgICBpZihlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcbiAgXG59XG5cbi8vc2V0IGxpc3RlbmluZyBwb3J0XG5odHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3Rlbihwcm9jZXNzLmVudi5QT1JUIHx8IDkwMDApO1xuaWYocHJvY2Vzcy5lbnYuUE9SVCl7XG4gIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwcm9jZXNzLmVudi5QT1JUKTtcbn1lbHNle1xuICBsb2coJ3J1bm5pbmcgb24gcG9ydCA5MDAwLi4uJyk7ICBcbn1cbiJdfQ==