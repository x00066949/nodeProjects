var express = require('express');
var app = express();
import * as request from 'request';
import * as util from 'util';
import * as bparser from 'body-parser';
import { createHmac } from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as oauth from './watson';

//import * as ssl from './ssl';
import debug from 'debug';
var bodyParser = require('body-parser');
var path = require('path');
var rp = require('request-promise');
var requireEnv = require("require-environment-variables");
//requireEnv(['npm_package_scripts_GIT_CLIENT_ID', 'npm_package_scripts_GIT_CLIENT_SECRET', 'npm_package_scripts_ZENHUB_TOKEN']);

// Setup debug log
const log = debug('watsonwork-scrumbot');

var message;

app.use(express.static(__dirname + '/view'));
//Store all HTML files in view folder.
app.use(express.static(__dirname + '/script'));
//Store all JS and CSS in Scripts folder.

//to show in browser
//set route for homepage 
const gitConnect = () => {
	rp({
		uri: 'https://api.github.com/',
		
		headers: {
      'User-Agent': 'simple_rest_app',
		},
		qs: {
		  //q: id,
		  //client_id: env.GIT_CLIENT_ID,
      //client_secret : env.GIT_CLIENT_SECRET
      client_id: process.env.GIT_CLIENT_ID,
      client_secret : process.env.GIT_CLIENT_SECRET
		},
		json: true
	  })
		.then((data) => {
      message = data;	
      log(data)
      
		  //response.send(data)
		})
		.catch((err) => {
      console.log(err)
		  //response.send('error : '+err)
    })
	
};

export const scrumbot = (appId, token) => (req,res) => {
   // Respond to the Webhook right away, as the response message will
  // be sent asynchronously
  res.status(201).end();
  
  // Only handle message-created Webhook events, and ignore the app's
  // own messages
  if(req.body.userId === appId){
    console.log('error %o', req.body);
    return;
    
  }
  if(res.statusCode !== 201 ) {
    log(res);
    return;
  }

  if(req.body.type === 'message-annotation-added' && req.body.annotationType === 'actionSelected'){  
    const annotationPayload = req.body.annotationPayload;
    //if (annotationPayload.actionId ===  ''){
        log(req.body);
    //}

  }  

  //handle new messages and ignore the app's own messages
  if(req.body.type === 'message-created' && req.body.userId !== appId){  
    log('Got a message %o', req.body);
    gitConnect();
    
    //send to space
    send(req.body.spaceId,
      util.format(
        'Hey %s, result is: %s',
        req.body.userName, message.issues_url ),
      token(),
      (err, res) => {
        if(!err)
          log('Sent message to space %s', req.body.spaceId);
      })
  };
};

export const getRepo = (appId, token) => (req,res) => {
  // Respond to the Webhook right away, as the response message will
 // be sent asynchronously
 res.status(201).end();
 
 // Only handle message-created Webhook events, and ignore the app's
 // own messages
 if(req.body.type !== 'action-selected' || req.body.userId === appId){
   console.log('error %o', req.body);
   return;
   
 }
 if(res.statusCode !== 201 ) {
   log(res);
   return;
 }
   
 log('Got a message %o', req.body);
 gitConnect();
 
 //send to space
 send(req.body.spaceId,
   util.format(
     'Hey %s, result is: %s',
     req.body.userName, message.issues_url ),
   token(),
   (err, res) => {
     if(!err)
       log('Sent message to space %s', req.body.spaceId);
   })
};

app.get('/r/:repo/:issue',function(request,response) {
	rp({
		uri: 'https://api.zenhub.io/p1/repositories/'+request.params.repo+'/issues/'+request.params.issue,
		
		headers: {
			'X-Authentication-Token': process.env.ZENHUB_TOKEN
		},
	
		json: true
   	})
		.then((data) => {
		  //console.log(data)
		  response.send(data)
		})
		.catch((err) => {
		  console.log(err)
		  response.render('error')
    })
  });

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

          actor: {
            name: 'github issue app'
          }
        }]
      }
    }, (err, res) => {
      if(err || res.statusCode !== 201) {
        log('Error sending message %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    });
};

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
      if(err || res.statusCode !== 201) {
        log('Error sending message %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    });
};

// Verify Watson Work request signature
export const verify = (wsecret) => (req, res, buf, encoding) => {
  if(req.get('X-OUTBOUND-TOKEN') !==
    createHmac('sha256', wsecret).update(buf).digest('hex')) {
    log('Invalid request signature');
    const err = new Error('Invalid request signature');
    err.status = 401;
    throw err;
  }
};

// Handle Watson Work Webhook challenge requests
export const challenge = (wsecret) => (req, res, next) => {
  if(req.body.type === 'verification') {
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
export const webapp = (appId, secret, wsecret, cb) => {
  // Authenticate the app and get an OAuth token
  oauth.run(appId, secret, (err, token) => {
    if(err) {
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
const main = (argv, env, cb) => {
  
  // Create Express Web app
  webapp(
    env.SCRUMBOT_APPID, env.SCRUMBOT_SECRET,
    env.SCRUMBOT_WEBHOOK_SECRET, (err, app) => {
      
      if(err) {
        cb(err);
        log("an error occoured "+err);
        
        return;
      }

      if(env.PORT) {
        log('HTTP server listening on port %d', env.PORT);

//        http.createServer(app).listen(env.PORT, cb);
        
      }

      else
        // Listen on the configured HTTPS port, default to 443
        ssl.conf(env, (err, conf) => {
          if(err) {
            cb(err);
            return;
          }
          const port = env.SSLPORT || 443;
          log('HTTPS server listening on port %d', port);
         // https.createServer(conf, app).listen(port, cb);
        });
    });
};

if (require.main === module){
  main(process.argv, process.env, (err) => {
    
    if(err) {
      console.log('Error starting app:', err);
      return;
    }
    
    log('App started');
  });
  
}

//set listening port
http.createServer(app).listen(process.env.PORT || 9000);
if(process.env.PORT){
  log('HTTP server listening on port %d', process.env.PORT);
}else{
  log('running on port 9000...');  
}
