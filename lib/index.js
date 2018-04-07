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
      }).catch(function (err) {
        log("unable to send message to space" + err);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwidXRpbCIsImJwYXJzZXIiLCJodHRwIiwiaHR0cHMiLCJvYXV0aCIsImJvYXJkIiwiZXZlbnRzIiwiZXhwcmVzcyIsInJlcXVpcmUiLCJhcHAiLCJib2R5UGFyc2VyIiwicGF0aCIsInJwIiwicmVxdWlyZUVudiIsImxvZyIsImV2ZW50VHlwZSIsInByb2Nlc3NfcmVxdWVzdHMiLCJhcHBJZCIsInRva2VuIiwicmVxIiwicmVzIiwic3RhdHVzIiwiZW5kIiwiYm9keSIsInVzZXJJZCIsImNvbnNvbGUiLCJzdGF0dXNDb2RlIiwiRXJyb3IiLCJ0eXBlIiwiY29tbWFuZCIsIkpTT04iLCJwYXJzZSIsImFubm90YXRpb25QYXlsb2FkIiwiYWN0aW9uSWQiLCJkaWFsb2ciLCJzcGFjZUlkIiwidGFyZ2V0RGlhbG9nSWQiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0U2NydW1EYXRhIiwicmVzcG9uc2UiLCJVc2VySW5wdXQiLCJ0aGVuIiwidG9fcG9zdCIsInNlbmQiLCJmb3JtYXQiLCJ1c2VyTmFtZSIsImNhdGNoIiwiZXZlbnRfbGlzdGVuZXIiLCJjYiIsInJlc3VsdCIsInBhcnNlUmVzcG9uc2UiLCJ0ZXh0IiwidG9rIiwicG9zdCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwianNvbiIsInZlcnNpb24iLCJhbm5vdGF0aW9ucyIsImNvbG9yIiwidGl0bGUiLCJhY3RvciIsIm5hbWUiLCJkaWFsb2dJZCIsInEiLCJkaXIiLCJkZXB0aCIsIkZpbmFsTWVzc2FnZSIsIkZpbmFsRGF0YSIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzdHJpbmdpZnkiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJtYWluIiwiYXJndiIsImVudiIsIlNDUlVNQk9UX0FQUElEIiwiU0NSVU1CT1RfU0VDUkVUIiwiU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicmVkaXJlY3QiLCJzc2wiLCJjb25mIiwicG9ydCIsIlNTTFBPUlQiLCJtb2R1bGUiLCJwcm9jZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7OzRCQUFZQSxPOztBQUNaOzs0QkFBWUMsSTs7QUFDWjs7NEJBQVlDLE87O0FBQ1o7O0FBQ0E7OzRCQUFZQyxJOztBQUNaOzs0QkFBWUMsSzs7QUFDWjs7NEJBQVlDLEs7O0FBQ1o7OzRCQUFZQyxLOztBQUNaOzs0QkFBWUMsTTs7QUFFWjs7Ozs7Ozs7QUFaQSxJQUFJQyxVQUFVQyxRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlDLE1BQU1GLFNBQVY7O0FBWUEsSUFBSUcsYUFBYUYsUUFBUSxhQUFSLENBQWpCO0FBQ0EsSUFBSUcsT0FBT0gsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJSSxLQUFLSixRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJSyxhQUFhTCxRQUFRLCtCQUFSLENBQWpCOztBQUVBO0FBQ0EsSUFBTU0sTUFBTSw2Q0FBTSxxQkFBTixDQUFaO0FBQ0EsSUFBSUMsU0FBSjs7QUFFTyxJQUFNQyxzRUFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxLQUFELEVBQVFDLEtBQVI7QUFBQSxTQUFrQixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYTtBQUM3RE4sUUFBSSxZQUFVQyxTQUFkOztBQUdBLFFBQUlBLGNBQWMsSUFBbEIsRUFBdUI7QUFDbkI7QUFDRjtBQUNBSyxVQUFJQyxNQUFKLENBQVcsR0FBWCxFQUFnQkMsR0FBaEI7O0FBRUU7QUFDQTtBQUNBLFVBQUlILElBQUlJLElBQUosQ0FBU0MsTUFBVCxLQUFvQlAsS0FBeEIsRUFBK0I7QUFDN0JRLGdCQUFRWCxHQUFSLENBQVksVUFBWixFQUF3QkssSUFBSUksSUFBNUI7QUFDQTtBQUVEO0FBQ0QsVUFBSUgsSUFBSU0sVUFBSixLQUFtQixHQUF2QixFQUE0QjtBQUMxQlosWUFBSU0sR0FB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Z0MsVUFBQ2pELEdBQUQsRUFBUzs7QUFFdkMsUUFBSUEsR0FBSixFQUFTO0FBQ1BaLGNBQVFYLEdBQVIsQ0FBWSxxQkFBWixFQUFtQ3VCLEdBQW5DO0FBQ0E7QUFDRDs7QUFFRHZCLFFBQUksYUFBSjtBQUNELEdBUkQ7QUFVRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGFwcCA9IGV4cHJlc3MoKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgYnBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgeyBjcmVhdGVIbWFjIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBvYXV0aCBmcm9tICcuL3dhdHNvbic7XG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL3NjcnVtX2JvYXJkJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICcuL2lzc3VlX2V2ZW50cyc7XG5cbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIHJlcXVpcmVFbnYgPSByZXF1aXJlKFwicmVxdWlyZS1lbnZpcm9ubWVudC12YXJpYWJsZXNcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcbnZhciBldmVudFR5cGU7XG5cbmV4cG9ydCBjb25zdCBwcm9jZXNzX3JlcXVlc3RzID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PntcbiAgbG9nKFwiIDAwMSA6IFwiK2V2ZW50VHlwZSlcbiAgXG5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gJ1dXJyl7XG4gICAgICAvLyBSZXNwb25kIHRvIHRoZSBXZWJob29rIHJpZ2h0IGF3YXksIGFzIHRoZSByZXNwb25zZSBtZXNzYWdlIHdpbGxcbiAgICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICAgIFxuICAgICAgLy8gT25seSBoYW5kbGUgbWVzc2FnZS1jcmVhdGVkIFdlYmhvb2sgZXZlbnRzLCBhbmQgaWdub3JlIHRoZSBhcHAnc1xuICAgICAgLy8gb3duIG1lc3NhZ2VzXG4gICAgICBpZiAocmVxLmJvZHkudXNlcklkID09PSBhcHBJZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZXJyb3IgJW8nLCByZXEuYm9keSk7XG4gICAgICAgIHJldHVybjtcbiAgICBcbiAgICAgIH1cbiAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgIGxvZyhyZXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgXG4gICAgICBsb2coXCJQcm9jZXNzaW5nIHNsYXNoIGNvbW1hbmRcIik7XG4gICAgXG4gICAgICBpZighcmVxKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHJlcXVlc3QgcHJvdmlkZWQnKTtcbiAgICBcbiAgICAgIGxvZyhyZXEuYm9keSk7XG4gICAgXG4gICAgICBpZiAocmVxLmJvZHkudHlwZSA9PT0gJ21lc3NhZ2UtYW5ub3RhdGlvbi1hZGRlZCcgLyomJiByZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC50YXJnZXRBcHBJZCA9PT0gYXBwSWQqLykge1xuICAgICAgICBsZXQgY29tbWFuZCA9IEpTT04ucGFyc2UocmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQpLmFjdGlvbklkO1xuICAgICAgICAvL2xvZyhcImFjdGlvbiBpZCBcIityZXEuYm9keS5hbm5vdGF0aW9uUGF5bG9hZC5hY3Rpb25JZCk7XG4gICAgICAgIGxvZyhcImNvbW1hbmQgXCIrY29tbWFuZCk7XG4gICAgXG4gICAgICAgIGlmICghY29tbWFuZClcbiAgICAgICAgICBsb2coXCJubyBjb21tYW5kIHRvIHByb2Nlc3NcIik7XG4gICAgICAgIFxuICAgIFxuICAgICAgICBpZihjb21tYW5kID09PSAnL2lzc3VlIHBpcGVsaW5lJyl7XG4gICAgICAgICAgbG9nKFwidXNpbmcgZGlhbG9nXCIpXG4gICAgICAgICAgZGlhbG9nKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgcmVxLmJvZHkudXNlcklkLFxuICAgICAgICAgICAgcmVxLmJvZHkuYW5ub3RhdGlvblBheWxvYWQudGFyZ2V0RGlhbG9nSWQsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnc2VudCBkaWFsb2cgdG8gJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgLy8gbWVzc2FnZSByZXByZXNlbnRzIHRoZSBtZXNzYWdlIGNvbWluZyBpbiBmcm9tIFdXIHRvIGJlIHByb2Nlc3NlZCBieSB0aGUgQXBwXG4gICAgICAgIGxldCBtZXNzYWdlID0gJ0BzY3J1bWJvdCAnK2NvbW1hbmQ7XG4gICAgXG4gICAgXG4gICAgICAgIGJvYXJkLmdldFNjcnVtRGF0YSh7cmVxdWVzdDpyZXEsIHJlc3BvbnNlOnJlcywgVXNlcklucHV0Om1lc3NhZ2V9KS50aGVuKCh0b19wb3N0KT0+e1xuICAgICAgICAgIFxuICAgICAgICAgIGxvZyhcImRhdGEgZ290ID0gXCIrdG9fcG9zdCk7XG4gICAgXG4gICAgICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICAgICAgICdIZXkgJXMsIHJlc3VsdCBpczogJXMnLFxuICAgICAgICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgdG9fcG9zdCksXG4gICAgICAgICAgICB0b2tlbigpLFxuICAgICAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICVzJywgcmVxLmJvZHkuc3BhY2VJZCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goKGVycik9PntcbiAgICAgICAgICBsb2coXCJ1bmFibGUgdG8gc2VuZCBtZXNzYWdlIHRvIHNwYWNlXCIgKyBlcnIpO1xuICAgICAgICB9KVxuICAgICAgfTtcblxuICB9ZWxzZSBpZihldmVudFR5cGUgPT09ICdFTCcpe1xuICAgIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAgIC8qXG4gICAgZXZlbnRfbGlzdGVuZXIodG9rZW4sXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICBsb2coJ0VSUk9SICVzJywgZXJyKTtcbiAgICAgIH0pOyovXG5cbiAgICAgIHJldHVybjtcbiAgICBcbiAgfWVsc2V7XG5cbiAgICByZXMuc3RhdHVzKDQwMSkuZW5kKCk7XG4gICAgcmV0dXJuO1xuICAgIFxuICB9XG4gIFxuICBcblxufVxuXG4vL2Z1bmN0aW9uIGZvciBwcm9jZXNzaW5nIGlzc3VlIGV2ZW50c1xuZXhwb3J0IGNvbnN0IGV2ZW50X2xpc3RlbmVyID0gKHRva2VuLGNiKSA9PiAocmVxLCByZXMpID0+e1xuICBsb2coXCIgMDAyIDogXCIrZXZlbnRUeXBlKVxuICAvL2NvbnNvbGUuZGlyKHJlcS5ib2R5LHtkZXB0aDpudWxsfSlcbiAgXG4gIGlmKGV2ZW50VHlwZSA9PT0gJ0VMJyl7XG4gICAgcmVzLnN0YXR1cygyMDEpLmVuZCgpO1xuICAgIFxuICAgIFxuICAgIGlmIChyZXMuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICBsb2cocmVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIFxuICAgIGxvZyhcIlByb2Nlc3NpbmcgZ2l0aHViIGV2ZW50XCIpO1xuICBcbiAgICBpZighcmVxKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyByZXF1ZXN0IHByb3ZpZGVkJyk7XG4gIFxuICAgIGxvZyhyZXEuYm9keSk7XG5cbiAgICB2YXIgcmVzdWx0ID0gcGFyc2VSZXNwb25zZShyZXEsIHJlcylcbiAgICBcbiAgICAudGhlbigodG9fcG9zdCk9PntcbiAgICAgIFxuICAgICAgbG9nKFwiZGF0YSBnb3QgPSBcIit0b19wb3N0KTtcblxuICAgICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgICAnSGVsbG8gU3BhY2UgOiAlcycsXG4gICAgICAgICAgIHRvX3Bvc3QpLFxuICAgICAgICB0b2tlbigpLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnU2VudCBtZXNzYWdlIHRvIHNwYWNlICcpO1xuICAgICAgfSlcbiAgICB9KS5jYXRjaCgoZXJyKT0+e1xuICAgICAgbG9nKFwidW5hYmxlIHRvIHNlbmQgbWVzc2FnZSB0byBzcGFjZVwiICsgZXJyKTtcbiAgICB9KVxuICAgIFxuICB9ZWxzZXtcbiAgICByZXR1cm47XG4gIH1cbiAgXG5cblxufVxuXG4vLyBTZW5kIGFuIGFwcCBtZXNzYWdlIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gYSBzcGFjZVxuY29uc3Qgc2VuZCA9IChzcGFjZUlkLCB0ZXh0LCB0b2ssIGNiKSA9PiB7XG5cbiAgcmVxdWVzdC5wb3N0KFxuICAgICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vdjEvc3BhY2VzLycgKyBzcGFjZUlkICsgJy9tZXNzYWdlcycsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIC8vIEFuIEFwcCBtZXNzYWdlIGNhbiBzcGVjaWZ5IGEgY29sb3IsIGEgdGl0bGUsIG1hcmtkb3duIHRleHQgYW5kXG4gICAgICAvLyBhbiAnYWN0b3InIHVzZWZ1bCB0byBzaG93IHdoZXJlIHRoZSBtZXNzYWdlIGlzIGNvbWluZyBmcm9tXG4gICAgICBib2R5OiB7XG4gICAgICAgIHR5cGU6ICdhcHBNZXNzYWdlJyxcbiAgICAgICAgdmVyc2lvbjogMS4wLFxuICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICB0eXBlOiAnZ2VuZXJpYycsXG4gICAgICAgICAgdmVyc2lvbjogMS4wLFxuXG4gICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICB0aXRsZTogJ2dpdGh1YiBpc3N1ZSB0cmFja2VyJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgLy90ZXh0IDogJ0hlbGxvIFxcbiBXb3JsZCAnLFxuICAgICAgICAgIGFjdG9yOiB7XG4gICAgICAgICAgICBuYW1lOiAnZ2l0aHViIGlzc3VlIGFwcCdcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vZGlhbG9nIGJveGVzXG5jb25zdCBkaWFsb2cgPSAoc3BhY2VJZCwgdG9rLCB1c2VySWQsIGRpYWxvZ0lkLGNiKSA9PiB7XG5cbiAgbG9nKFwidHJ5aW5nIHRvIGJ1aWxkIGRpYWxvZyBib3hlc1wiKVxuXG4gIHZhciBxID0gYGBcblxuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9ncmFwaHFsJyx7XG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ2p3dCc6dG9rLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2dyYXBocWwnICxcbiAgICAgICAgJ3gtZ3JhcGhxbC12aWV3JzogJ1BVQkxJQywgQkVUQSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keTogYG11dGF0aW9uIGNyZWF0ZVNwYWNlIHsgY3JlYXRlU3BhY2UoaW5wdXQ6IHsgdGl0bGU6IFxcXCJTcGFjZSB0aXRsZVxcXCIsICBtZW1iZXJzOiBbJHt1c2VySWR9XX0peyBzcGFjZSB7ICR7c3BhY2VJZH19YFxuXG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdmYWlsZWQgZXJyOiAnK2VycilcbiAgICAgICAgY29uc29sZS5kaXIocmVzLHtkZXB0aDpudWxsfSlcbiAgICAgICAgbG9nKCdFcnJvciBjcmVhdGluZyBkaWFsb2cgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9XG4gICk7XG59O1xuXG4vL2dldCBjb250ZW50IG9mIG5vdGlmaWNhdGlvbiBmcm9tIGdpdGh1YlxuZXhwb3J0IGNvbnN0IHBhcnNlUmVzcG9uc2UgPSAocmVxICwgcmVzKSA9PiB7XG4gIGxvZygncGFyc2VyZXNwb25zZScpXG4gIC8vdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgLy92YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcblxuICB2YXIgRmluYWxNZXNzYWdlPSdoZWxsbyc7XG5cbiAgLyppZihyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpID09PSAnaXNzdWVfY29tbWVudCcgKXtcblxuICAgICAgbG9nKCdhY3Rpb246ICcrcmVxLmJvZHkuYWN0aW9uKVxuXG4gICAgICBGaW5hbE1lc3NhZ2UgPSAnQSBDb21tZW50IGhhcyBqdXN0IGJlZW4gJ1xuXG4gICAgICBpZihyZXEuYm9keS5hY3Rpb24gPT09ICdjcmVhdGVkJyl7XG4gICAgICAgICAgRmluYWxNZXNzYWdlICs9ICdhZGRlZCB0byBpc3N1ZSAjJytyZXEuYm9keS5pc3N1ZS5pZCsnIGluIHJlcG9zaXRvcnkgJyArcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lKycgd2l0aCBJRCA6ICcrcmVxLmJvZHkucmVwb3NpdG9yeS5pZCsnIGJ5IHVzZXIgJytyZXEuYm9keS5jb21tZW50LnVzZXIubG9naW4rJ1xcbiBUaGUgY29tbWVudCBjYW4gYmUgZm91bmQgaGVyZSA6ICcrcmVxLmJvZHkuY29tbWVudC5odG1sX3VybCsnLiBcXG4gVGhlIGNvbnRlbnQgb2YgdGhlIGNvbW1lbnQgaXMgOiBcXG4nK3JlcS5ib2R5LmJvZHk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gcmVxLmJvZHkuYWN0aW9uKycgYWN0aW9uIG5vdCBjb2RlZCB5ZXQuLi5jb21pbmcgc29vbidcbiAgICAgIH1cbiAgICAgIFxuICB9XG4gIGVsc2V7XG4gICAgICBsb2coJ0V2ZW50IHR5cGU6ICcrcmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSlcbiAgICAgIEZpbmFsTWVzc2FnZSA9ICdOb3QgYSBjb21tZW50IG9uIGFuIGlzc3VlJ1xuICB9Ki9cblxuICB2YXIgRmluYWxEYXRhID0ge1xuICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgXCJNZXNzYWdlXCI6IEZpbmFsTWVzc2FnZVxuICB9O1xuXG4gIHJldHVybiBGaW5hbERhdGE7XG59XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYgKHJlcS5nZXQoJ1gtT1VUQk9VTkQtVE9LRU4nKSA9PT1cbiAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYnVmKS5kaWdlc3QoJ2hleCcpICkge1xuICAgICAgXG4gICAgICBldmVudFR5cGU9J1dXJ1xuICAgICAgbG9nKFwiZnJvbSBXV1wiKVxuICAgICAgcmV0dXJuO1xuICAgICBcbiAgfVxuXG4gIGVsc2UgaWYgKHJlcS5nZXQoJ1gtSFVCLVNJR05BVFVSRScpID09PVxuICBcInNoYTE9XCIrY3JlYXRlSG1hYygnc2hhMScsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4Jykpe1xuXG4gICAgZXZlbnRUeXBlPSdFTCdcbiAgICBsb2coXCJnaXRodWIgZXZlbnRcIilcbiAgICByZXR1cm47XG5cbiAgfWVsc2V7XG4gICAgbG9nKFwiTm90IGV2ZW50IGZyb20gV1cgb3IgZ2l0aHViXCIpXG4gICAgY29uc29sZS5kaXIocmVxLHtkZXB0aDpudWxsfSlcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcblxuICAgIFxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignSW52YWxpZCByZXF1ZXN0IHNpZ25hdHVyZScpO1xuICAgIGVyci5zdGF0dXMgPSA0MDE7XG4gICAgdGhyb3cgZXJyO1xuXG4gIH1cbn07XG5cbi8vIEhhbmRsZSBXYXRzb24gV29yayBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0c1xuZXhwb3J0IGNvbnN0IGNoYWxsZW5nZSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgaWYgKHJlcS5ib2R5LnR5cGUgPT09ICd2ZXJpZmljYXRpb24nKSB7XG4gICAgbG9nKCdHb3QgV2ViaG9vayB2ZXJpZmljYXRpb24gY2hhbGxlbmdlICVvJywgcmVxLmJvZHkpO1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICByZXNwb25zZTogcmVxLmJvZHkuY2hhbGxlbmdlXG4gICAgfSk7XG4gICAgcmVzLnNldCgnWC1PVVRCT1VORC1UT0tFTicsXG4gICAgICBjcmVhdGVIbWFjKCdzaGEyNTYnLCB3c2VjcmV0KS51cGRhdGUoYm9keSkuZGlnZXN0KCdoZXgnKSk7XG4gICAgcmVzLnR5cGUoJ2pzb24nKS5zZW5kKGJvZHkpO1xuICAgIHJldHVybjtcbiAgfVxuICBuZXh0KCk7XG59O1xuXG4vLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG5leHBvcnQgY29uc3Qgd2ViYXBwID0gKGFwcElkLCBzZWNyZXQsIHdzZWNyZXQsIGNiLCBldmVudFR5cGUpID0+IHtcbiAgLy8gQXV0aGVudGljYXRlIHRoZSBhcHAgYW5kIGdldCBhbiBPQXV0aCB0b2tlblxuICBvYXV0aC5ydW4oYXBwSWQsIHNlY3JldCwgKGVyciwgdG9rZW4pID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgRXhwcmVzcyBXZWIgYXBwXG4gICAgY2IobnVsbCwgZXhwcmVzcygpXG5cbiAgICAgIC8vIENvbmZpZ3VyZSBFeHByZXNzIHJvdXRlIGZvciB0aGUgYXBwIFdlYmhvb2tcbiAgICAgIC5wb3N0KCcvc2NydW1ib3QnLFxuXG4gICAgICAvLyBWZXJpZnkgV2F0c29uIFdvcmsgcmVxdWVzdCBzaWduYXR1cmUgYW5kIHBhcnNlIHJlcXVlc3QgYm9keVxuICAgICAgYnBhcnNlci5qc29uKHtcbiAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgIHZlcmlmeTogdmVyaWZ5KHdzZWNyZXQpXG4gICAgICB9KSxcblxuICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICBjaGFsbGVuZ2Uod3NlY3JldCksXG5cbiAgICAgIC8vIEhhbmRsZSBXYXRzb24gV29yayBtZXNzYWdlc1xuICAgICAgLy9zY3J1bWJvdChhcHBJZCwgdG9rZW4pKSk7XG4gICAgXG4gICAgICAgIC8vZ2l0aHViIGlzc3VlIGV2ZW50cyBnbyBoZXJlXG4gICAgICAgIGV2ZW50X2xpc3RlbmVyKHRva2VuKSxcblxuICAgICAgLy9oYW5kbGUgc2xhc2ggY29tbWFuZHNcbiAgICAgIHByb2Nlc3NfcmVxdWVzdHMoYXBwSWQsIHRva2VuKVxuXG4gICAgXG4gICAgKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuXG4gIC8vIENyZWF0ZSBFeHByZXNzIFdlYiBhcHBcbiAgd2ViYXBwKFxuICAgIGVudi5TQ1JVTUJPVF9BUFBJRCwgZW52LlNDUlVNQk9UX1NFQ1JFVCxcbiAgICBlbnYuU0NSVU1CT1RfV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIGxvZyhcImFuIGVycm9yIG9jY291cmVkIFwiICsgZXJyKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYuUE9SVCkge1xuICAgICAgICBsb2coJ0hUVFAgc2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICVkJywgZW52LlBPUlQpO1xuXG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG5cbiAgICAgICAvL2RlZmF1bHQgcGFnZVxuICAgICAgICBhcHAuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UucmVkaXJlY3QoJ2h0dHA6Ly93b3Jrc3BhY2UuaWJtLmNvbScpO1xuICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgICAgXG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHBvcnQgPSBlbnYuU1NMUE9SVCB8fCA0NDM7XG4gICAgICAgICAgbG9nKCdIVFRQUyBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgICAgICAvLyBodHRwcy5jcmVhdGVTZXJ2ZXIoY29uZiwgYXBwKS5saXN0ZW4ocG9ydCwgY2IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2coJ0FwcCBzdGFydGVkJyk7XG4gIH0pO1xuXG59XG4iXX0=