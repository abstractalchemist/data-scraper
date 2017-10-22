const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;
const Rx = require('rx');
const { URL } = require('url');

const { argv } = require('process');

const fs = require('fs');

const { httpPromise, retrieveHrefs } = require('./utils');
const { checkDOM, rebuildAbilities } = require('./dom_parsing');
//const { series_code } = require('./config');
const { processRelationsSimple, storeIt } = require('./couchdb_processing');
const { parseIt } = require('./translation_parsing');
//const { argMapping } = require('./series_info');
const { cfg } = require('./config');

const { cardset } = require('./eng_scraper');
// function parseVividStrike() {
//     let store = storeIt('localhost','5984','vivid_strike_ws');
//     return parseIt('/home/jmhirata/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/Downloads/Heart of the Cards - Weiβ Schwarz ViVid Strike! Booster Pack Translation.html')
// 	.selectMany(data => {
// 	    return store(data);
// 	});
	    
// }

// function parseNanohaMovie() {
//     let store = storeIt('localhost','5984','nanoha_movie_ws');
//     return parseIt("/home/jmhirata/.local/share/torbrowser/tbb/x86_64/tor-browser_en-US/Browser/Downloads/Heart of the Cards - Weiβ Schwarz Nanoha the Movie 1st & 2nd A's Booster Pack Translation.html")
// 	.selectMany(data => {
// 	    return store(data);
// 	});

// }

function scrapeIt() {
//    console.log("running it");
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

let inputs = fs.readFileSync(process.argv[2])
inputs = JSON.parse(inputs)
// if(process.argv.length > 2) {
//     inputs = process.argv.slice(2);
// }
// else {
//     inputs = argMapping.map( ({arg}) => arg );
// }
inputs.forEach(o => {
    //	console.log("looking at " + i);
//    let o = argMapping.find(({arg}) => i === arg)
    let storage = storeIt(cfg.db_host, cfg.db_port, o.id);
    if(o) {
	
	if(o.info.url) {
	    console.log(`processing ${o.info.url}`);
	    
	    parseIt(o.info.url)
		.selectMany(storage)
		.subscribe(
		    _ => {
		    },
		    err => {
			console.log(`card processing ${err}`);
			processRelationsSimple(o.id).subscribe(
			    _ => {},
			    error => console.log(`relation processing ${error}`),
			    _ => console.log("relation processing completed")
			);
			
		    },
		    _ => {
			console.log("completed; processing relations");
			processRelationsSimple(o.id).subscribe(
			    _ => {},
			    error => console.log(`relation processing ${error}`),
			    _ => console.log("relation processing completed")
			);
		    }
		)
	}
	else if(o.info.id) {
	    console.log(`processing id ${o.id}`);
	    cardset(o.info.id).
		selectMany(storage).
		subscribe(
		    data => {
		    },
		    err => {
			console.log(`card processing error: ${err}`);
		    },
		    _ => {
			console.log("completed processing eng");
			processRelationsSimple(o.id).subscribe(
			    _ => {},
			    error => console.log(`relation processing ${error}`),
			    _ => console.log("relation processing completed")
			);
		    })
	    
	}
    }

})


//exports.parseSets = parseSets;



//function parseSets() {
//     parseVividStrike().subscribe(
// 	_=> {
// 	},
// 	err => {
// 	    console.log(err);
// 	});
//     parseNanohaMovie().subscribe(
// 	_ => {
// 	},
// 	err => {
// 	    console.log(err)
// 	});
//     processRelationsSimple("vivid_strike_ws")
// 	.subscribe(
// 	    data=> {
// //		console.log(data);
// 	    },
// 	    err => {
// 		console.log(err);
// 	    });
//     processRelationsSimple("nanoha_movie_ws")
// 	.subscribe(
// 	    data=> {
// //		console.log(data);
// 	    },
// 	    err => {
// 		console.log(err);
// 	    });
    
//}



//binparseSets();
