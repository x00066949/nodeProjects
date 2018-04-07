/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.parseResponse = exports.event_listener = exports.process_requests = undefined;

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

var /*istanbul ignore next*/_issue_events = require('./issue_events');

/*istanbul ignore next*/var events = _interopRequireWildcard(_issue_events);

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
var eventType;

var process_requests = /*istanbul ignore next*/exports.process_requests = function process_requests(appId, token) /*istanbul ignore next*/{
  return function (req, res) {
    log(" 001 : " + eventType);

    if (eventType === 'WW') {
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

      log("Processing slash command");

      if (!req) throw new Error('no request provided');

      log(req.body);

      if (req.body.type === 'message-annotation-added' /*&& req.body.annotationPayload.targetAppId === appId*/) {
          var command = JSON.parse(req.body.annotationPayload).actionId;
          //log("action id "+req.body.annotationPayload.actionId);
          log("command " + command);

          if (!command) log("no command to process");

          if (command === '/issue pipeline') {
            log("using dialog");
            dialog(req.body.spaceId, token(), req.body.userId, req.body.annotationPayload.targetDialogId, function (err, res) {
              if (!err) log('sent dialog to %s', req.body.spaceId);
            });
          }

          // message represents the message coming in from WW to be processed by the App
          var message = '@scrumbot ' + command;

          board.getScrumData({ request: req, response: res, UserInput: message }).then(function (to_post) {

            log("data got = " + to_post);

            send(req.body.spaceId, util.format('Hey %s, result is: %s', req.body.userName, to_post), token(), function (err, res) {
              if (!err) log('Sent message to space %s', req.body.spaceId);
            });
          }).catch(function (err) {
            log("unable to send message to space" + err);
          });
        };
    } else if (eventType === 'EL') {
      res.status(201).end();

      /*
      event_listener(token,
        (err, res) => {
          if (err)
            log('ERROR %s', err);
        });*/

      return;
    } else {

      res.status(401).end();
      return;
    }
  };
};

