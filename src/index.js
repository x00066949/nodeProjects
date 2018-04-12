var express = require('express');
var app = express();
import * as request from 'request';
import * as util from 'util';
import * as bparser from 'body-parser';
import { createHmac } from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as oauth from './watson';
import * as board from './scrum_board';
import * as events from './issue_events';

import debug from 'debug';
var bodyParser = require('body-parser');
var path = require('path');
var rp = require('request-promise');
var requireEnv = require("require-environment-variables");

// Setup debug log
const log = debug('watsonwork-scrumbot');
var eventType;

export const process_requests = (appId, token, cb) => (req, res) => {
  log(" 001 : " + eventType)
  //log("token : "+token)
  log("app id " + appId)


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

    if (!req)
      throw new Error('no request provided');

    log(req.body);

    if (req.body.type === 'message-annotation-added' /*&& req.body.annotationPayload.targetAppId === appId*/) {
      let command = JSON.parse(req.body.annotationPayload).actionId;
      //log("action id "+req.body.annotationPayload.actionId);
      log("command " + command);

      if (!command)
        log("no command to process");


      if (command === '/issue pipeline') {
        log("using dialog")
        dialog(req.body.spaceId,
          token(),
          req.body.userId,
          req.body.annotationPayload.targetDialogId,


          (err, res) => {
            if (!err)
              log('sent dialog to %s', req.body.spaceId);
          }

        )
      }else{

      // message represents the message coming in from WW to be processed by the App
      let message = '@scrumbot ' + command;
      
      
            board.getScrumData({ request: req, response: res, UserInput: message }).then((to_post) => {
      
              log("space id " + req.body.spaceId)
              log("data got = " + to_post);
      
              send(req.body.spaceId,
                util.format(
                  'Hey %s, : %s',
                  req.body.userName, to_post),
                token(),
                (err, res) => {
                  if (!err)
                    log('Sent message to space %s', req.body.spaceId);
                })
            }).catch((err) => {
              send(req.body.spaceId,
                util.format(
                  'Hey %s, : %s',
                  req.body.userName, 'Unable to process command'),
                token(),
                (err, res) => {
                  if (!err)
                    log('Sent message to space %s', req.body.spaceId);
                })
              log("unable to process command" + err);
            })

      }

    };

  } else if (eventType === 'EL') {
    res.status(201).end();

    log("EL token : " + oauth.oToken())

    //var toks = oauth.oToken;
    log(" 002 : " + eventType)

    if (res.statusCode !== 201) {
      log(res);
      return;
    }

    log("Processing github event");

    if (!req)
      throw new Error('no request provided');

    log(req.body);

    var promise = events.parseResponse(req, res)
    promise.then((to_post) => {

      log("data got = " + to_post);

      send('5a09b234e4b090bcd7fcf3b2',

        to_post,
        oauth.oToken(),
        (err, res) => {
          if (!err)
            log('Sent message to space ');
        })
    })

    //return;

  } else {

    res.status(401).end();
    return;

  }



}

// Send an app message to the conversation in a space
const send = (spaceId, text, tok, cb) => {

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

          //text : 'Hello \n World ',
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

//dialog boxes
const dialog = (spaceId, tok, userId, dialogId, cb) => {

  log("trying to build dialog boxes")

  var q = `mutation {
    createTargetedMessage(input: {
      conversationId: ${spaceId}
      targetUserId: ${userId}
      targetDialogId: ${dialogId}
      annotations: [
      {
        genericAnnotation: {
          title: "Sample Title",
          text: "Sample Body"
          buttons: [
            {
              postbackButton: {
                title: "Sample Button",
                id: "Sample_Button",
                style: PRIMARY
              }
            }
          ]
        }
      }
      ]
      }) {
      successful
    }
  }`
  const req = request.post('https://api.watsonwork.ibm.com/graphql')
  .set('Authorization', `Bearer ${tok}`)
  .set('Content-Type', 'application/graphql')
  .set('Accept-Encoding', '')
  .send(q.replace(/\s+/g, ' '));

return promisify(req).then(res => {
  if (res.body && res.body.errors) {
      const err = new Error('Error executing GraphQL request');
      err.res = res;
      throw err;
  }

  return res;
});
  /*request.post(
    'https://api.watsonwork.ibm.com/graphql', {

      headers: {
        'jwt': tok,
        'Content-Type': 'application/graphql',
        'x-graphql-view': 'PUBLIC, BETA'
      },
      json: true,
      body: q

    }, (err, res) => {
      if (err || res.statusCode !== 201) {
        log('failed err: ' + err)
        console.dir(res, { depth: null })
        log('Error creating dialog %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    }
  );*/
};

// Verify Watson Work request signature
export const verify = (wsecret) => (req, res, buf, encoding) => {
  if (req.get('X-OUTBOUND-TOKEN') ===
    createHmac('sha256', wsecret).update(buf).digest('hex')) {

    eventType = 'WW'
    log("from WW")
    return;

  }

  else if (req.get('X-HUB-SIGNATURE') ===
    "sha1=" + createHmac('sha1', wsecret).update(buf).digest('hex')) {

    eventType = 'EL'
    log("github event")
    return;

  } else {
    log("Not event from WW or github")
    console.dir(req, { depth: null })
    log('Invalid request signature');


    const err = new Error('Invalid request signature');
    err.status = 401;
    throw err;

  }
};

// Handle Watson Work Webhook challenge requests
export const challenge = (wsecret) => (req, res, next) => {
  if (req.body.type === 'verification') {
    log('Got Webhook verification challenge %o', req.body);
    const body = JSON.stringify({
      response: req.body.challenge
    });
    res.set('X-OUTBOUND-TOKEN',
      createHmac('sha256', wsecret).update(body).digest('hex'));
    res.type('json').send(body);
    return;
  }
  next();
};

// Create Express Web app
export const webapp = (appId, secret, wsecret, cb, eventType) => {
  // Authenticate the app and get an OAuth token
  oauth.run(appId, secret, (err, token) => {
    if (err) {
      cb(err);
      return;
    }

    log("tok : " + token)
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
      process_requests(appId, token)

      ));
  });
};

// App main entry point
const main = (argv, env, cb) => {

  // Create Express Web app
  webapp(
    env.SCRUMBOT_APPID, env.SCRUMBOT_SECRET,
    env.SCRUMBOT_WEBHOOK_SECRET, (err, app) => {

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



      }

      else
        // Listen on the configured HTTPS port, default to 443
        ssl.conf(env, (err, conf) => {
          if (err) {
            cb(err);
            return;
          }
          const port = env.SSLPORT || 443;
          log('HTTPS server listening on port %d', port);
          // https.createServer(conf, app).listen(port, cb);
        });
    });
};

if (require.main === module) {
  main(process.argv, process.env, (err) => {

    if (err) {
      console.log('Error starting app:', err);
      return;
    }

    log('App started');
  });

}
