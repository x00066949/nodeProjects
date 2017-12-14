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

        get_issue(71240446, 1);
        //send to space
        send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, message), token(), function (err, res) {
          if (!err) log('Sent message to space %s', req.body.spaceId);
        });
      }
      if (to_split === '/git') {

        log('github route');
        //call gitconnect function
        gitConnect();
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
      message = data.pipeline.name;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImV4cHJlc3MiLCJyZXF1aXJlIiwiYXBwIiwiYm9keVBhcnNlciIsInBhdGgiLCJycCIsInJlcXVpcmVFbnYiLCJsb2ciLCJtZXNzYWdlIiwiY29udGVudCIsImdzZWNyZXQiLCJnaXRDb25uZWN0IiwidXJpIiwiaGVhZGVycyIsInFzIiwiY2xpZW50X2lkIiwicHJvY2VzcyIsImVudiIsIkdJVF9DTElFTlRfSUQiLCJjbGllbnRfc2VjcmV0IiwiR0lUX0NMSUVOVF9TRUNSRVQiLCJqc29uIiwidGhlbiIsImRhdGEiLCJpc3N1ZXNfdXJsIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwic2NydW1ib3QiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsInN0YXR1c0NvZGUiLCJ0eXBlIiwiYW5ub3RhdGlvblR5cGUiLCJhbm5vdGF0aW9uUGF5bG9hZCIsInRvX3NwbGl0IiwiZ2V0X2lzc3VlIiwic2VuZCIsInNwYWNlSWQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImdldFJlcG8iLCJyZXBvTmFtZSIsInJlcGlkIiwiaXNzdWVpZCIsImdldCIsInJlc3BvbnNlIiwicmVwb2lkIiwiWkVOSFVCX1RPS0VOIiwicGlwZWxpbmUiLCJuYW1lIiwicmVuZGVyIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJ2ZXJzaW9uIiwiYW5ub3RhdGlvbnMiLCJjb2xvciIsInRpdGxlIiwiYWN0b3IiLCJFcnJvciIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0Iiwid2ViYXBwIiwic2VjcmV0IiwicnVuIiwibWFpbiIsImFyZ3YiLCJTQ1JVTUJPVF9BUFBJRCIsIlNDUlVNQk9UX1NFQ1JFVCIsIlNDUlVNQk9UX1dFQkhPT0tfU0VDUkVUIiwiUE9SVCIsImNyZWF0ZVNlcnZlciIsImxpc3RlbiIsInNzbCIsImNvbmYiLCJwb3J0IiwiU1NMUE9SVCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRCQUFZQyxPOztBQUNaOztBQUNBOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUVaOzs7Ozs7OztBQVZBLElBQUlDLFVBQVVDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBSUMsTUFBTUYsU0FBVjs7QUFVQSxJQUFJRyxhQUFhRixRQUFRLGFBQVIsQ0FBakI7QUFDQSxJQUFJRyxPQUFPSCxRQUFRLE1BQVIsQ0FBWDtBQUNBLElBQUlJLEtBQUtKLFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlLLGFBQWFMLFFBQVEsK0JBQVIsQ0FBakI7O0FBRUE7QUFDQSxJQUFNTSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjtBQUNBLElBQUlDLE9BQUo7QUFDQSxJQUFJQyxPQUFKOztBQUVBO0FBQ0E7QUFDQSxJQUFNQyxhQUFhLFNBQWJBLFVBQWEsR0FBTTtBQUN2Qk4sS0FBRztBQUNETyxTQUFLLHlCQURKOztBQUdEQyxhQUFTO0FBQ1Asb0JBQWM7QUFEUCxLQUhSO0FBTURDLFFBQUk7QUFDRkMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFEckI7QUFFRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFGekIsS0FOSDtBQVVEQyxVQUFNO0FBVkwsR0FBSCxFQVlHQyxJQVpILENBWVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2RmLGNBQVVlLEtBQUtDLFVBQWY7QUFDQWpCLFFBQUlnQixJQUFKOztBQUVBO0FBQ0QsR0FqQkgsRUFrQkdFLEtBbEJILENBa0JTLFVBQUNDLEdBQUQsRUFBUztBQUNkQyxZQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUNBO0FBQ0QsR0FyQkg7QUF1QkQsQ0F4QkQ7O0FBMEJPLElBQU1FLHNEQUFXLFNBQVhBLFFBQVcsQ0FBQ0MsS0FBRCxFQUFRQyxLQUFSO0FBQUEsU0FBa0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7QUFDdEQ7QUFDQTtBQUNBQSxRQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUE7QUFDQTtBQUNBLFFBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlAsS0FBeEIsRUFBK0I7QUFDN0JGLGNBQVFwQixHQUFSLENBQVksVUFBWixFQUF3QndCLElBQUlJLElBQTVCO0FBQ0E7QUFFRDtBQUNELFFBQUlILElBQUlLLFVBQUosS0FBbUIsR0FBdkIsRUFBNEI7QUFDMUI5QixVQUFJeUIsR0FBSjtBQUNBO0FBQ0Q7O0FBRUQsUUFBSUQsSUFBSUksSUFBSixDQUFTRyxJQUFULEtBQWtCLDBCQUFsQixJQUFnRFAsSUFBSUksSUFBSixDQUFTSSxjQUFULEtBQTRCLGdCQUFoRixFQUFrRztBQUNoRyxVQUFNQyxvQkFBb0JULElBQUlJLElBQUosQ0FBU0ssaUJBQW5DO0FBQ0E7QUFDQWpDLFVBQUl3QixJQUFJSSxJQUFSO0FBQ0E7QUFFRDs7QUFFRDtBQUNBLFFBQUlKLElBQUlJLElBQUosQ0FBU0csSUFBVCxLQUFrQixpQkFBbEIsSUFBdUNQLElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlAsS0FBL0QsRUFBc0U7QUFDcEV0QixVQUFJLGtCQUFKLEVBQXdCd0IsSUFBSUksSUFBNUI7QUFDQTVCLFVBQUksZUFBYXdCLElBQUlJLElBQUosQ0FBUzFCLE9BQTFCOztBQUVBLFVBQUlnQyxXQUFXVixJQUFJSSxJQUFKLENBQVMxQixPQUF4QjtBQUNBRixVQUFJa0MsUUFBSjtBQUNBOztBQUVBLFVBQUdBLGFBQWEsUUFBaEIsRUFBeUI7QUFDdkJsQyxZQUFJLGNBQUo7O0FBRUFtQyxrQkFBVSxRQUFWLEVBQW1CLENBQW5CO0FBQ0E7QUFDRkMsYUFBS1osSUFBSUksSUFBSixDQUFTUyxPQUFkLEVBQ0VqRCxLQUFLa0QsTUFBTCxDQUNFLHVCQURGLEVBRUVkLElBQUlJLElBQUosQ0FBU1csUUFGWCxFQUVxQnRDLE9BRnJCLENBREYsRUFJRXNCLE9BSkYsRUFLRSxVQUFDSixHQUFELEVBQU1NLEdBQU4sRUFBYztBQUNaLGNBQUksQ0FBQ04sR0FBTCxFQUNFbkIsSUFBSSwwQkFBSixFQUFnQ3dCLElBQUlJLElBQUosQ0FBU1MsT0FBekM7QUFDTCxTQVJEO0FBU0M7QUFDRCxVQUFHSCxhQUFhLE1BQWhCLEVBQXdCOztBQUV0QmxDLFlBQUksY0FBSjtBQUNBO0FBQ0FJO0FBQ0E7QUFDRmdDLGFBQUtaLElBQUlJLElBQUosQ0FBU1MsT0FBZCxFQUNFakQsS0FBS2tELE1BQUwsQ0FDRSx1QkFERixFQUVFZCxJQUFJSSxJQUFKLENBQVNXLFFBRlgsRUFFcUJ0QyxPQUZyQixDQURGLEVBSUVzQixPQUpGLEVBS0UsVUFBQ0osR0FBRCxFQUFNTSxHQUFOLEVBQWM7QUFDWixjQUFJLENBQUNOLEdBQUwsRUFDRW5CLElBQUksMEJBQUosRUFBZ0N3QixJQUFJSSxJQUFKLENBQVNTLE9BQXpDO0FBQ0wsU0FSRDtBQVNDO0FBS0Y7QUFDRixHQXRFdUI7QUFBQSxDQUFqQjs7QUE2RUEsSUFBTUcsb0RBQVUsU0FBVkEsT0FBVSxDQUFDQyxRQUFELEVBQWM7QUFDbkM7QUFDQTtBQUNBaEIsTUFBSUMsTUFBSixDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCO0FBQ0E3QixLQUFHO0FBQ0RPLFNBQUssbUNBREo7O0FBR0RDLGFBQVM7QUFDUCxvQkFBYztBQURQLEtBSFI7QUFNREMsUUFBSTs7QUFFRkMsaUJBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsYUFGckI7QUFHRkMscUJBQWVILFFBQVFDLEdBQVIsQ0FBWUc7QUFIekIsS0FOSDtBQVdEQyxVQUFNO0FBWEwsR0FBSCxFQWFHQyxJQWJILENBYVEsVUFBQ0MsSUFBRCxFQUFVO0FBQ2RmLGNBQVVlLElBQVY7QUFDQWhCLFFBQUlnQixJQUFKOztBQUVBO0FBQ0QsR0FsQkgsRUFtQkdFLEtBbkJILENBbUJTLFVBQUNDLEdBQUQsRUFBUztBQUNkQyxZQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUNBO0FBQ0QsR0F0Qkg7QUEwQkQsQ0E5Qk07O0FBZ0NQLElBQU1nQixZQUFZLFNBQVpBLFNBQVksQ0FBQ08sS0FBRCxFQUFRQyxPQUFSLEVBQW1CO0FBQ25DaEQsTUFBSWlELEdBQUosQ0FBUSxVQUFVekQsT0FBVixFQUFtQjBELFFBQW5CLEVBQTZCO0FBQ25DL0MsT0FBRztBQUNETyxXQUFLLDJDQUEyQ3lDLE1BQTNDLEdBQW9ELFVBQXBELEdBQWlFSCxPQURyRTs7QUFHRHJDLGVBQVM7QUFDUCxrQ0FBMEJHLFFBQVFDLEdBQVIsQ0FBWXFDO0FBRC9CLE9BSFI7O0FBT0RqQyxZQUFNO0FBUEwsS0FBSCxFQVNHQyxJQVRILENBU1EsVUFBQ0MsSUFBRCxFQUFVO0FBQ2Q7QUFDQTZCLGVBQVNULElBQVQsQ0FBY3BCLElBQWQ7QUFDQWYsZ0JBQVVlLEtBQUtnQyxRQUFMLENBQWNDLElBQXhCO0FBQ0QsS0FiSCxFQWNHL0IsS0FkSCxDQWNTLFVBQUNDLEdBQUQsRUFBUztBQUNkQyxjQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUNBMEIsZUFBU0ssTUFBVCxDQUFnQixPQUFoQjtBQUNELEtBakJIO0FBa0JELEdBbkJEO0FBb0JELENBckJEOztBQXVCQTtBQUNBLElBQU1kLE9BQU8sU0FBUEEsSUFBTyxDQUFDQyxPQUFELEVBQVVjLElBQVYsRUFBZ0JDLEdBQWhCLEVBQXFCQyxFQUFyQixFQUE0QjtBQUN2Q2xFLFVBQVFtRSxJQUFSLENBQ0UsOENBQThDakIsT0FBOUMsR0FBd0QsV0FEMUQsRUFDdUU7QUFDbkUvQixhQUFTO0FBQ1BpRCxxQkFBZSxZQUFZSDtBQURwQixLQUQwRDtBQUluRXRDLFVBQU0sSUFKNkQ7QUFLbkU7QUFDQTtBQUNBYyxVQUFNO0FBQ0pHLFlBQU0sWUFERjtBQUVKeUIsZUFBUyxHQUZMO0FBR0pDLG1CQUFhLENBQUM7QUFDWjFCLGNBQU0sU0FETTtBQUVaeUIsaUJBQVMsR0FGRzs7QUFJWkUsZUFBTyxTQUpLO0FBS1pDLGVBQU8sc0JBTEs7QUFNWlIsY0FBTUEsSUFOTTs7QUFRWlMsZUFBTztBQUNMWCxnQkFBTTtBQUREO0FBUkssT0FBRDtBQUhUO0FBUDZELEdBRHZFLEVBd0JLLFVBQUM5QixHQUFELEVBQU1NLEdBQU4sRUFBYztBQUNmLFFBQUlOLE9BQU9NLElBQUlLLFVBQUosS0FBbUIsR0FBOUIsRUFBbUM7QUFDakM5QixVQUFJLDBCQUFKLEVBQWdDbUIsT0FBT00sSUFBSUssVUFBM0M7QUFDQXVCLFNBQUdsQyxPQUFPLElBQUkwQyxLQUFKLENBQVVwQyxJQUFJSyxVQUFkLENBQVY7QUFDQTtBQUNEO0FBQ0Q5QixRQUFJLG9CQUFKLEVBQTBCeUIsSUFBSUssVUFBOUIsRUFBMENMLElBQUlHLElBQTlDO0FBQ0F5QixPQUFHLElBQUgsRUFBUzVCLElBQUlHLElBQWI7QUFDRCxHQWhDSDtBQWlDRCxDQWxDRDs7QUFvQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0NBO0FBQ08sSUFBTWtDLGtEQUFTLFNBQVRBLE1BQVMsQ0FBQ0MsT0FBRDtBQUFBLFNBQWEsVUFBQ3ZDLEdBQUQsRUFBTUMsR0FBTixFQUFXdUMsR0FBWCxFQUFnQkMsUUFBaEIsRUFBNkI7QUFDOUQsUUFBSXpDLElBQUlvQixHQUFKLENBQVEsa0JBQVIsTUFDRixnREFBVyxRQUFYLEVBQXFCbUIsT0FBckIsRUFBOEJHLE1BQTlCLENBQXFDRixHQUFyQyxFQUEwQ0csTUFBMUMsQ0FBaUQsS0FBakQsQ0FERixFQUMyRDtBQUN6RG5FLFVBQUksMkJBQUo7QUFDQSxVQUFNbUIsTUFBTSxJQUFJMEMsS0FBSixDQUFVLDJCQUFWLENBQVo7QUFDQTFDLFVBQUlPLE1BQUosR0FBYSxHQUFiO0FBQ0EsWUFBTVAsR0FBTjtBQUNEO0FBQ0YsR0FScUI7QUFBQSxDQUFmOztBQVVQO0FBQ08sSUFBTWlELHdEQUFZLFNBQVpBLFNBQVksQ0FBQ0wsT0FBRDtBQUFBLFNBQWEsVUFBQ3ZDLEdBQUQsRUFBTUMsR0FBTixFQUFXNEMsSUFBWCxFQUFvQjtBQUN4RCxRQUFJN0MsSUFBSUksSUFBSixDQUFTRyxJQUFULEtBQWtCLGNBQXRCLEVBQXNDO0FBQ3BDL0IsVUFBSSx1Q0FBSixFQUE2Q3dCLElBQUlJLElBQWpEO0FBQ0EsVUFBTUEsT0FBTzBDLEtBQUtDLFNBQUwsQ0FBZTtBQUMxQjFCLGtCQUFVckIsSUFBSUksSUFBSixDQUFTd0M7QUFETyxPQUFmLENBQWI7QUFHQTNDLFVBQUkrQyxHQUFKLENBQVEsa0JBQVIsRUFDRSxnREFBVyxRQUFYLEVBQXFCVCxPQUFyQixFQUE4QkcsTUFBOUIsQ0FBcUN0QyxJQUFyQyxFQUEyQ3VDLE1BQTNDLENBQWtELEtBQWxELENBREY7QUFFQTFDLFVBQUlNLElBQUosQ0FBUyxNQUFULEVBQWlCSyxJQUFqQixDQUFzQlIsSUFBdEI7QUFDQTtBQUNEO0FBQ0R5QztBQUNELEdBWndCO0FBQUEsQ0FBbEI7O0FBY1A7QUFDTyxJQUFNSSxrREFBUyxTQUFUQSxNQUFTLENBQUNuRCxLQUFELEVBQVFvRCxNQUFSLEVBQWdCWCxPQUFoQixFQUF5QlYsRUFBekIsRUFBZ0M7QUFDcEQ7QUFDQTdELFFBQU1tRixHQUFOLENBQVVyRCxLQUFWLEVBQWlCb0QsTUFBakIsRUFBeUIsVUFBQ3ZELEdBQUQsRUFBTUksS0FBTixFQUFnQjtBQUN2QyxRQUFJSixHQUFKLEVBQVM7QUFDUGtDLFNBQUdsQyxHQUFIO0FBQ0E7QUFDRDs7QUFFRDtBQUNBa0MsT0FBRyxJQUFILEVBQVM1RDs7QUFFUDtBQUZPLEtBR042RCxJQUhNLENBR0QsV0FIQzs7QUFLUDtBQUNBakUsWUFBUXlCLElBQVIsQ0FBYTtBQUNYaUIsWUFBTSxLQURLO0FBRVgrQixjQUFRQSxPQUFPQyxPQUFQO0FBRkcsS0FBYixDQU5POztBQVdQO0FBQ0FLLGNBQVVMLE9BQVYsQ0FaTzs7QUFjUDtBQUNBMUMsYUFBU0MsS0FBVCxFQUFnQkMsS0FBaEIsQ0FmTyxDQUFUO0FBZ0JELEdBdkJEO0FBd0JELENBMUJNOztBQTRCUDtBQUNBLElBQU1xRCxPQUFPLFNBQVBBLElBQU8sQ0FBQ0MsSUFBRCxFQUFPbkUsR0FBUCxFQUFZMkMsRUFBWixFQUFtQjs7QUFFOUI7QUFDQW9CLFNBQ0UvRCxJQUFJb0UsY0FETixFQUNzQnBFLElBQUlxRSxlQUQxQixFQUVFckUsSUFBSXNFLHVCQUZOLEVBRStCLFVBQUM3RCxHQUFELEVBQU14QixHQUFOLEVBQWM7O0FBRXpDLFFBQUl3QixHQUFKLEVBQVM7QUFDUGtDLFNBQUdsQyxHQUFIO0FBQ0FuQixVQUFJLHVCQUF1Qm1CLEdBQTNCOztBQUVBO0FBQ0Q7O0FBRUQsUUFBSVQsSUFBSXVFLElBQVIsRUFBYztBQUNaakYsVUFBSSxrQ0FBSixFQUF3Q1UsSUFBSXVFLElBQTVDOztBQUVBM0YsV0FBSzRGLFlBQUwsQ0FBa0J2RixHQUFsQixFQUF1QndGLE1BQXZCLENBQThCekUsSUFBSXVFLElBQWxDLEVBQXdDNUIsRUFBeEM7O0FBRUQ7QUFDQzFELFVBQUlpRCxHQUFKLENBQVEsR0FBUixFQUFhLFVBQVV6RCxPQUFWLEVBQW1CMEQsUUFBbkIsRUFBNkI7QUFDeEMvQyxXQUFHO0FBQ0RPLGVBQUssbUNBREo7O0FBR0RDLG1CQUFTO0FBQ1AsMEJBQWM7O0FBRFAsV0FIUjtBQU9EQyxjQUFJO0FBQ0ZDLHVCQUFXQyxRQUFRQyxHQUFSLENBQVlDLGFBRHJCO0FBRUZDLDJCQUFlSCxRQUFRQyxHQUFSLENBQVlHO0FBRnpCLFdBUEg7QUFXREMsZ0JBQU07QUFYTCxTQUFILEVBYUdDLElBYkgsQ0FhUSxVQUFDQyxJQUFELEVBQVU7QUFDZGYsb0JBQVVlLElBQVY7QUFDQWhCLGNBQUlnQixJQUFKOztBQUVBNkIsbUJBQVNULElBQVQsQ0FBY3BCLElBQWQ7QUFDRCxTQWxCSCxFQW1CR0UsS0FuQkgsQ0FtQlMsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLGtCQUFRcEIsR0FBUixDQUFZbUIsR0FBWjtBQUNBMEIsbUJBQVNULElBQVQsQ0FBYyxhQUFXakIsR0FBekI7QUFDRCxTQXRCSDtBQXVCRCxPQXhCRDs7QUEwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkQsS0E3REQ7QUFnRUU7QUFDQWlFLFVBQUlDLElBQUosQ0FBUzNFLEdBQVQsRUFBYyxVQUFDUyxHQUFELEVBQU1rRSxJQUFOLEVBQWU7QUFDM0IsWUFBSWxFLEdBQUosRUFBUztBQUNQa0MsYUFBR2xDLEdBQUg7QUFDQTtBQUNEO0FBQ0QsWUFBTW1FLE9BQU81RSxJQUFJNkUsT0FBSixJQUFlLEdBQTVCO0FBQ0F2RixZQUFJLG1DQUFKLEVBQXlDc0YsSUFBekM7QUFDQTtBQUNELE9BUkQ7QUFTSCxHQXJGSDtBQXNGRCxDQXpGRDs7QUEyRkEsSUFBSTVGLFFBQVFrRixJQUFSLEtBQWlCWSxNQUFyQixFQUE2QjtBQUMzQlosT0FBS25FLFFBQVFvRSxJQUFiLEVBQW1CcEUsUUFBUUMsR0FBM0IsRUFBZ0MsVUFBQ1MsR0FBRCxFQUFTOztBQUV2QyxRQUFJQSxHQUFKLEVBQVM7QUFDUEMsY0FBUXBCLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ21CLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRG5CLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIG1lc3NhZ2U7XG52YXIgY29udGVudDtcbnZhciBnc2VjcmV0O1xuXG4vL3RvIHNob3cgaW4gYnJvd3NlclxuLy9zZXQgcm91dGUgZm9yIGhvbWVwYWdlIFxuY29uc3QgZ2l0Q29ubmVjdCA9ICgpID0+IHtcbiAgcnAoe1xuICAgIHVyaTogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgfSxcbiAgICBxczoge1xuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICB9LFxuICAgIGpzb246IHRydWVcbiAgfSlcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbWVzc2FnZSA9IGRhdGEuaXNzdWVzX3VybDtcbiAgICAgIGxvZyhkYXRhKVxuXG4gICAgICAvL3Jlc3BvbnNlLnNlbmQoZGF0YSlcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAvL3Jlc3BvbnNlLnNlbmQoJ2Vycm9yIDogJytlcnIpXG4gICAgfSlcblxufTtcblxuZXhwb3J0IGNvbnN0IHNjcnVtYm90ID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICByZXR1cm47XG5cbiAgfVxuICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgIGxvZyhyZXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAmJiByZXEuYm9keS5hbm5vdGF0aW9uVHlwZSA9PT0gJ2FjdGlvblNlbGVjdGVkJykge1xuICAgIGNvbnN0IGFubm90YXRpb25QYXlsb2FkID0gcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQ7XG4gICAgLy9pZiAoYW5ub3RhdGlvblBheWxvYWQuYWN0aW9uSWQgPT09ICAnJyl7XG4gICAgbG9nKHJlcS5ib2R5KTtcbiAgICAvL31cblxuICB9XG5cbiAgLy9oYW5kbGUgbmV3IG1lc3NhZ2VzIGFuZCBpZ25vcmUgdGhlIGFwcCdzIG93biBtZXNzYWdlc1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtY3JlYXRlZCcgJiYgcmVxLmJvZHkudXNlcklkICE9PSBhcHBJZCkge1xuICAgIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcbiAgICBsb2coJ2NvbnRlbnQgOiAnK3JlcS5ib2R5LmNvbnRlbnQpXG4gICAgXG4gICAgdmFyIHRvX3NwbGl0ID0gcmVxLmJvZHkuY29udGVudDtcbiAgICBsb2codG9fc3BsaXQpO1xuICAgIC8vbWVzc2FnZSA9ICdOb3QgRm91bmQnXG5cbiAgICBpZih0b19zcGxpdCA9PT0gJy9pc3N1ZScpe1xuICAgICAgbG9nKCd6ZW5odWIgcm91dGUnKTtcblxuICAgICAgZ2V0X2lzc3VlKDcxMjQwNDQ2LDEpO1xuICAgICAgLy9zZW5kIHRvIHNwYWNlXG4gICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgbWVzc2FnZSksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmICghZXJyKVxuICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgfSlcbiAgICB9XG4gICAgaWYodG9fc3BsaXQgPT09ICcvZ2l0JyApe1xuXG4gICAgICBsb2coJ2dpdGh1YiByb3V0ZScpO1xuICAgICAgLy9jYWxsIGdpdGNvbm5lY3QgZnVuY3Rpb25cbiAgICAgIGdpdENvbm5lY3QoKTtcbiAgICAgIC8vc2VuZCB0byBzcGFjZVxuICAgIHNlbmQocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAnSGV5ICVzLCByZXN1bHQgaXM6ICVzJyxcbiAgICAgICAgcmVxLmJvZHkudXNlck5hbWUsIG1lc3NhZ2UpLFxuICAgICAgdG9rZW4oKSxcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgIH0pXG4gICAgfVxuICAgIFxuICAgIFxuXG4gICAgXG4gIH07XG59O1xuXG5cblxuXG5cblxuZXhwb3J0IGNvbnN0IGdldFJlcG8gPSAocmVwb05hbWUpID0+IHtcbiAgLy8gUmVzcG9uZCB0byB0aGUgV2ViaG9vayByaWdodCBhd2F5LCBhcyB0aGUgcmVzcG9uc2UgbWVzc2FnZSB3aWxsXG4gIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICBycCh7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcblxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgfSxcbiAgICBxczoge1xuICAgIFxuICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVRcbiAgICB9LFxuICAgIGpzb246IHRydWVcbiAgfSlcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbWVzc2FnZSA9IGRhdGE7XG4gICAgICBsb2coZGF0YSlcblxuICAgICAgLy9yZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgLy9yZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgIH0pXG5cblxuICBcbn07XG5cbmNvbnN0IGdldF9pc3N1ZSA9IChyZXBpZCwgaXNzdWVpZCkgPT57XG4gIGFwcC5nZXQoZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgcnAoe1xuICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb2lkICsgJy9pc3N1ZXMvJyArIGlzc3VlaWQsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgICAgIG1lc3NhZ2UgPSBkYXRhLnBpcGVsaW5lLm5hbWVcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgIHJlc3BvbnNlLnJlbmRlcignZXJyb3InKVxuICAgICAgfSlcbiAgfSk7XG59O1xuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy8nICsgc3BhY2VJZCArICcvbWVzc2FnZXMnLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICAvLyBBbiBBcHAgbWVzc2FnZSBjYW4gc3BlY2lmeSBhIGNvbG9yLCBhIHRpdGxlLCBtYXJrZG93biB0ZXh0IGFuZFxuICAgICAgLy8gYW4gJ2FjdG9yJyB1c2VmdWwgdG8gc2hvdyB3aGVyZSB0aGUgbWVzc2FnZSBpcyBjb21pbmcgZnJvbVxuICAgICAgYm9keToge1xuICAgICAgICB0eXBlOiAnYXBwTWVzc2FnZScsXG4gICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgYW5ub3RhdGlvbnM6IFt7XG4gICAgICAgICAgdHlwZTogJ2dlbmVyaWMnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgIGNvbG9yOiAnIzZDQjdGQicsXG4gICAgICAgICAgdGl0bGU6ICdnaXRodWIgaXNzdWUgdHJhY2tlcicsXG4gICAgICAgICAgdGV4dDogdGV4dCxcblxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8qXG4vL2RpYWxvZ1xuY29uc3QgZGlhbG9nID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcbiovXG4vLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmVcbmV4cG9ydCBjb25zdCB2ZXJpZnkgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBidWYsIGVuY29kaW5nKSA9PiB7XG4gIGlmIChyZXEuZ2V0KCdYLU9VVEJPVU5ELVRPS0VOJykgIT09XG4gICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSkge1xuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbmV4cG9ydCBjb25zdCBjaGFsbGVuZ2UgPSAod3NlY3JldCkgPT4gKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gIGlmIChyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYikgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICBzY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcnAoe1xuICAgICAgICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL3JlcG9zJyxcbiAgICAgICAgXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxczoge1xuICAgICAgICAgICAgICBjbGllbnRfaWQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfSUQsXG4gICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICBtZXNzYWdlID0gZGF0YTtcbiAgICAgICAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIFxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKGRhdGEpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgICByZXNwb25zZS5zZW5kKCdlcnJvciA6ICcrZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyphcHAuZ2V0KCcvY2FsbGJhY2svJywgZnVuY3Rpb24gKHJlcSwgcmVzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEucXVlcnkpOyBcbiAgICAgICAgICAgIGdzZWNyZXQgPSByZXEucXVlcnkuY29kZTtcbiAgICAgICAgICAgIHJlcy5zZW5kKFwiSGlcIitnc2VjcmV0KTtcblxuICAgICAgICB9KTtcblxuICAgICAgICBhcHAucG9zdChcbiAgICAgICAgICAnaHR0cHM6Ly9naXRodWIuY29tL2xvZ2luL29hdXRoL2FjY2Vzc190b2tlbicsIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAgICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9TRUNSRVQsXG4gICAgICAgICAgICAgIGNvZGU6IGdzZWNyZXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICAgICAgICBsb2coJ3N0YXVzOiAnLCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgICAgICAgIH0pOyovXG5cbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=