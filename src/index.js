const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;
const Rx = require('rx');
const { URL } = require('url');

const fs = require('fs');

const { httpPromise, retrieveHrefs } = require('./utils');
const { checkDOM, rebuildAbilities } = require('./dom_parsing');
const { series_code } = require('./config');
const { processRelationsSimple, storeIt } = require('./couchdb_processing');
const { parseIt } = require('./translation_parsing');


function parseVividStrike() {
    let store = storeIt('localhost','5984','vivid_strike_ws');
    return parseIt('/home/jmhirata/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/Downloads/Heart of the Cards - Weiβ Schwarz ViVid Strike! Booster Pack Translation.html')
	.selectMany(data => {
	    return store(data);
	});
	    
}

function parseNanohaMovie() {
    let store = storeIt('localhost','5984','nanoha_movie_ws');
    return parseIt("/home/jmhirata/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/Downloads/Heart of the Cards - Weiβ Schwarz Nanoha the Movie 1st & 2nd A's Booster Pack Translation.html")
	.selectMany(data => {
	    return store(data);
	});

}

function scrapeIt() {
    console.log("running it");
    return Rx.Observable
	.range(1,16)
	.selectMany(index => {
	    return Rx.Observable.fromPromise(httpPromise("http://www.heartofthecards.com/code/wscardsearch.html?neostandard=vividstrike&cardlimit=10&cardpage=" + index + "&cardpower1=any&cardpower2=any&cardlevel1=any&cardlevel2=any&cardsoul1=any&cardsoul2=any&cardcost1=any&cardcost2=any&cardcolor=any&cardtype=any"))
	})
	.map(data => {

	    return new JSDOM(data);
	})
    
	.selectMany(dom => {
	    return Rx.Observable.fromArray(retrieveHrefs(dom));
	})
    
	.pluck('href')
	.filter(href => /cardlist/.test(href))
	.delay(1000)
	.selectMany(href => {
	    console.log("fetching " + href);
	    return Rx.Observable.fromPromise(httpPromise(href));
	})
	.map(data => {

	    return new JSDOM(data)
	})
	.map(checkDOM);
    
}


exports.scrapeIt = scrapeIt;
exports.parseIt = parseIt;
exports.parseSets = parseSets;


function parseSets() {
/*    parseVividStrike().subscribe(
	_=> {
	},
	err => {
	    console.log(err);
	});
    parseNanohaMovie().subscribe(
	_ => {
	},
	err => {
	    console.log(err)
	});*/
    processRelationsSimple("vivid_strike_ws")
	.subscribe(
	    data=> {
//		console.log(data);
	    },
	    err => {
		console.log(err);
	    });
    processRelationsSimple("nanoha_movie_ws")
	.subscribe(
	    data=> {
//		console.log(data);
	    },
	    err => {
		console.log(err);
	    });
    
}



//binparseSets();
