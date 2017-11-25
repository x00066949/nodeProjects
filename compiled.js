//import * as request from 'request';
const jsonwebtoken = require('jsonwebtoken');
const babel = require('babel');

//import * as jsonwebtoken from 'jsonwebtoken';
const request = require('request');
let credentials = require('./keys.json');

// API to authorize application and generate access token.
const WWS_OAUTH_URL = "https://api.watsonwork.ibm.com/oauth/token";

// App ID retrieved from registration process.
const APP_ID = credentials.WATSON_APP_ID;

// App secret retrieved from registration process.
const APP_SECRET = credentials.WATSON_APP_SECRET;

// Build request options for authentication.
// Obtain an OAuth token for the app, repeat at regular intervals before the
// token expires. Returns a function that will always return a current
// valid token.
export const run = (APP_ID, APP_SECRET, cb) => {
  let tok;

  // Return the current token
  const current = () => tok;

  // Return the time to live of a token
  const ttl = tok => Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());

  // Refresh the token
  const refresh = cb => {
    log('Getting token');
    request.post(WWS_OAUTH_URL, {
      auth: {
        user: appId,
        pass: secret
      },
      json: true,
      form: {
        grant_type: 'client_credentials'
      }
    }, (err, res) => {
      if (err || res.statusCode !== 200) {
        log('Error getting token %o', err || res.statusCode);
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

if (!APP_ID || !APP_SECRET) {
  console.log("Please provide the app id and app secret as environment variables.");
  process.exit(1);
}

// Authorize application.
request(run, function (err, response, body) {

  // If successful authentication, a 200 response code is returned
  if (response.statusCode == 200) {
    console.log("Authentication successful\n");
    console.log("App Id: " + authenticationOptions.auth.user);
    console.log("App Secret: " + authenticationOptions.auth.pass + "\n");
    console.log("access_token:\n\n" + JSON.parse(body).access_token + "\n");
    console.log("token_type: " + JSON.parse(body).token_type);
    console.log("expires_in: " + JSON.parse(body).expires_in);
    console.log("\n");
  } else {
    console.log("Error authenticating with\nApp: " + authenticationOptions.auth.user + "\nSecret: " + authenticationOptions.auth.pass + "\n\n");
  }
});
