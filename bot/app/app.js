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

var dbEndPoint = "http://localhost:3000",
    token = "EAABs0h5eyPABAHqwxF03wYggEcUOpHs2XnKNEuZCU0gt6SX2QoBCjPBcwZA12ar47bcrZADYodD8h3wdSiQ0lTVFEhg3vZCC8CgukDbEyqTIAMH6htyq6NS8BELaIXSVid1lLCvOAk4OmZAb1Y7M0D3kzm9I3UemjIbvzNr8hbwZDZD";
    //token = "CAAT6h9nizVIBAJ5o0GqEH52Wlwf8Anc8JJAzqmzJgH0ZAZAPZBTvCleKbGcrTR4fOlNRK12JiHHld2GjgT8seSkeXKveadeMEqHS6KcKYSfghHo2ux5h0doqc9WZA3WoeCgZA5QJCJWUZA8UIeh0nUpPKEOeyRXmndVm5MnmD8SqlI9YUwFlDjuEtK84fOFGSL76xI6MuhrAZDZD";

var startChattingFlag = false,
  genderFlag = false,
  ageFlag = false;

var express = require('express'),
    request = require("request"),
    app = express(),
    port = 8080,
    https = require('https'),
    http = require('http'),
    fs = require('fs'),
    bodyParser = require('body-parser');

console.log("startChattingFlag is :",startChattingFlag);
console.log("genderFlag is :",genderFlag);
console.log("ageFlag is :",ageFlag);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', function(req, res) {
  res.status(200).send('Hello, world!');
});


app.get('/webhook/', function (req, res) {
  //console.log("In the get");
  if (req.query['hub.verify_token'] === 'mobileFeatureQE') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, invalid validation token');
})


app.post('/webhook/', function (req, res) {
  //console.log("I am in the webhook " + req.body);
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      console.log("text--->" + text);
      if (text === 'Deals') {
        console.log('Inside deals');
        getProducts(sender, 'iPhone');
        continue;
      }else{
        // Handle a text message from this sender
        callFacebookAPI(sender, "Text received, echo: "+ text.substring(0, 200));
      }
    }
    if (event.postback) {
      text = JSON.stringify(event.postback);
      respondToPostbacks(sender, event.postback);
      continue;
    }
  }
  res.sendStatus(200);
});

//Respond to Postbacks
function respondToPostbacks(sender,text){
  console.log(text.payload);
  var cases = text.payload.split(":");
  if((startChattingFlag === false)&&(cases[0] === "startChatting")){
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
    messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Great! Let us get to know you better",
          "buttons": [{
            "type": "postback",
            "payload":"Female",
            "title": "Female"
          }, {
            "type": "postback",
            "title": "Male",
            "payload": "Male"
          },
          {
            "type": "postback",
            "title": "Skip",
            "payload": "Skip"
          }
          ]
        }]
      }
    }
  };

  console.log("Before Sending Request");
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  },
  
   function(error, response, body) {
    
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
  

  }
  if ((genderFlag === false)&&(startChattingFlag === true)&&(cases[0] === "Male"||cases[0] === "Female" || cases[0] === "Skip")){
    genderFlag = true;
    console.log("startChattingFlag in Gender flow :",startChattingFlag);
    console.log("genderFlag in Gender flow :",genderFlag);
    messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Great! Let's get to know your age",
          "buttons": [{
            "type": "postback",
            "payload":"Teens",
            "title": "15-25"
          }, {
            "type": "postback",
            "title": "25-40",
            "payload": "Adult"
          },
          {
            "type": "postback",
            "title": "40+",
            "payload": "Old"
          }
          ]
        }]
      }
    }
  };

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
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
  
  if ((ageFlag===false)&&(startChattingFlag===true)&&(genderFlag===true)&&(cases[0] === "Teens"||cases[0] === "Adult" || cases[0] === "Old")){
    ageFlag = true;
     console.log("startChattingFlag in Gender flow :",startChattingFlag);
    console.log("genderFlag in Gender flow :",genderFlag);

    messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Great, You are almost there, tell us about your interests",
          "subtitle":"like electronics, video games...."
        }]
      }
    }
  };

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
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
}

//SRP
var getProducts = function(sender, keyword){
  restClient().get(dbEndPoint + "/products?q="+keyword, function (data, response) {
    showSearchResults(sender, data.body);
  });
}

var showSearchResults = function(sender, responseData) {
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

//View item
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
                      {"type": "postback", "payload" : "getProducts:iPhone", "title":"< Back to search results"}];
  elements.push(tempData);
  callFacebookAPI(sender, elements);
};


//More Images
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

//buyItem
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

  //console.log("messageData ---> " + messageData);
  request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
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

