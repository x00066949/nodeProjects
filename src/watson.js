import * as request from 'request';
import * as jsonwebtoken from 'jsonwebtoken';
import debug from 'debug';
//var express = require('express');
//var app = express();
//var bodyParser = require('body-parser');
//var jsonwebtoken = require('jsonwebtoken');
//var debug = requre('debug');
//const request = require('request');
//let credentials = require('./keys.json');

// Setup debug log
const log = debug('watsonwork-scrumbot');

export const run = (appId, secret, cb) => {
/*
  if (!appId || !secret) {
    log("Please provide the app id and app secret as environment variables.");
    process.exit(1);
  }*/

  let tok;
  
    // Return the current token
    const current = () => tok;
  
    // Return the time to live of a token
    const ttl = (tok) =>
      Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());
  
    // Refresh the token
    const refresh = (cb) => {
      log('Getting token');
      console.log('Getting token');
      
      request.post('https://api.watsonwork.ibm.com/oauth/token', {
        auth: {
          user: appId,
          pass: secret
        },
        json: true,
        form: {
          grant_type: 'client_credentials'
        }
      }, (err, res) => {
        if(err || res.statusCode !== 200) {
          log('Error getting token %o', err || res.statusCode);
          console.log('Error getting token %o', err || res.statusCode);
          
          cb(err || new Error(res.statusCode));
          return;
        }
  
        // Save the fresh token
        log('Got new token');
        tok = res.body.access_token;
  
        // Schedule next refresh a bit before the token expires
        const t = ttl(tok);
        log('Token ttl', t);
        setTimeout(refresh, Math.max(0, t - 60000)).unref();
  
        // Return a function that'll return the current token
        cb(undefined, current);
      });
    };
  
    // Obtain initial token
    setImmediate(() => refresh(cb));
  
};




