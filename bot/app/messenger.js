'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup
// (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express,
// request.
//
// 1. npm install body-parser express request
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 8445
// 4. WIT_TOKEN=your_access_token FB_PAGE_ID=your_page_id
// FB_PAGE_TOKEN=your_page_token FB_VERIFY_TOKEN=verify_token node
// examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and
// `https://<your_ngrok_io>/fb` as callback URL.
// 6. Talk to your bot on Messenger!

var express = require('express');
var request = require("request")
var app = express();
var port = 8080;
var https = require('https');
var http = require('http');
var fs = require('fs');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


// When not cloning the `node-wit` repo, replace the `require` like so:
const Wit = require('node-wit').Wit;
// const Wit = require('../').Wit;

// Webserver parameter
const PORT = 8445;

// Wit.ai parameters
// const WIT_TOKEN = process.env.WIT_TOKEN;
const WIT_TOKEN = "JEJXL2EQG7OSFRQXOIGOCHILLZA2ETWT";

// Messenger API parameters
// const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ID = "104742293288778";
if (!FB_PAGE_ID) {
  throw new Error('missing FB_PAGE_ID');
}
// const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FB_PAGE_TOKEN = "EAAZAzKgUfDPMBADrcKsjeRlzJDwCgxbOqZBNnXxUsZBb6EVydwFtHrUtZCCkP6hizZBXgZCqwA0Lvx7sWtXRI5q0wDMS0warHYopAnsVWRh2FZCXyU0ZBMrLkOZAsLLukpnZCzDiQJZA2aTEyG3r0oPQJJ6cZBNBu5qeanAPi4GyXbUbxQZDZD";
if (!FB_PAGE_TOKEN) {
  throw new Error('missing FB_PAGE_TOKEN');
}
// const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_VERIFY_TOKEN = "mobileFeatureQE";

// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: { access_token: FB_PAGE_TOKEN },
  headers: {'Content-Type': 'application/json'},
});

const fbMessage = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
        text: msg,
      },
    },
  };
  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};

// See the Webhook reference
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
const getFirstMessagingEntry = (body) => {
  const val = body.object == 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].id === FB_PAGE_ID &&
    body.entry[0].messaging &&
    Array.isArray(body.entry[0].messaging) &&
    body.entry[0].messaging.length > 0 &&
    body.entry[0].messaging[0]
  ;
  return val || null;
};

// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

const firstEntityValue = (entities, entity) => {
	  const val = entities && entities[entity] &&
	    Array.isArray(entities[entity]) &&
	    entities[entity].length > 0 &&
	    entities[entity][0].value
	  ;
	  if (!val) {
	    return null;
	  }
	  return typeof val === 'object' ? val.value : val;
	};
	
// Our bot actions
const actions = {
  say(sessionId, context, message, cb) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      fbMessage(recipientId, message, (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        // Let's give the wheel back to our bot
        cb();
      });
    } else {
      console.log('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      cb();
    }
  },
  merge(sessionId, context, entities, message, cb) {
	   // Retrieve the location entity and store it into a context field
	   var keyword = firstEntityValue(entities, 'search_keyword');
	   console.log(keyword);
	   if (keyword) {
		   console.log("Keyword is : " + keyword);
	     context.keyword = keyword;
	    // keyword = null;
	   }
	   keyword = null;
	   console.log("After setting keyword to null" + keyword);
	   cb(context);
	  
	 },
  error(sessionId, context, error) {
    console.log(error.message);
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  ['searchFor'](sessionId, context, cb) {
	  var recipientId = sessions[sessionId].fbid;
	  console.log(recipientId);
	  console.log(context);
	    // Here should go the api call, e.g.:
	    // context.forecast = apiCall(context.loc)
	    sendGenericMessage(recipientId);
	  //  context.forecast = 'sunny';
	    context = null;
	    cb(context);
	   
	  },
};

// Setting up our bot
const wit = new Wit(WIT_TOKEN, actions);

