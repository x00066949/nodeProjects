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

    //handle new messages and ignore the app's own messages
    if (req.body.type === 'message-created' && req.body.userId !== appId) {
      log('Got a message %o', req.body);
      log('content : ' + req.body.content);

      var message1 = req.body.content;

      var to_post = board.getScrumData({ request: req, response: res, UserInput: message1 });
      console.dir(to_post, { depth: null });

      send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsIm1lc3NhZ2UiLCJjb250ZW50IiwiZ3NlY3JldCIsImdpdENvbm5lY3QiLCJ1cmkiLCJoZWFkZXJzIiwicXMiLCJjbGllbnRfaWQiLCJwcm9jZXNzIiwiZW52IiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImlzc3Vlc191cmwiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJnZXRfaXNzdWUiLCJyZXBvaWQiLCJpc3N1ZWlkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwic2NydW1ib3QiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsInN0YXR1c0NvZGUiLCJ0eXBlIiwibWVzc2FnZTEiLCJ0b19wb3N0IiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJkaXIiLCJkZXB0aCIsInNlbmQiLCJzcGFjZUlkIiwiZm9ybWF0IiwidXNlck5hbWUiLCJnZXRSZXBvIiwicmVwb05hbWUiLCJ0ZXh0IiwidG9rIiwiY2IiLCJwb3N0IiwiQXV0aG9yaXphdGlvbiIsInZlcnNpb24iLCJhbm5vdGF0aW9ucyIsImNvbG9yIiwidGl0bGUiLCJhY3RvciIsIkVycm9yIiwidmVyaWZ5Iiwid3NlY3JldCIsImJ1ZiIsImVuY29kaW5nIiwiZ2V0IiwidXBkYXRlIiwiZGlnZXN0IiwiY2hhbGxlbmdlIiwibmV4dCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwic3NsIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUVaOzs7Ozs7OztBQVhBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFXQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKOztBQUVBO0FBQ0E7QUFDQSxJQUFNQyxhQUFhLFNBQWJBLFVBQWEsR0FBTTtBQUN2Qk4sS0FBRztBQUNETyxTQUFLLHlCQURKOztBQUdEQyxhQUFTO0FBQ1Asb0JBQWM7QUFEUCxLQUhSO0FBTURDLFFBQUk7QUFDRkMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFEckI7QUFFRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFGekIsS0FOSDtBQVVEQyxVQUFNO0FBVkwsR0FBSCxFQVlHQyxJQVpILENBWVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2RmLGNBQVVlLEtBQUtDLFVBQWY7QUFFRCxHQWZILEVBZ0JHQyxLQWhCSCxDQWdCUyxVQUFDQyxHQUFELEVBQVM7QUFDZEMsWUFBUXBCLEdBQVIsQ0FBWW1CLEdBQVo7QUFDRCxHQWxCSDtBQW9CRCxDQXJCRDs7QUF1QkEsSUFBTUUsWUFBWSxTQUFaQSxTQUFZLENBQUNDLE1BQUQsRUFBU0MsT0FBVCxFQUFvQjtBQUNsQ3pCLEtBQUc7QUFDRE8sU0FBSywyQ0FBMkNpQixNQUEzQyxHQUFvRCxVQUFwRCxHQUFpRUMsT0FEckU7O0FBR0RqQixhQUFTO0FBQ1AsZ0NBQTBCRyxRQUFRQyxHQUFSLENBQVljO0FBRC9CLEtBSFI7O0FBT0RWLFVBQU07QUFQTCxHQUFILEVBU0dDLElBVEgsQ0FTUSxVQUFDQyxJQUFELEVBQVU7O0FBRWRmLGNBQVVlLEtBQUtTLFFBQUwsQ0FBY0MsSUFBeEI7QUFDQTFCLFFBQUlnQixJQUFKO0FBQ0FoQixRQUFJLGVBQWFDLE9BQWpCO0FBQ0QsR0FkSCxFQWVHaUIsS0FmSCxDQWVTLFVBQUNDLEdBQUQsRUFBUztBQUNkQyxZQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUVELEdBbEJIO0FBbUJILENBcEJEOztBQXNCTyxJQUFNUSxzREFBVyxTQUFYQSxRQUFXLENBQUNDLEtBQUQsRUFBUUMsS0FBUjtBQUFBLFNBQWtCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ3REO0FBQ0E7QUFDQUEsUUFBSUMsTUFBSixDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCOztBQUVBO0FBQ0E7QUFDQSxRQUFJSCxJQUFJSSxJQUFKLENBQVNDLE1BQVQsS0FBb0JQLEtBQXhCLEVBQStCO0FBQzdCUixjQUFRcEIsR0FBUixDQUFZLFVBQVosRUFBd0I4QixJQUFJSSxJQUE1QjtBQUNBO0FBRUQ7QUFDRCxRQUFJSCxJQUFJSyxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCcEMsVUFBSStCLEdBQUo7QUFDQTtBQUNEOztBQUVEO0FBQ0EsUUFBSUQsSUFBSUksSUFBSixDQUFTRyxJQUFULEtBQWtCLGlCQUFsQixJQUF1Q1AsSUFBSUksSUFBSixDQUFTQyxNQUFULEtBQW9CUCxLQUEvRCxFQUFzRTtBQUNwRTVCLFVBQUksa0JBQUosRUFBd0I4QixJQUFJSSxJQUE1QjtBQUNBbEMsVUFBSSxlQUFhOEIsSUFBSUksSUFBSixDQUFTaEMsT0FBMUI7O0FBRUEsVUFBSW9DLFdBQVdSLElBQUlJLElBQUosQ0FBU2hDLE9BQXhCOztBQUVBLFVBQUlxQyxVQUFVL0MsTUFBTWdELFlBQU4sQ0FBbUIsRUFBQ3RELFNBQVE0QyxHQUFULEVBQWNXLFVBQVNWLEdBQXZCLEVBQTRCVyxXQUFVSixRQUF0QyxFQUFuQixDQUFkO0FBQ0FsQixjQUFRdUIsR0FBUixDQUFZSixPQUFaLEVBQXFCLEVBQUNLLE9BQU0sSUFBUCxFQUFyQjs7QUFJQUMsV0FBS2YsSUFBSUksSUFBSixDQUFTWSxPQUFkLEVBQ0UzRCxLQUFLNEQsTUFBTCxDQUNFLHVCQURGLEVBRUVqQixJQUFJSSxJQUFKLENBQVNjLFFBRlgsRUFFcUJULE9BRnJCLENBREYsRUFJRVYsT0FKRixFQUtFLFVBQUNWLEdBQUQsRUFBTVksR0FBTixFQUFjO0FBQ1osWUFBSSxDQUFDWixHQUFMLEVBQ0VuQixJQUFJLDBCQUFKLEVBQWdDOEIsSUFBSUksSUFBSixDQUFTWSxPQUF6QztBQUNMLE9BUkQ7QUFVRDtBQUNGLEdBeEN1QjtBQUFBLENBQWpCOztBQTBDQSxJQUFNRyxvREFBVSxTQUFWQSxPQUFVLENBQUNDLFFBQUQsRUFBYztBQUNuQztBQUNBO0FBQ0FuQixNQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7QUFDQW5DLEtBQUc7QUFDRE8sU0FBSyxtQ0FESjs7QUFHREMsYUFBUztBQUNQLG9CQUFjO0FBRFAsS0FIUjtBQU1EQyxRQUFJOztBQUVGQyxpQkFBV0MsUUFBUUMsR0FBUixDQUFZQyxhQUZyQjtBQUdGQyxxQkFBZUgsUUFBUUMsR0FBUixDQUFZRztBQUh6QixLQU5IO0FBV0RDLFVBQU07QUFYTCxHQUFILEVBYUdDLElBYkgsQ0FhUSxVQUFDQyxJQUFELEVBQVU7QUFDZGYsY0FBVWUsSUFBVjtBQUNBaEIsUUFBSWdCLElBQUo7QUFFRCxHQWpCSCxFQWtCR0UsS0FsQkgsQ0FrQlMsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLFlBQVFwQixHQUFSLENBQVltQixHQUFaO0FBQ0QsR0FwQkg7QUFxQkQsQ0F6Qk07O0FBMkJQO0FBQ0EsSUFBTTBCLE9BQU8sU0FBUEEsSUFBTyxDQUFDQyxPQUFELEVBQVVLLElBQVYsRUFBZ0JDLEdBQWhCLEVBQXFCQyxFQUFyQixFQUE0QjtBQUN2Q25FLFVBQVFvRSxJQUFSLENBQ0UsOENBQThDUixPQUE5QyxHQUF3RCxXQUQxRCxFQUN1RTtBQUNuRXhDLGFBQVM7QUFDUGlELHFCQUFlLFlBQVlIO0FBRHBCLEtBRDBEO0FBSW5FdEMsVUFBTSxJQUo2RDtBQUtuRTtBQUNBO0FBQ0FvQixVQUFNO0FBQ0pHLFlBQU0sWUFERjtBQUVKbUIsZUFBUyxHQUZMO0FBR0pDLG1CQUFhLENBQUM7QUFDWnBCLGNBQU0sU0FETTtBQUVabUIsaUJBQVMsR0FGRzs7QUFJWkUsZUFBTyxTQUpLO0FBS1pDLGVBQU8sc0JBTEs7QUFNWlIsY0FBTUEsSUFOTTs7QUFRWlMsZUFBTztBQUNMbEMsZ0JBQU07QUFERDtBQVJLLE9BQUQ7QUFIVDtBQVA2RCxHQUR2RSxFQXdCSyxVQUFDUCxHQUFELEVBQU1ZLEdBQU4sRUFBYztBQUNmLFFBQUlaLE9BQU9ZLElBQUlLLFVBQUosS0FBbUIsR0FBOUIsRUFBbUM7QUFDakNwQyxVQUFJLDBCQUFKLEVBQWdDbUIsT0FBT1ksSUFBSUssVUFBM0M7QUFDQWlCLFNBQUdsQyxPQUFPLElBQUkwQyxLQUFKLENBQVU5QixJQUFJSyxVQUFkLENBQVY7QUFDQTtBQUNEO0FBQ0RwQyxRQUFJLG9CQUFKLEVBQTBCK0IsSUFBSUssVUFBOUIsRUFBMENMLElBQUlHLElBQTlDO0FBQ0FtQixPQUFHLElBQUgsRUFBU3RCLElBQUlHLElBQWI7QUFDRCxHQWhDSDtBQWlDRCxDQWxDRDs7QUFxQ0E7QUFDTyxJQUFNNEIsa0RBQVMsU0FBVEEsTUFBUyxDQUFDQyxPQUFEO0FBQUEsU0FBYSxVQUFDakMsR0FBRCxFQUFNQyxHQUFOLEVBQVdpQyxHQUFYLEVBQWdCQyxRQUFoQixFQUE2QjtBQUM5RCxRQUFJbkMsSUFBSW9DLEdBQUosQ0FBUSxrQkFBUixNQUNGLGdEQUFXLFFBQVgsRUFBcUJILE9BQXJCLEVBQThCSSxNQUE5QixDQUFxQ0gsR0FBckMsRUFBMENJLE1BQTFDLENBQWlELEtBQWpELENBREYsRUFDMkQ7QUFDekRwRSxVQUFJLDJCQUFKO0FBQ0EsVUFBTW1CLE1BQU0sSUFBSTBDLEtBQUosQ0FBVSwyQkFBVixDQUFaO0FBQ0ExQyxVQUFJYSxNQUFKLEdBQWEsR0FBYjtBQUNBLFlBQU1iLEdBQU47QUFDRDtBQUNGLEdBUnFCO0FBQUEsQ0FBZjs7QUFVUDtBQUNPLElBQU1rRCx3REFBWSxTQUFaQSxTQUFZLENBQUNOLE9BQUQ7QUFBQSxTQUFhLFVBQUNqQyxHQUFELEVBQU1DLEdBQU4sRUFBV3VDLElBQVgsRUFBb0I7QUFDeEQsUUFBSXhDLElBQUlJLElBQUosQ0FBU0csSUFBVCxLQUFrQixjQUF0QixFQUFzQztBQUNwQ3JDLFVBQUksdUNBQUosRUFBNkM4QixJQUFJSSxJQUFqRDtBQUNBLFVBQU1BLE9BQU9xQyxLQUFLQyxTQUFMLENBQWU7QUFDMUIvQixrQkFBVVgsSUFBSUksSUFBSixDQUFTbUM7QUFETyxPQUFmLENBQWI7QUFHQXRDLFVBQUkwQyxHQUFKLENBQVEsa0JBQVIsRUFDRSxnREFBVyxRQUFYLEVBQXFCVixPQUFyQixFQUE4QkksTUFBOUIsQ0FBcUNqQyxJQUFyQyxFQUEyQ2tDLE1BQTNDLENBQWtELEtBQWxELENBREY7QUFFQXJDLFVBQUlNLElBQUosQ0FBUyxNQUFULEVBQWlCUSxJQUFqQixDQUFzQlgsSUFBdEI7QUFDQTtBQUNEO0FBQ0RvQztBQUNELEdBWndCO0FBQUEsQ0FBbEI7O0FBY1A7QUFDTyxJQUFNSSxrREFBUyxTQUFUQSxNQUFTLENBQUM5QyxLQUFELEVBQVErQyxNQUFSLEVBQWdCWixPQUFoQixFQUF5QlYsRUFBekIsRUFBZ0M7QUFDcEQ7QUFDQTlELFFBQU1xRixHQUFOLENBQVVoRCxLQUFWLEVBQWlCK0MsTUFBakIsRUFBeUIsVUFBQ3hELEdBQUQsRUFBTVUsS0FBTixFQUFnQjtBQUN2QyxRQUFJVixHQUFKLEVBQVM7QUFDUGtDLFNBQUdsQyxHQUFIO0FBQ0E7QUFDRDs7QUFFRDtBQUNBa0MsT0FBRyxJQUFILEVBQVM1RDs7QUFFUDtBQUZPLEtBR042RCxJQUhNLENBR0QsV0FIQzs7QUFLUDtBQUNBbEUsWUFBUTBCLElBQVIsQ0FBYTtBQUNYdUIsWUFBTSxLQURLO0FBRVh5QixjQUFRQSxPQUFPQyxPQUFQO0FBRkcsS0FBYixDQU5POztBQVdQO0FBQ0FNLGNBQVVOLE9BQVYsQ0FaTzs7QUFjUDtBQUNBcEMsYUFBU0MsS0FBVCxFQUFnQkMsS0FBaEIsQ0FmTyxDQUFUO0FBZ0JELEdBdkJEO0FBd0JELENBMUJNOztBQTRCUDtBQUNBLElBQU1nRCxPQUFPLFNBQVBBLElBQU8sQ0FBQ0MsSUFBRCxFQUFPcEUsR0FBUCxFQUFZMkMsRUFBWixFQUFtQjs7QUFFOUI7QUFDQXFCLFNBQ0VoRSxJQUFJcUUsY0FETixFQUNzQnJFLElBQUlzRSxlQUQxQixFQUVFdEUsSUFBSXVFLHVCQUZOLEVBRStCLFVBQUM5RCxHQUFELEVBQU14QixHQUFOLEVBQWM7O0FBRXpDLFFBQUl3QixHQUFKLEVBQVM7QUFDUGtDLFNBQUdsQyxHQUFIO0FBQ0FuQixVQUFJLHVCQUF1Qm1CLEdBQTNCOztBQUVBO0FBQ0Q7O0FBRUQsUUFBSVQsSUFBSXdFLElBQVIsRUFBYztBQUNabEYsVUFBSSxrQ0FBSixFQUF3Q1UsSUFBSXdFLElBQTVDOztBQUVBN0YsV0FBSzhGLFlBQUwsQ0FBa0J4RixHQUFsQixFQUF1QnlGLE1BQXZCLENBQThCMUUsSUFBSXdFLElBQWxDLEVBQXdDN0IsRUFBeEM7O0FBRUQ7QUFDQzFELFVBQUl1RSxHQUFKLENBQVEsR0FBUixFQUFhLFVBQVVoRixPQUFWLEVBQW1CdUQsUUFBbkIsRUFBNkI7QUFDeEMzQyxXQUFHO0FBQ0RPLGVBQUssbUNBREo7O0FBR0RDLG1CQUFTO0FBQ1AsMEJBQWM7O0FBRFAsV0FIUjtBQU9EQyxjQUFJO0FBQ0ZDLHVCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBRHJCO0FBRUZDLDJCQUFlSCxRQUFRQyxHQUFSLENBQVlHO0FBRnpCLFdBUEg7QUFXREMsZ0JBQU07QUFYTCxTQUFILEVBYUdDLElBYkgsQ0FhUSxVQUFDQyxJQUFELEVBQVU7QUFDZGYsb0JBQVVlLElBQVY7QUFDQWhCLGNBQUlnQixJQUFKOztBQUVBeUIsbUJBQVNJLElBQVQsQ0FBYzdCLElBQWQ7QUFDRCxTQWxCSCxFQW1CR0UsS0FuQkgsQ0FtQlMsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLGtCQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUNBc0IsbUJBQVNJLElBQVQsQ0FBYyxhQUFXMUIsR0FBekI7QUFDRCxTQXRCSDtBQXVCRCxPQXhCRDtBQTRCRCxLQWxDRDtBQXFDRTtBQUNBa0UsVUFBSUMsSUFBSixDQUFTNUUsR0FBVCxFQUFjLFVBQUNTLEdBQUQsRUFBTW1FLElBQU4sRUFBZTtBQUMzQixZQUFJbkUsR0FBSixFQUFTO0FBQ1BrQyxhQUFHbEMsR0FBSDtBQUNBO0FBQ0Q7QUFDRCxZQUFNb0UsT0FBTzdFLElBQUk4RSxPQUFKLElBQWUsR0FBNUI7QUFDQXhGLFlBQUksbUNBQUosRUFBeUN1RixJQUF6QztBQUNBO0FBQ0QsT0FSRDtBQVNILEdBMURIO0FBMkRELENBOUREOztBQWdFQSxJQUFJN0YsUUFBUW1GLElBQVIsS0FBaUJZLE1BQXJCLEVBQTZCO0FBQzNCWixPQUFLcEUsUUFBUXFFLElBQWIsRUFBbUJyRSxRQUFRQyxHQUEzQixFQUFnQyxVQUFDUyxHQUFELEVBQVM7O0FBRXZDLFFBQUlBLEdBQUosRUFBUztBQUNQQyxjQUFRcEIsR0FBUixDQUFZLHFCQUFaLEVBQW1DbUIsR0FBbkM7QUFDQTtBQUNEOztBQUVEbkIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciByZXF1aXJlRW52ID0gcmVxdWlyZShcInJlcXVpcmUtZW52aXJvbm1lbnQtdmFyaWFibGVzXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciBtZXNzYWdlO1xudmFyIGNvbnRlbnQ7XG52YXIgZ3NlY3JldDtcblxuLy90byBzaG93IGluIGJyb3dzZXJcbi8vc2V0IHJvdXRlIGZvciBob21lcGFnZSBcbmNvbnN0IGdpdENvbm5lY3QgPSAoKSA9PiB7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tLycsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgIH0sXG4gICAgcXM6IHtcbiAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgfSxcbiAgICBqc29uOiB0cnVlXG4gIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIG1lc3NhZ2UgPSBkYXRhLmlzc3Vlc191cmw7XG5cbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgfSlcblxufTtcblxuY29uc3QgZ2V0X2lzc3VlID0gKHJlcG9pZCwgaXNzdWVpZCkgPT57XG4gICAgcnAoe1xuICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb2lkICsgJy9pc3N1ZXMvJyArIGlzc3VlaWQsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgXG4gICAgICAgIG1lc3NhZ2UgPSBkYXRhLnBpcGVsaW5lLm5hbWVcbiAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIGxvZygnbWVzc2FnZSA6ICcrbWVzc2FnZSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICBcbiAgICAgIH0pICBcbn07XG5cbmV4cG9ydCBjb25zdCBzY3J1bWJvdCA9IChhcHBJZCwgdG9rZW4pID0+IChyZXEsIHJlcykgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG5cbiAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAvLyBvd24gbWVzc2FnZXNcbiAgaWYgKHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgcmV0dXJuO1xuXG4gIH1cbiAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICBsb2cocmVzKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvL2hhbmRsZSBuZXcgbWVzc2FnZXMgYW5kIGlnbm9yZSB0aGUgYXBwJ3Mgb3duIG1lc3NhZ2VzXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1jcmVhdGVkJyAmJiByZXEuYm9keS51c2VySWQgIT09IGFwcElkKSB7XG4gICAgbG9nKCdHb3QgYSBtZXNzYWdlICVvJywgcmVxLmJvZHkpO1xuICAgIGxvZygnY29udGVudCA6ICcrcmVxLmJvZHkuY29udGVudCk7XG5cbiAgICB2YXIgbWVzc2FnZTEgPSByZXEuYm9keS5jb250ZW50O1xuXG4gICAgdmFyIHRvX3Bvc3QgPSBib2FyZC5nZXRTY3J1bURhdGEoe3JlcXVlc3Q6cmVxLCByZXNwb25zZTpyZXMsIFVzZXJJbnB1dDptZXNzYWdlMX0pO1xuICAgIGNvbnNvbGUuZGlyKHRvX3Bvc3QsIHtkZXB0aDpudWxsfSk7XG5cblxuICAgIFxuICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIHRvX3Bvc3QpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgIH0pXG4gICAgXG4gIH07XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UmVwbyA9IChyZXBvTmFtZSkgPT4ge1xuICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgLy8gYmUgc2VudCBhc3luY2hyb25vdXNseVxuICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gIHJwKHtcbiAgICB1cmk6ICdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXIvcmVwb3MnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnc2ltcGxlX3Jlc3RfYXBwJyxcbiAgICB9LFxuICAgIHFzOiB7XG4gICAgXG4gICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgIH0sXG4gICAganNvbjogdHJ1ZVxuICB9KVxuICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgIGxvZyhkYXRhKVxuXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH0pXG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgc2NydW1ib3QoYXBwSWQsIHRva2VuKSkpO1xuICB9KTtcbn07XG5cbi8vIEFwcCBtYWluIGVudHJ5IHBvaW50XG5jb25zdCBtYWluID0gKGFyZ3YsIGVudiwgY2IpID0+IHtcblxuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuU0NSVU1CT1RfQVBQSUQsIGVudi5TQ1JVTUJPVF9TRUNSRVQsXG4gICAgZW52LlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVULCAoZXJyLCBhcHApID0+IHtcblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYihlcnIpO1xuICAgICAgICBsb2coXCJhbiBlcnJvciBvY2NvdXJlZCBcIiArIGVycik7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52LlBPUlQpIHtcbiAgICAgICAgbG9nKCdIVFRQIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIGVudi5QT1JUKTtcblxuICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhcHApLmxpc3RlbihlbnYuUE9SVCwgY2IpO1xuXG4gICAgICAgLy9kZWZhdWx0IHBhZ2VcbiAgICAgICAgYXBwLmdldCgnLycsIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgICAgICAgIHJwKHtcbiAgICAgICAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vdXNlci9yZXBvcycsXG4gICAgICAgIFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXM6IHtcbiAgICAgICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICAgICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgICAgcmVzcG9uc2Uuc2VuZCgnZXJyb3IgOiAnK2VycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==