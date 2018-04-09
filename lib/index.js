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

var process_requests = /*istanbul ignore next*/exports.process_requests = function process_requests(appId, token, cb) /*istanbul ignore next*/{
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
      log(" 002 : " + eventType);

      if (res.statusCode !== 201) {
        log(res);
        return;
      }

      log("Processing github event");

      if (!req) throw new Error('no request provided');

      log(req.body);

      parseResponse(req, res).then(function (to_post) {

        log("data got = " + to_post);

        send(req.body.spaceId, util.format('Hello Space : %s', to_post), token(), function (err, res) {
          if (!err) log('Sent message to space ');
        });
      });

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
  return function (req, res) {};
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

  log(FinalData);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwiY2IiLCJyZXEiLCJyZXMiLCJzdGF0dXMiLCJlbmQiLCJib2R5IiwidXNlcklkIiwiY29uc29sZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInR5cGUiLCJjb21tYW5kIiwiSlNPTiIsInBhcnNlIiwiYW5ub3RhdGlvblBheWxvYWQiLCJhY3Rpb25JZCIsImRpYWxvZyIsInNwYWNlSWQiLCJ0YXJnZXREaWFsb2dJZCIsImVyciIsIm1lc3NhZ2UiLCJnZXRTY3J1bURhdGEiLCJyZXNwb25zZSIsIlVzZXJJbnB1dCIsInRoZW4iLCJ0b19wb3N0Iiwic2VuZCIsImZvcm1hdCIsInVzZXJOYW1lIiwiY2F0Y2giLCJwYXJzZVJlc3BvbnNlIiwiZXZlbnRfbGlzdGVuZXIiLCJ0ZXh0IiwidG9rIiwicG9zdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwianNvbiIsInZlcnNpb24iLCJhbm5vdGF0aW9ucyIsImNvbG9yIiwidGl0bGUiLCJhY3RvciIsIm5hbWUiLCJkaWFsb2dJZCIsInEiLCJkaXIiLCJkZXB0aCIsIkZpbmFsTWVzc2FnZSIsIkZpbmFsRGF0YSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFFWjs7Ozs7Ozs7QUFaQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBWUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVIsRUFBY0MsRUFBZDtBQUFBLFNBQXFCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFhO0FBQ2hFUCxRQUFJLFlBQVVDLFNBQWQ7O0FBR0EsUUFBSUEsY0FBYyxJQUFsQixFQUF1QjtBQUNuQjtBQUNGO0FBQ0FNLFVBQUlDLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjs7QUFFRTtBQUNBO0FBQ0EsVUFBSUgsSUFBSUksSUFBSixDQUFTQyxNQUFULEtBQW9CUixLQUF4QixFQUErQjtBQUM3QlMsZ0JBQVFaLEdBQVIsQ0FBWSxVQUFaLEVBQXdCTSxJQUFJSSxJQUE1QjtBQUNBO0FBRUQ7QUFDRCxVQUFJSCxJQUFJTSxVQUFKLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzFCYixZQUFJTyxH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Jyk7XG52YXIgYXBwID0gZXhwcmVzcygpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBicGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZUhtYWMgfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9hdXRoIGZyb20gJy4vd2F0c29uJztcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vc2NydW1fYm9hcmQnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vaXNzdWVfZXZlbnRzJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcmVxdWlyZUVudiA9IHJlcXVpcmUoXCJyZXF1aXJlLWVudmlyb25tZW50LXZhcmlhYmxlc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xudmFyIGV2ZW50VHlwZTtcblxuZXhwb3J0IGNvbnN0IHByb2Nlc3NfcmVxdWVzdHMgPSAoYXBwSWQsIHRva2VuLGNiKSA9PiAocmVxLCByZXMpID0+e1xuICBsb2coXCIgMDAxIDogXCIrZXZlbnRUeXBlKVxuICBcblxuICBpZiAoZXZlbnRUeXBlID09PSAnV1cnKXtcbiAgICAgIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAgIC8vIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXMuc3RhdHVzKDIwMSkuZW5kKCk7XG4gICAgXG4gICAgICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gICAgICAvLyBvd24gbWVzc2FnZXNcbiAgICAgIGlmIChyZXEuYm9keS51c2VySWQgPT09IGFwcElkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAlbycsIHJlcS5ib2R5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIFxuICAgICAgfVxuICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKHJlcyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICBcbiAgICAgIGxvZyhcIlByb2Nlc3Npbmcgc2xhc2ggY29tbWFuZFwiKTtcbiAgICBcbiAgICAgIGlmKCFyZXEpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuICAgIFxuICAgICAgbG9nKHJlcS5ib2R5KTtcbiAgICBcbiAgICAgIGlmIChyZXEuYm9keS50eXBlID09PSAnbWVzc2FnZS1hbm5vdGF0aW9uLWFkZGVkJyAvKiYmIHJlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLnRhcmdldEFwcElkID09PSBhcHBJZCovKSB7XG4gICAgICAgIGxldCBjb21tYW5kID0gSlNPTi5wYXJzZShyZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZCkuYWN0aW9uSWQ7XG4gICAgICAgIC8vbG9nKFwiYWN0aW9uIGlkIFwiK3JlcS5ib2R5LmFubm90YXRpb25QYXlsb2FkLmFjdGlvbklkKTtcbiAgICAgICAgbG9nKFwiY29tbWFuZCBcIitjb21tYW5kKTtcbiAgICBcbiAgICAgICAgaWYgKCFjb21tYW5kKVxuICAgICAgICAgIGxvZyhcIm5vIGNvbW1hbmQgdG8gcHJvY2Vzc1wiKTtcbiAgICAgICAgXG4gICAgXG4gICAgICAgIGlmKGNvbW1hbmQgPT09ICcvaXNzdWUgcGlwZWxpbmUnKXtcbiAgICAgICAgICBsb2coXCJ1c2luZyBkaWFsb2dcIilcbiAgICAgICAgICBkaWFsb2cocmVxLmJvZHkuc3BhY2VJZCxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICByZXEuYm9keS51c2VySWQsXG4gICAgICAgICAgICByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXREaWFsb2dJZCxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdzZW50IGRpYWxvZyB0byAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAvLyBtZXNzYWdlIHJlcHJlc2VudHMgdGhlIG1lc3NhZ2UgY29taW5nIGluIGZyb20gV1cgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBBcHBcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnQHNjcnVtYm90ICcrY29tbWFuZDtcbiAgICBcbiAgICBcbiAgICAgICAgYm9hcmQuZ2V0U2NydW1EYXRhKHtyZXF1ZXN0OnJlcSwgcmVzcG9uc2U6cmVzLCBVc2VySW5wdXQ6bWVzc2FnZX0pLnRoZW4oKHRvX3Bvc3QpPT57XG4gICAgICAgICAgXG4gICAgICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcbiAgICBcbiAgICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAgICAgJ0hleSAlcywgcmVzdWx0IGlzOiAlcycsXG4gICAgICAgICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCB0b19wb3N0KSxcbiAgICAgICAgICAgIHRva2VuKCksXG4gICAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaCgoZXJyKT0+e1xuICAgICAgICAgIGxvZyhcInVuYWJsZSB0byBzZW5kIG1lc3NhZ2UgdG8gc3BhY2VcIiArIGVycik7XG4gICAgICAgIH0pXG4gICAgICB9O1xuXG4gIH1lbHNlIGlmKGV2ZW50VHlwZSA9PT0gJ0VMJyl7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICAgIGxvZyhcIiAwMDIgOiBcIitldmVudFR5cGUpXG4gICAgICBcbiAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZyhyZXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgXG4gICAgICBsb2coXCJQcm9jZXNzaW5nIGdpdGh1YiBldmVudFwiKTtcbiAgICBcbiAgICAgIGlmKCFyZXEpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gcmVxdWVzdCBwcm92aWRlZCcpO1xuICAgIFxuICAgICAgbG9nKHJlcS5ib2R5KTtcbiAgXG4gICAgICBwYXJzZVJlc3BvbnNlKHJlcSwgcmVzKVxuICAgICAgXG4gICAgICAudGhlbigodG9fcG9zdCk9PntcbiAgICAgICAgXG4gICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG4gIFxuICAgICAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAnSGVsbG8gU3BhY2UgOiAlcycsXG4gICAgICAgICAgICAgdG9fcG9zdCksXG4gICAgICAgICAgdG9rZW4oKSxcbiAgICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAnKTtcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICBcbiAgICBcbiAgICBcblxuICAgIC8qXG4gICAgZXZlbnRfbGlzdGVuZXIodG9rZW4sXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICBsb2coJ0VSUk9SICVzJywgZXJyKTtcbiAgICAgIH0pOyovXG5cbiAgICAgIHJldHVybjtcbiAgICBcbiAgfWVsc2V7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuICAgIFxuICB9XG4gIFxuICBcblxufVxuXG4vL2Z1bmN0aW9uIGZvciBwcm9jZXNzaW5nIGlzc3VlIGV2ZW50c1xuZXhwb3J0IGNvbnN0IGV2ZW50X2xpc3RlbmVyID0gKHRva2VuLGNiKSA9PiAocmVxLCByZXMpID0+e1xuICBcblxuXG59XG5cbi8vIFNlbmQgYW4gYXBwIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvbiBpbiBhIHNwYWNlXG5jb25zdCBzZW5kID0gKHNwYWNlSWQsIHRleHQsIHRvaywgY2IpID0+IHtcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnZ2l0aHViIGlzc3VlIHRyYWNrZXInLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG5cbiAgICAgICAgICAvL3RleHQgOiAnSGVsbG8gXFxuIFdvcmxkICcsXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdnaXRodWIgaXNzdWUgYXBwJ1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH1cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZSAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH0pO1xufTtcblxuLy9kaWFsb2cgYm94ZXNcbmNvbnN0IGRpYWxvZyA9IChzcGFjZUlkLCB0b2ssIHVzZXJJZCwgZGlhbG9nSWQsY2IpID0+IHtcblxuICBsb2coXCJ0cnlpbmcgdG8gYnVpbGQgZGlhbG9nIGJveGVzXCIpXG5cbiAgdmFyIHEgPSBgYFxuXG4gIHJlcXVlc3QucG9zdChcbiAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL2dyYXBocWwnLHtcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnand0Jzp0b2ssXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vZ3JhcGhxbCcgLFxuICAgICAgICAneC1ncmFwaHFsLXZpZXcnOiAnUFVCTElDLCBCRVRBJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBgbXV0YXRpb24gY3JlYXRlU3BhY2UgeyBjcmVhdGVTcGFjZShpbnB1dDogeyB0aXRsZTogXFxcIlNwYWNlIHRpdGxlXFxcIiwgIG1lbWJlcnM6IFske3VzZXJJZH1dfSl7IHNwYWNlIHsgJHtzcGFjZUlkfX1gXG5cbiAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICBsb2coJ2ZhaWxlZCBlcnI6ICcrZXJyKVxuICAgICAgICBjb25zb2xlLmRpcihyZXMse2RlcHRoOm51bGx9KVxuICAgICAgICBsb2coJ0Vycm9yIGNyZWF0aW5nIGRpYWxvZyAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nKCdTZW5kIHJlc3VsdCAlZCwgJW8nLCByZXMuc3RhdHVzQ29kZSwgcmVzLmJvZHkpO1xuICAgICAgY2IobnVsbCwgcmVzLmJvZHkpO1xuICAgIH1cbiAgKTtcbn07XG5cbi8vZ2V0IGNvbnRlbnQgb2Ygbm90aWZpY2F0aW9uIGZyb20gZ2l0aHViXG5leHBvcnQgY29uc3QgcGFyc2VSZXNwb25zZSA9IChyZXEgLCByZXMpID0+IHtcbiAgbG9nKCdwYXJzZXJlc3BvbnNlJylcbiAgLy92YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAvL3ZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuXG4gIHZhciBGaW5hbE1lc3NhZ2U9J2hlbGxvJztcblxuICAvKmlmKHJlcS5nZXQoJ1gtR2l0aHViLUV2ZW50JykgPT09ICdpc3N1ZV9jb21tZW50JyApe1xuXG4gICAgICBsb2coJ2FjdGlvbjogJytyZXEuYm9keS5hY3Rpb24pXG5cbiAgICAgIEZpbmFsTWVzc2FnZSA9ICdBIENvbW1lbnQgaGFzIGp1c3QgYmVlbiAnXG5cbiAgICAgIGlmKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ2NyZWF0ZWQnKXtcbiAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ2FkZGVkIHRvIGlzc3VlICMnK3JlcS5ib2R5Lmlzc3VlLmlkKycgaW4gcmVwb3NpdG9yeSAnICtyZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUrJyB3aXRoIElEIDogJytyZXEuYm9keS5yZXBvc2l0b3J5LmlkKycgYnkgdXNlciAnK3JlcS5ib2R5LmNvbW1lbnQudXNlci5sb2dpbisnXFxuIFRoZSBjb21tZW50IGNhbiBiZSBmb3VuZCBoZXJlIDogJytyZXEuYm9keS5jb21tZW50Lmh0bWxfdXJsKycuIFxcbiBUaGUgY29udGVudCBvZiB0aGUgY29tbWVudCBpcyA6IFxcbicrcmVxLmJvZHkuYm9keTtcbiAgICAgIH1lbHNle1xuICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSByZXEuYm9keS5hY3Rpb24rJyBhY3Rpb24gbm90IGNvZGVkIHlldC4uLmNvbWluZyBzb29uJ1xuICAgICAgfVxuICAgICAgXG4gIH1cbiAgZWxzZXtcbiAgICAgIGxvZygnRXZlbnQgdHlwZTogJytyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpKVxuICAgICAgRmluYWxNZXNzYWdlID0gJ05vdCBhIGNvbW1lbnQgb24gYW4gaXNzdWUnXG4gIH0qL1xuXG4gIHZhciBGaW5hbERhdGEgPSB7XG4gICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICBcIk1lc3NhZ2VcIjogRmluYWxNZXNzYWdlXG4gIH07XG5cbiAgbG9nKEZpbmFsRGF0YSlcbiAgcmV0dXJuIEZpbmFsRGF0YTtcbn1cblxuLy8gVmVyaWZ5IFdhdHNvbiBXb3JrIHJlcXVlc3Qgc2lnbmF0dXJlXG5leHBvcnQgY29uc3QgdmVyaWZ5ID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgYnVmLCBlbmNvZGluZykgPT4ge1xuICBpZiAocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpID09PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykgKSB7XG4gICAgICBcbiAgICAgIGV2ZW50VHlwZT0nV1cnXG4gICAgICBsb2coXCJmcm9tIFdXXCIpXG4gICAgICByZXR1cm47XG4gICAgIFxuICB9XG5cbiAgZWxzZSBpZiAocmVxLmdldCgnWC1IVUItU0lHTkFUVVJFJykgPT09XG4gIFwic2hhMT1cIitjcmVhdGVIbWFjKCdzaGExJywgd3NlY3JldCkudXBkYXRlKGJ1ZikuZGlnZXN0KCdoZXgnKSl7XG5cbiAgICBldmVudFR5cGU9J0VMJ1xuICAgIGxvZyhcImdpdGh1YiBldmVudFwiKVxuICAgIHJldHVybjtcblxuICB9ZWxzZXtcbiAgICBsb2coXCJOb3QgZXZlbnQgZnJvbSBXVyBvciBnaXRodWJcIilcbiAgICBjb25zb2xlLmRpcihyZXEse2RlcHRoOm51bGx9KVxuICAgIGxvZygnSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuXG4gICAgXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbnZhbGlkIHJlcXVlc3Qgc2lnbmF0dXJlJyk7XG4gICAgZXJyLnN0YXR1cyA9IDQwMTtcbiAgICB0aHJvdyBlcnI7XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ3ZlcmlmaWNhdGlvbicpIHtcbiAgICBsb2coJ0dvdCBXZWJob29rIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgJW8nLCByZXEuYm9keSk7XG4gICAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHJlc3BvbnNlOiByZXEuYm9keS5jaGFsbGVuZ2VcbiAgICB9KTtcbiAgICByZXMuc2V0KCdYLU9VVEJPVU5ELVRPS0VOJyxcbiAgICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShib2R5KS5kaWdlc3QoJ2hleCcpKTtcbiAgICByZXMudHlwZSgnanNvbicpLnNlbmQoYm9keSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5leHQoKTtcbn07XG5cbi8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbmV4cG9ydCBjb25zdCB3ZWJhcHAgPSAoYXBwSWQsIHNlY3JldCwgd3NlY3JldCwgY2IsIGV2ZW50VHlwZSkgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNiKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBFeHByZXNzIFdlYiBhcHBcbiAgICBjYihudWxsLCBleHByZXNzKClcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3Mgcm91dGUgZm9yIHRoZSBhcHAgV2ViaG9va1xuICAgICAgLnBvc3QoJy9zY3J1bWJvdCcsXG5cbiAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICBicGFyc2VyLmpzb24oe1xuICAgICAgICB0eXBlOiAnKi8qJyxcbiAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgIH0pLFxuXG4gICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgV2ViaG9vayBjaGFsbGVuZ2UgcmVxdWVzdHNcbiAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIG1lc3NhZ2VzXG4gICAgICAvL3NjcnVtYm90KGFwcElkLCB0b2tlbikpKTtcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=