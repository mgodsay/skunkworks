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

app.get('/', function(req, res) {
  res.status(200).send('Hello, world!');
});

app.get('/webhook/', function (req, res) {
  console.log("In the get");
  if (req.query['hub.verify_token'] === 'mobileFeatureQE') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
})


app.post('/webhook/', function (req, res) {
  console.log("I am in the webhook");
  console.log(req.body);
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
   event = req.body.entry[0].messaging[i];
   sender = event.sender.id;
   if (event.message && event.message.text) {
    text = event.message.text;
    if (text === 'Deals') {
      sendGenericMessage(sender);
      continue;
    }else{
      // Handle a text message from this sender
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
    }
  }
  if (event.postback) {
    text = JSON.stringify(event.postback);
   // sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token);
   respondToPostbacks(sender, event.postback);
    continue;
  }
}
res.sendStatus(200);
});

//var token = "CAAT6h9nizVIBAJ5o0GqEH52Wlwf8Anc8JJAzqmzJgH0ZAZAPZBTvCleKbGcrTR4fOlNRK12JiHHld2GjgT8seSkeXKveadeMEqHS6KcKYSfghHo2ux5h0doqc9WZA3WoeCgZA5QJCJWUZA8UIeh0nUpPKEOeyRXmndVm5MnmD8SqlI9YUwFlDjuEtK84fOFGSL76xI6MuhrAZDZD";
var token = "EAAZAzKgUfDPMBADrcKsjeRlzJDwCgxbOqZBNnXxUsZBb6EVydwFtHrUtZCCkP6hizZBXgZCqwA0Lvx7sWtXRI5q0wDMS0warHYopAnsVWRh2FZCXyU0ZBMrLkOZAsLLukpnZCzDiQJZA2aTEyG3r0oPQJJ6cZBNBu5qeanAPi4GyXbUbxQZDZD";
function sendTextMessage(sender, text) {
  console.log("In the sendTextMessage call");
  messageData = {
    text:text
  }
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

//Respond to Postbacks
function respondToPostbacks(sender,text){
  console.log("Responding to postback");
  console.log(text);
  // postback = JSON.parse(text);
  cases = text.payload.split(":");
  console.log(cases[0]);
  if(cases[0] === "Details"){
      messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Apple iPhone 6 Plus a1522 16GB for AT&T Gold Silver or Gray",
          "subtitle": "Daily Deals",
          "image_url": "http://i.ebayimg.com/00/s/MTAwMFgxMDAw/z/5tMAAOSw9mFWGNgN/$_1.JPG?set_id=880000500F",
          "buttons": [{
            "type": "postback",
            "payload":  "Images: 252062798827 ",
            "title": "More Images"
          }, {
            "type": "postback",
            "title": "Buy It Now",
            "payload": "BIN: 252062798827"
          },
          {
            "type": "postback",
            "title": "Deals",
            "payload": "Deals"
          }
          ]
        },{
          "title": "Item Details",
          "subtitle": "Seller Refurbished, Apple 16GB iPhone 6 Plus",
          "image_url": "http://i.ebayimg.com/00/s/MTAwMFgxMDAw/z/EygAAOSw14xWGNgN/$_1.JPG?set_id=880000500F",
          "buttons": [{
            "type": "postback",
            "payload":  "Deals",
            "title": "Deals"
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
  else if(cases[0] === "BIN"){

  }

}

//To send Structured Data

function sendGenericMessage(sender) {
  messageData = {
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
// Start the server
var server = app.listen(process.env.PORT || '8080', '0.0.0.0', function() {
  console.log('App listening at http://%s:%s', server.address().address,
    server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