//function for processing issue events
var event_listener = /*istanbul ignore next*/exports.event_listener = function event_listener(token, cb) /*istanbul ignore next*/{
  return function (req, res) {
    log(" 002 : " + eventType);
    //console.dir(req.body,{depth:null})

    if (eventType === 'EL') {
      res.status(201).end();

      if (res.statusCode !== 201) {
        log(res);
        return;
      }

      log("Processing github event");

      if (!req) throw new Error('no request provided');

      log(req.body);

      var result = parseResponse(req, res).then(function (to_post) {

        log("data got = " + to_post);

        send(req.body.spaceId, util.format('Hello Space : %s', to_post), token(), function (err, res) {
          if (!err) log('Sent message to space ');
        });
      });
    } else {
      return;
    }
  };
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

        //text : 'Hello \n World ',
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

//dialog boxes
var dialog = function dialog(spaceId, tok, userId, dialogId, cb) {

  log("trying to build dialog boxes");

  var q = /*istanbul ignore next*/'';

  request.post('https://api.watsonwork.ibm.com/graphql', {

    headers: {
      'jwt': tok,
      'Content-Type': 'application/graphql',
      'x-graphql-view': 'PUBLIC, BETA'
    },
    json: true,
    body: /*istanbul ignore next*/'mutation createSpace { createSpace(input: { title: "Space title",  members: [' + userId + ']}){ space { ' + spaceId + '}'

  }, function (err, res) {
    if (err || res.statusCode !== 201) {
      log('failed err: ' + err);
      console.dir(res, { depth: null });
      log('Error creating dialog %o', err || res.statusCode);
      cb(err || new Error(res.statusCode));
      return;
    }
    log('Send result %d, %o', res.statusCode, res.body);
    cb(null, res.body);
  });
};

//get content of notification from github
var parseResponse = /*istanbul ignore next*/exports.parseResponse = function parseResponse(req, res) {
  log('parseresponse');
  //var req = options.request;
  //var res = options.response;

  var FinalMessage = 'hello';

  /*if(req.get('X-Github-Event') === 'issue_comment' ){
       log('action: '+req.body.action)
       FinalMessage = 'A Comment has just been '
       if(req.body.action === 'created'){
          FinalMessage += 'added to issue #'+req.body.issue.id+' in repository ' +req.body.repository.name+' with ID : '+req.body.repository.id+' by user '+req.body.comment.user.login+'\n The comment can be found here : '+req.body.comment.html_url+'. \n The content of the comment is : \n'+req.body.body;
      }else{
          FinalMessage += req.body.action+' action not coded yet...coming soon'
      }
      
  }
  else{
      log('Event type: '+req.get('X-Github-Event'))
      FinalMessage = 'Not a comment on an issue'
  }*/

  var FinalData = {
    "UserId": "Map",
    "Message": FinalMessage
  };

  return FinalData;
};

// Verify Watson Work request signature
var verify = /*istanbul ignore next*/exports.verify = function verify(wsecret) /*istanbul ignore next*/{
  return function (req, res, buf, encoding) {
    if (req.get('X-OUTBOUND-TOKEN') === /*istanbul ignore next*/(0, _crypto.createHmac)('sha256', wsecret).update(buf).digest('hex')) {

      eventType = 'WW';
      log("from WW");
      return;
    } else if (req.get('X-HUB-SIGNATURE') === "sha1=" + /*istanbul ignore next*/(0, _crypto.createHmac)('sha1', wsecret).update(buf).digest('hex')) {

      eventType = 'EL';
      log("github event");
      return;
    } else {
      log("Not event from WW or github");
      console.dir(req, { depth: null });
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
var webapp = /*istanbul ignore next*/exports.webapp = function webapp(appId, secret, wsecret, cb, eventType) {
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
    //scrumbot(appId, token)));

    //github issue events go here
    event_listener(token),

    //handle slash commands
    process_requests(appId, token)));
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
        response.redirect('http://workspace.ibm.com');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsImNvbnNvbGUiLCJzdGF0dXNDb2RlIiwiRXJyb3IiLCJ0eXBlIiwiY29tbWFuZCIsIkpTT04iLCJwYXJzZSIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJkaWFsb2ciLCJzcGFjZUlkIiwidGFyZ2V0RGlhbG9nSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0aGVuIiwidG9fcG9zdCIsInNlbmQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImNhdGNoIiwiZXZlbnRfbGlzdGVuZXIiLCJjYiIsInJlc3VsdCIsInBhcnNlUmVzcG9uc2UiLCJ0ZXh0IiwidG9rIiwicG9zdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwianNvbiIsInZlcnNpb24iLCJhbm5vdGF0aW9ucyIsImNvbG9yIiwidGl0bGUiLCJhY3RvciIsIm5hbWUiLCJkaWFsb2dJZCIsInEiLCJkaXIiLCJkZXB0aCIsIkZpbmFsTWVzc2FnZSIsIkZpbmFsRGF0YSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFFWjs7Ozs7Ozs7QUFaQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBWUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVI7QUFBQSxTQUFrQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYTtBQUM3RE4sUUFBSSxZQUFVQyxTQUFkOztBQUdBLFFBQUlBLGNBQWMsSUFBbEIsRUFBdUI7QUFDbkI7QUFDRjtBQUNBSyxVQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUU7QUFDQTtBQUNBLFVBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlAsS0FBeEIsRUFBK0I7QUFDN0JRLGdCQUFRWCxHQUFSLENBQVksVUFBWixFQUF3QkssSUFBSUksSUFBNUI7QUFDQTtBQUVEO0FBQ0QsVUFBSUgsSUFBSU0sVUFBSixLQUFtQixHQUF2QixFQUE0QjtBQUMxQlosWUFBSU0sR0FB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LEVBQW1DdUIsR0FBbkM7QUFDQTtBQUNEOztBQUVEdkIsUUFBSSxhQUFKO0FBQ0QsR0FSRDtBQVVEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xudmFyIGV2ZW50VHlwZTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NfcmVxdWVzdHMgPSAoYXBwSWQsIHRva2VuKSA9PiAocmVxLCByZXMpID0+e1xuICBsb2coXCIgMDAxIDogXCIrZXZlbnRUeXBlKVxuICBcblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKXtcbiAgICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gICAgXG4gICAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgICAvLyBvd24gbWVzc2FnZXNcbiAgICAgIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIFxuICAgICAgfVxuICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKHJlcyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICBcbiAgICAgIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcbiAgICBcbiAgICAgIGlmKCFyZXEpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuICAgIFxuICAgICAgbG9nKHJlcS5ib2R5KTtcbiAgICBcbiAgICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gICAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgICAgbG9nKFwiY29tbWFuZCBcIitjb21tYW5kKTtcbiAgICBcbiAgICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcbiAgICAgICAgXG4gICAgXG4gICAgICAgIGlmKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKXtcbiAgICAgICAgICBsb2coXCJ1c2luZyBkaWFsb2dcIilcbiAgICAgICAgICBkaWFsb2cocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgICAgICByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXREaWFsb2dJZCxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcrY29tbWFuZDtcbiAgICBcbiAgICBcbiAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6bWVzc2FnZX0pLnRoZW4oKHRvX3Bvc3QpPT57XG4gICAgICAgICAgXG4gICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcbiAgICBcbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaCgoZXJyKT0+e1xuICAgICAgICAgIGxvZyhcInVuYWJsZSB0byBzZW5kIG1lc3NhZ2UgdG8gc3BhY2VcIiArIGVycik7XG4gICAgICAgIH0pXG4gICAgICB9O1xuXG4gIH1lbHNlIGlmKGV2ZW50VHlwZSA9PT0gJ0VMJyl7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuXG4gICAgLypcbiAgICBldmVudF9saXN0ZW5lcih0b2tlbixcbiAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIGxvZygnRVJST1IgJXMnLCBlcnIpO1xuICAgICAgfSk7Ki9cblxuICAgICAgcmV0dXJuO1xuICAgIFxuICB9ZWxzZXtcblxuICAgIHJlcy5zdGF0dXMoNDAxKS5lbmQoKTtcbiAgICByZXR1cm47XG4gICAgXG4gIH1cbiAgXG4gIFxuXG59XG5cbi8vZnVuY3Rpb24gZm9yIHByb2Nlc3NpbmcgaXNzdWUgZXZlbnRzXG5leHBvcnQgY29uc3QgZXZlbnRfbGlzdGVuZXIgPSAodG9rZW4sY2IpID0+IChyZXEsIHJlcykgPT57XG4gIGxvZyhcIiAwMDIgOiBcIitldmVudFR5cGUpXG4gIC8vY29uc29sZS5kaXIocmVxLmJvZHkse2RlcHRoOm51bGx9KVxuICBcbiAgaWYoZXZlbnRUeXBlID09PSAnRUwnKXtcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gICAgXG4gICAgXG4gICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgIGxvZyhyZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgXG4gICAgbG9nKFwiUHJvY2Vzc2luZyBnaXRodWIgZXZlbnRcIik7XG4gIFxuICAgIGlmKCFyZXEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcbiAgXG4gICAgbG9nKHJlcS5ib2R5KTtcblxuICAgIHZhciByZXN1bHQgPSBwYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgIFxuICAgIC50aGVuKCh0b19wb3N0KT0+e1xuICAgICAgXG4gICAgICBsb2coXCJkYXRhIGdvdCA9IFwiK3RvX3Bvc3QpO1xuXG4gICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgIHV0aWwuZm9ybWF0KFxuICAgICAgICAgICdIZWxsbyBTcGFjZSA6ICVzJyxcbiAgICAgICAgICAgdG9fcG9zdCksXG4gICAgICAgIHRva2VuKCksXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJyk7XG4gICAgICB9KVxuICAgIH0pXG4gICAgXG4gIH1lbHNle1xuICAgIHJldHVybjtcbiAgfVxuICBcblxuXG59XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgZGlhbG9nSWQsY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzXCIpXG5cbiAgdmFyIHEgPSBgYFxuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnLHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0Jzp0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcgLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBgbXV0YXRpb24gY3JlYXRlU3BhY2UgeyBjcmVhdGVTcGFjZShpbnB1dDogeyB0aXRsZTogXFxcIlNwYWNlIHRpdGxlXFxcIiwgIG1lbWJlcnM6IFske3VzZXJJZH1dfSl7IHNwYWNlIHsgJHtzcGFjZUlkfX1gXG5cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ2ZhaWxlZCBlcnI6ICcrZXJyKVxuICAgICAgICBjb25zb2xlLmRpcihyZXMse2RlcHRoOm51bGx9KVxuICAgICAgICBsb2coJ0Vycm9yIGNyZWF0aW5nIGRpYWxvZyAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH1cbiAgKTtcbn07XG5cbi8vZ2V0IGNvbnRlbnQgb2Ygbm90aWZpY2F0aW9uIGZyb20gZ2l0aHViXG5leHBvcnQgY29uc3QgcGFyc2VSZXNwb25zZSA9IChyZXEgLCByZXMpID0+IHtcbiAgbG9nKCdwYXJzZXJlc3BvbnNlJylcbiAgLy92YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAvL3ZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuXG4gIHZhciBGaW5hbE1lc3NhZ2U9J2hlbGxvJztcblxuICAvKmlmKHJlcS5nZXQoJ1gtR2l0aHViLUV2ZW50JykgPT09ICdpc3N1ZV9jb21tZW50JyApe1xuXG4gICAgICBsb2coJ2FjdGlvbjogJytyZXEuYm9keS5hY3Rpb24pXG5cbiAgICAgIEZpbmFsTWVzc2FnZSA9ICdBIENvbW1lbnQgaGFzIGp1c3QgYmVlbiAnXG5cbiAgICAgIGlmKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ2NyZWF0ZWQnKXtcbiAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ2FkZGVkIHRvIGlzc3VlICMnK3JlcS5ib2R5Lmlzc3VlLmlkKycgaW4gcmVwb3NpdG9yeSAnICtyZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUrJyB3aXRoIElEIDogJytyZXEuYm9keS5yZXBvc2l0b3J5LmlkKycgYnkgdXNlciAnK3JlcS5ib2R5LmNvbW1lbnQudXNlci5sb2dpbisnXFxuIFRoZSBjb21tZW50IGNhbiBiZSBmb3VuZCBoZXJlIDogJytyZXEuYm9keS5jb21tZW50Lmh0bWxfdXJsKycuIFxcbiBUaGUgY29udGVudCBvZiB0aGUgY29tbWVudCBpcyA6IFxcbicrcmVxLmJvZHkuYm9keTtcbiAgICAgIH1lbHNle1xuICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSByZXEuYm9keS5hY3Rpb24rJyBhY3Rpb24gbm90IGNvZGVkIHlldC4uLmNvbWluZyBzb29uJ1xuICAgICAgfVxuICAgICAgXG4gIH1cbiAgZWxzZXtcbiAgICAgIGxvZygnRXZlbnQgdHlwZTogJytyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpKVxuICAgICAgRmluYWxNZXNzYWdlID0gJ05vdCBhIGNvbW1lbnQgb24gYW4gaXNzdWUnXG4gIH0qL1xuXG4gIHZhciBGaW5hbERhdGEgPSB7XG4gICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICBcIk1lc3NhZ2VcIjogRmluYWxNZXNzYWdlXG4gIH07XG5cbiAgcmV0dXJuIEZpbmFsRGF0YTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykgKSB7XG4gICAgICBcbiAgICAgIGV2ZW50VHlwZT0nV1cnXG4gICAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgICByZXR1cm47XG4gICAgIFxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gIFwic2hhMT1cIitjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSl7XG5cbiAgICBldmVudFR5cGU9J0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9ZWxzZXtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEse2RlcHRoOm51bGx9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG4gICAgXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcbiAgICBcbiAgICAgICAgLy9naXRodWIgaXNzdWUgZXZlbnRzIGdvIGhlcmVcbiAgICAgICAgZXZlbnRfbGlzdGVuZXIodG9rZW4pLFxuXG4gICAgICAvL2hhbmRsZSBzbGFzaCBjb21tYW5kc1xuICAgICAgcHJvY2Vzc19yZXF1ZXN0cyhhcHBJZCwgdG9rZW4pXG5cbiAgICBcbiAgICApKTtcbiAgfSk7XG59O1xuXG4vLyBBcHAgbWFpbiBlbnRyeSBwb2ludFxuY29uc3QgbWFpbiA9IChhcmd2LCBlbnYsIGNiKSA9PiB7XG5cbiAgLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuICB3ZWJhcHAoXG4gICAgZW52LlNDUlVNQk9UX0FQUElELCBlbnYuU0NSVU1CT1RfU0VDUkVULFxuICAgIGVudi5TQ1JVTUJPVF9XRUJIT09LX1NFQ1JFVCwgKGVyciwgYXBwKSA9PiB7XG5cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgbG9nKFwiYW4gZXJyb3Igb2Njb3VyZWQgXCIgKyBlcnIpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudi5QT1JUKSB7XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG5cbiAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKS5saXN0ZW4oZW52LlBPUlQsIGNiKTtcblxuICAgICAgIC8vZGVmYXVsdCBwYWdlXG4gICAgICAgIGFwcC5nZXQoJy8nLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICByZXNwb25zZS5yZWRpcmVjdCgnaHR0cDovL3dvcmtzcGFjZS5pYm0uY29tJyk7XG4gICAgICAgICAgXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICAvLyBMaXN0ZW4gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUFMgcG9ydCwgZGVmYXVsdCB0byA0NDNcbiAgICAgICAgc3NsLmNvbmYoZW52LCAoZXJyLCBjb25mKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIC8vIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4ocHJvY2Vzcy5hcmd2LCBwcm9jZXNzLmVudiwgKGVycikgPT4ge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHN0YXJ0aW5nIGFwcDonLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZygnQXBwIHN0YXJ0ZWQnKTtcbiAgfSk7XG5cbn1cbiJdfQ==