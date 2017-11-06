const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;
const Rx = require('rxjs/Rx');
const { URL } = require('url');

const { argv } = require('process');

const fs = require('fs');

const { httpPromise, retrieveHrefs } = require('./utils');
const { checkDOM, rebuildAbilities } = require('./dom_parsing');
const { processRelationsSimple, storeIt } = require('./couchdb_processing');
const { parseIt } = require('./translation_parsing');
const { cfg } = require('./config');

const { cardset } = require('./eng_scraper');

// function scrapeIt() {
// //    console.log("running it");
//     return Rx.Observable
// 	.range(1,16)
// 	.mergeMap(index => {
// 	    return Rx.Observable.from(httpPromise("http://www.heartofthecards.com/code/wscardsearch.html?neostandard=vividstrike&cardlimit=10&cardpage=" + index + "&cardpower1=any&cardpower2=any&cardlevel1=any&cardlevel2=any&cardsoul1=any&cardsoul2=any&cardcost1=any&cardcost2=any&cardcolor=any&cardtype=any"))
// 	})
// 	.map(data => {

// 	    return new JSDOM(data);
// 	})

// 	.mergeMap(dom => {
// 	    return Rx.Observable.from(retrieveHrefs(dom));
// 	})

// 	.pluck('href')
// 	.filter(href => /cardlist/.test(href))
// 	.delay(1000)
// 	.mergeMap(href => {
// 	    console.log("fetching " + href);
// 	    return Rx.Observable.from(httpPromise(href));
// 	})
// 	.map(data => {

// 	    return new JSDOM(data)
// 	})
// 	.map(checkDOM);

// }
function pause(time) {
    return function(data) {
	return Rx.Observable.create(obs => {
	    setTimeout(function() {
		obs.next(data)
		obs.complete()
	    }, time)
	})
    }
}

//exports.scrapeIt = scrapeIt;
//console.log(process)
let inputs = fs.readFileSync(argv[2])
inputs = JSON.parse(inputs)


const map_to_db = o => {
    let storage = storeIt(cfg.db_host, cfg.db_port, o.id);
    if(o) {
	
	if(o.info.url) {
	    console.log(`processing ${o.info.url}`);
	    
	    parseIt(o.info.url)
		.mergeMap(storage)
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
		mergeMap(storage).
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

}
//inputs.forEach(map_to_db)
function process(info, i) {
    if(i < info.length) {
	return Rx.Observable.of(info[i])
	    .map(map_to_db)
	    .mergeMap(pause(10000))
	    .mergeMap(_ => {
		return process(info, i + 1)
	    })
    }
    return Rx.Observable.of("")
		
}

process(inputs, 0)
    .subscribe(
	d => {
	},
	err => {
	    throw new Error(err)
	},
	_ => {
	    console.log("Finished Processing")
	})