// Starting our webserver and putting it all together
// Start the server
var server = app.listen(process.env.PORT || '8080', '0.0.0.0', function() {
  console.log('App listening at http://%s:%s', server.address().address,
    server.address().port);
  console.log('Press Ctrl+C to quit.');
});


app.get('/fb', function (req, res) {
	  console.log("In the get");
	  if (req.query['hub.verify_token'] === 'mobileFeatureQE') {
	    res.send(req.query['hub.challenge']);
	  }
	  res.send('Error, wrong validation token');
	})

// Message handler
app.post('/fb', (req, res) => {
	console.log("In the post");
  // Parsing the Messenger API response
  const messaging = getFirstMessagingEntry(req.body);
  if (messaging && messaging.message && messaging.recipient.id === FB_PAGE_ID) {
    // Yay! We got a new message!
	  console.log("We got a message");

    // We retrieve the Facebook user ID of the sender
    const sender = messaging.sender.id;

    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    const sessionId = findOrCreateSession(sender);

    // We retrieve the message content
    const msg = messaging.message.text;
    const atts = messaging.message.attachments;

    if (atts) {
      // We received an attachment

      // Let's reply with an automatic message
      fbMessage(
        sender,
        'Sorry I can only process text messages for now.'
      );
    } else if (msg) {
      // We received a text message

      // Let's forward the message to the Wit.ai Bot Engine
      // This will run all actions until our bot has nothing left to do
      wit.runActions(
        sessionId, // the user's current session
        msg, // the user's message
        sessions[sessionId].context, // the user's current session state
        (error, context) => {
          if (error) {
        	  console.log(context);
            console.log('Oops! Got an error from Wit:', error);
          } else {
            // Our bot did everything it has to do.
            // Now it's waiting for further messages to proceed.
            console.log('Waiting for futher messages.');

            // Based on the session state, you might want to reset the session.
            // This depends heavily on the business logic of your bot.
            // Example:
            // if (context['done']) {
            // delete sessions[sessionId];
            // }

            // Updating the user's current session state
            sessions[sessionId].context = context;
          }
        }
      );
    }
  }
  res.sendStatus(200);
});

function sendGenericMessage(sender) {
	var  messageData = {
	    "attachment": {
	      "type": "template",
	      "payload": {
	        "template_type": "generic",
	        "elements": [{
	          "title": "Apple iPhone 6 Plus a1522 16GB for AT&T Gold Silver or Gray",
	          "subtitle": "Daily Deals",
	          "image_url": "http://i.ebayimg.com/00/s/MTAwMFgxMDAw/z/5tMAAOSw9mFWGNgN/$_35.JPG",
	          "buttons": [{
	            "type": "postback",
	            "payload":  "Details: 252062798827 ",
	            "title": "View Details"
	          }, {
	            "type": "postback",
	            "title": "Buy It Now",
	            "payload": "BIN: 252062798827"
	          }]
	        },{
	          "title": "LG Nexus 5X H790 32GB (Factory GSM Unlocked) 4G LTE Android Smartphone- US Model",
	          "subtitle": "Daily Deals",
	          "image_url": "http://i.ebayimg.com/00/s/NTAwWDUwMA==/z/ToMAAOSw3YNXYzV6/$_35.JPG",
	          "buttons": [{
	            "type": "postback",
	            "title": "View Details",
	            "payload":  "Details: 151876435362 ",
	          }, {
	            "type": "postback",
	            "title": "Buy It Now",
	            "payload": "BIN: 151876435362"
	          }]
	        }]
	      }
	    }
	  };
	  request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:FB_PAGE_TOKEN},
	    method: 'POST',
	    json: {
	      recipient: {id:sender},
	      message: messageData,
	    }
	  }, function(error, response, body) {
	    if (error) {
	      console.log('Error sending message: ', error);
	    } else if (response.body.error) {
	      console.log('Error: ', response.body.error);
	    }
	  });
	}

