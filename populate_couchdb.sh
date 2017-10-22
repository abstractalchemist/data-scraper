#!/bin/bash

HOST=localhost
PORT=5984

curl -X DELETE http://$HOST:$PORT/cardsets
curl -X PUT http://$HOST:$PORT/cardsets
curl -X PUT http://$HOST:$PORT/cardsets/sets -d '{"sets":[{"id":"vivid_strike_ws","label":"Vivid Strike"}, {"id":"nanoha_movie_ws","label":"Nanoha Movie"}, {"id":"love_live_v1","label":"Love Live v1"}, {"id":"nanoha_movie_1_ws","label":"Nanoha Movie 1st"}, {"id":"nanoha_movie_2_ws","label":"Nanoha Movie 2nd"}, {"id":"love_live_v1_en","label":"Love Live V1 (EN)"}, {"id":"love_live_v2_en","label":"Love Live V2 (EN)"},{"id":"love_live_dx_v1","label":"Love Live DX V1"},{"id":"love_live_dx_v2","label":"Love Live DX V2"}]}'

curl -X DELETE http://$HOST:$PORT/cardmapping
curl -X PUT http://$HOST:$PORT/cardmapping
curl -X PUT http://$HOST:$PORT/cardmapping/mapping -d '{"mapping":[ {"prefix":"vs_w50","db":"vivid_strike_ws"}, {"prefix":"n1_w32","db":"nanoha_movie_ws"}, {"prefix":"n2_w32","db":"nanoha_movie_ws"}, {"prefix":"ll_w24","db":"love_live_v1"}, {"prefix":"n2_w25","db":"nanoha_movie_2_ws"}, {"prefix":"n1_we06","db":"love_love_v1"}, {"prefix":"ll_w24","db":"love_live_v1_en"},  {"prefix":"ll_w34","db":"love_live_v2_en"}, {"prefix":"ll_en_w01","db":"love_live_dx_v1"},{"prefix":"ll_en_w02","db":"love_live_dx_v2"}]}'



recreate() {
#    curl -X DELETE http://$HOST:$PORT/$1
#    curl -X PUT http://$HOST:$PORT/$1
    node entry.js $1 $HOST
}

recreate decks
recreate vivid_strike_ws
recreate nanoha_movie_ws
recreate love_live_v1
recreate nanoha_movie_1_ws
recreate nanoha_movie_2_ws
recreate love_live_v1_en
recreate love_live_v2_en
recreate love_live_dx_v1
recreate love_live_dx_v2
