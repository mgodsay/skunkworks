// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
//'use strict';

const WIT_TOKEN = "JEJXL2EQG7OSFRQXOIGOCHILLZA2ETWT",
	  FB_PAGE_ID = "104742293288778",
	  FB_PAGE_TOKEN = "EAAZAzKgUfDPMBAJEggJwQ4KVevd1wtnKE6wZCWVwYblgzcs1a2W1eQyGkcuCiVZAe0ZAYTctYJ25mjGmLC9cZBR4XhOUZAIMvxTV54ITLG3bZCXtonqOZCFLVKc06gre6duQAu1nDeZCTTIzUADLgleZB6ZCOzc71GAeAxZAcJqyzRRA5wZDZD";
 	  FB_VERIFY_TOKEN = "mobileFeatureQE",
 	  dbEndPoint = "http://localhost:3000";

var	startChattingFlag = false,
    genderFlag = false,
    ageFlag = false,
	express = require('express'),
    request = require("request"),
    app = express(),
    port = 8080,
    https = require('https'),
    http = require('http'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
	Wit = require('node-wit').Wit;
    
var search_keyword_entered = null;

// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
var sessions = {};

var findOrCreateSession = (fbid) => {
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

var firstEntityValue = (entities, entity) => {
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
      console.log(recipientId);
      callFacebookAPI(recipientId,message);
      cb();
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
	  search_keyword_entered = context.keyword;
	  getProducts(sender, search_keyword_entered);
	  context = null;
	  cb(context); 
	  },
};

const wit = new Wit(WIT_TOKEN, actions);
console.log("startChattingFlag is :",startChattingFlag);
console.log("genderFlag is :",genderFlag);
console.log("ageFlag is :",ageFlag);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', function(req, res) {
  res.status(200).send('Hello, world!');
});


app.get('/webhook/', function (req, res) {
  // console.log("In the get");
  if (req.query['hub.verify_token'] === 'mobileFeatureQE') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, invalid validation token');
})


app.post('/webhook/', function (req, res) {
  console.log("I am in the webhook " + JSON.stringify(req.body));
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    const sessionId = findOrCreateSession(sender);
    if (event.message && event.message.text) {
      text = event.message.text;
      console.log("text--->" + text);
      if (text) {
          wit.runActions(
        	        sessionId, // the user's current session
        	        text, // the user's message
        	        sessions[sessionId].context, // the user's current
													// session state
        	        (error, context) => {
        	          if (error) {
        	        	  console.log(context);
        	            console.log('Oops! Got an error from Wit:', error);
        	          } else {
        	            // Our bot did everything it has to do.
        	            // Now it's waiting for further messages to proceed.
        	            console.log('Waiting for futher messages.');

        	            // Based on the session state, you might want to reset
						// the session.
        	            // This depends heavily on the business logic of your
						// bot.
        	            // Example:
        	            // if (context['done']) {
        	            // delete sessions[sessionId];
        	            // }

        	            // Updating the user's current session state
        	            sessions[sessionId].context = context;
        	          }
        	        }
        	      );
      // getProducts(sender, 'iPhone');
        continue;
      }
// else{
// // Handle a text message from this sender
// callFacebookAPI(sender, "Text received, echo: "+ text.substring(0, 200));
// }
    }
    if (event.postback) {
      text = JSON.stringify(event.postback);
      respondToPostbacks(sender, event.postback);
      continue;
    }
  }
  res.sendStatus(200);
});


// Respond to Postbacks
function respondToPostbacks(sender,text){
  console.log(text.payload);
  var cases = text.payload.split(":");
  if((cases[0] === "SkipOnboarding")){
	  console.log("Inside SkipOnboarding");
	  showInterests();
  }
  if((cases[0] === "Onboarding")){
	  onBoarding(text);
  }
	  
  if((startChattingFlag === false)&&(cases[0] === "startChatting") || ((genderFlag === false)&&(startChattingFlag === true)&&(cases[0] === "Male"||cases[0] === "Female" || cases[0] === "SkipGender"))|| ((ageFlag===false)&&(startChattingFlag===true)&&(genderFlag===true)&&(cases[0] === "Teens"||cases[0] === "Adult" || cases[0] === "SkipAge"))){
	      
	  onBoarding(text);
  }else{
    var action = text.payload.split(":"),
        callback = action[0] + "(" + sender + ",'" + action[1] + "')";
    eval(callback);
  }
}


