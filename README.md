# ScrumMaster-bot

[![Build Status]

## The Aim of this Project is to develop a scrumbot to assist SCRUM Teams. 

A watson workspace app that integrates with the Zenhub Api. 
Zenhub Api docs are available at : https://github.com/ZenHubIO/API
It allows team members to quickly gather information and interract with the zenhub scrum board from a conversation within watson workspace

## Getting Started:

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

#### Obtain a Github api token

1. Follow the steps here https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/ to create a new OAuth app to obtain api access.
3. Once approved, you will receive an App key and a client secret which you'll need later.

#### Obtain a Zenhub api token

1. Navigate to your zenhub dashboard at https://dashboard.zenhub.io/#/settings and select 'Generate a new token'.
2. Save the generated token to use later

#### Register the app with watson work services

1. Navigate to [Watson Work Services / Apps](https://developer.watsonwork.ibm.com/apps) in your web browser
2. Click on `Create new app`
3. Give the app a unique name with description and click `Create`
4. Take a note of the `App ID` and `App Secret`
5. Click on  the tab `Listen to Events -> Add an outbound webhook`
6. In the callback URL, specify the URL for the app. This code assumes that the webhook listener is at https://yoururl/scrumbot so remember to add /scrumbot to the end of the URL (_if you don't know where the app will be deployed, use a sample URL for now, like https://test.me.com/scrumbot this can be modified later_)
7. Register for the Events 'message-annotation-added' and 'message-created'.
8. Save the Webhook Secret for later as this will not be displayed again.

**NOTE:** _**Do not commit your app Ids, app secrets, zenhub token, and webhook secret when pushing changes to Github**_

#### Save environment variables with these exact names(case sensitive and parts within curly braces are to be replaced with your own data, without curly braces "{}")
```
GIT_CLIENT_ID={Your client id from github}
GIT_CLIENT_SECRET={Your client secret from github}
SCRUMBOT_WEBHOOK_SECRET={webhook secret generated by watson work services}
ZENHUB_TOKEN={token generated from zenhub}
PORT=27477
DEBUG=watsonwork.*
SCRUMBOT_APPID={your app id from watson work services}
SCRUMBOT_SECRET={ypur app secret from watson work services}
```
#### Build the App
Run the following command to build the app, run tests and start app

```
npm run build
npm start
```
