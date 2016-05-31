#!/bin/sh

if [ "$1" == '-h' ] || [ $# != 1 ] ; then
  echo "Usage: $(basename "$0") <PAGE_ACCESS_TOKEN>"
  exit 1;
fi

curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=$1"