function onBoarding(text){
  var cases = text.payload.split(":");
   if((startChattingFlag === false)&&(cases[0] === "startChatting")){
    startChattingFlag = true;
    console.log("startChattingFlag in startChatting flow :",startChattingFlag);
        var elements = [];
        var tempData = {};
        tempData.title = "Great! Choose any of these options";
        tempData.buttons = [{"type": "postback", "payload" : "Onboarding" , "title":"Onboarding"},
                            {"type": "postback", "payload" : "SkipOnboarding" , "title":"Skip Onboarding"}];
      elements.push(tempData);
      callFacebookAPI(sender,elements);
    }
   if((cases[0] === "Onboarding"))
	     {
	         console.log("Onboarding");
	          var elements = [];
	          var tempData = {};
	          tempData.title = "Great! Let us get to know you better";
	          tempData.buttons = [{"type": "postback", "payload" : "Female" , "title":"Female"},
	                            {"type": "postback", "payload" : "Male" , "title":"Male"},
	                            {"type": "postback", "payload" : "SkipGender" , "title":"Skip"}];
	          elements.push(tempData);
	          callFacebookAPI(sender,elements);
  }
  if ((genderFlag === false)&&(startChattingFlag === true)&&(cases[0] === "Male"||cases[0] === "Female" || cases[0] === "SkipGender")){
    genderFlag = true;
    console.log("startChattingFlag in Gender flow :",startChattingFlag);
    console.log("genderFlag in Gender flow :",genderFlag);
   
      var elements = [];
      var tempData = {};
      tempData.title = "Great! Let's get to know your age";
      tempData.buttons = [{"type": "postback", "payload" : "Teens", "title": "15-35"},
                            {"type": "postback", "payload" : "Adult", "title": "35+"},
                           
                            {"type": "postback", "payload" : "SkipAge", "title": "Skip"}];
      elements.push(tempData);
      callFacebookAPI(sender,elements);
     
       }
      if ((ageFlag===false)&&(startChattingFlag===true)&&(genderFlag===true)&&(cases[0] === "Teens"||cases[0] === "Adult" || cases[0] === "Old" || cases[0] === "SkipAge")){
       showInterests();
      }
  }
    
function showInterests(){ 
    ageFlag = true;
     console.log("startChattingFlag in Gender flow :",startChattingFlag);
    console.log("genderFlag in Gender flow :",genderFlag);

        var elements = [];
        var tempData = {};
        tempData.title = "Great, You are almost there, tell us about your interests";
        tempData.subtitle = "like electronics, video games....";
        
        elements.push(tempData);
        callFacebookAPI(sender,elements);
}

// SRP
var getProducts = function(sender, keyword){
  restClient().get(dbEndPoint + "/products?q="+keyword, function (data, response) {
    showSearchResults(sender, data.body, keyword);
  });
}

var showSearchResults = function(sender, responseData, keyword) {
  var elements = [];
  responseData.forEach(function(object){
    var tempData = {};
    tempData.title = object.title;
    tempData.subtitle = object.subtitle;
    tempData.image_url = object.image_url;
    tempData.buttons = [{"type": "postback", "payload" : "getItemDetails:" + object.id, "title":"View Details"},
                        {"type": "postback", "payload" : "buyItem: " + object.id, "title":"Buy It Now"}];
    elements.push(tempData);
  });

  callFacebookAPI(sender, elements);
};

// View item
var getItemDetails = function(sender, itemId){
  restClient().get(dbEndPoint + "/products/"+itemId, function (data, response) {
    showItemDetails(sender, data.body);
  });
}

var showItemDetails = function(sender, object) {
  var elements = [],
      tempData = {};
  tempData.title = object.title;
  tempData.subtitle = object.subtitle;
  tempData.image_url = object.image_url;
  tempData.buttons = [{"type": "postback", "payload" : "loadImages:" + object.id , "title":"More Images"},
                      {"type": "postback", "payload" : "buyItem:" + object.id, "title":"Buy It Now"},
                      {"type": "postback", "payload" : "getProducts:"+ search_keyword_entered, "title":"< Back to search results"}];
  elements.push(tempData);
  callFacebookAPI(sender, elements);
};


// More Images
var loadImages = function(sender, itemId){
  restClient().get(dbEndPoint + "/images/"+itemId, function (data, response) {
    showMoreImages(sender, data.body);
  });
}

var showMoreImages = function(sender, responseData) {
  var elements = [];
  responseData.urls.forEach(function(object){
    var tempData = {};
    tempData.title = responseData.title;
    tempData.image_url = object;
    tempData.buttons = [{"type": "postback", "payload" : "buyItem:" + responseData.id, "title":"Buy It Now"},
                      {"type": "postback", "payload" : "getItemDetails:" + responseData.id, "title":"< Back to view item"}];
    elements.push(tempData);
  });

  callFacebookAPI(sender, elements);
 };

// buyItem
var buyItem = function(sender, itemId){
  callFacebookAPI(sender, "Thank you! Your order has been placed successfully. Your item will be delivered on or before 27th June 2016.");
};

function callFacebookAPI(sender, elements){
  var messageData = (typeof elements == 'string') ? {text:elements} : {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": elements
      }
    }
  };

  // console.log("messageData ---> " + messageData);
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
    }
  );

}

// Start the server
var server = app.listen(process.env.PORT || '8080', '0.0.0.0', function() {
  console.log('App listening at http://%s:%s', server.address().address,
    server.address().port);
  console.log('Press Ctrl+C to quit.');
});

var restClient = function(){
  return(new (require('node-rest-client').Client)());
}

// [END app]

