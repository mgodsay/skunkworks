#!/bin/sh

if [ "$1" == '-h' ] || [ $# != 2 ] ; then
  echo "Usage: $(basename "$0") <PAGE_ID> <PAGE_ACCESS_TOKEN>"
  exit 1;
fi

curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"call_to_actions",
  "thread_state":"new_thread",
  "call_to_actions":[
    {
      "message":{
        "text":"Hello There! I'\''m Bot, your personal eBay assistant. You can always reach me here!"
      }
    }
  ]
}' "https://graph.facebook.com/v2.6/$1/thread_settings?access_token=$2"
