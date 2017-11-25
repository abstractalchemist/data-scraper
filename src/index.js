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
const mapper = function(doc) {
    if(doc) {
	emit(null,doc)
    }
 }

//const auth = "admin:1qaz@WSX"

const lister = function(head,req) {
    provides('json', function() {
	buffer  = [];
//	row = getRow();
//	buffer.push(row.value);
	
	while(row = getRow()) {
	    //send("," + JSON.stringify(row.value));
	    buffer.push(row.value)
	}
	return JSON.stringify(buffer);
    })
    provides('html', function() {
	html = [];
	html.push('<html><body><ul>');
	while(row = getRow())
	    html.push('<li>' + row.key + '</li>');
	html.push('</ul></body></html>');
	return html.join('');
    })

}

const bynumber = function(doc) {
    if(doc.number)
	emit(doc.number,doc);
}

const abilities = function(doc) {
    if(doc.abilities)
	emit(doc.abilities.join("."),doc);
}


function addview({id}) {
    return Rx.Observable.from(httpPromise(`http://${cfg.db_host}:${cfg.db_port}/${id}/_design/view`, 'PUT',
		JSON.stringify({
		    views : {
			all : {
			    map : mapper.toString()
			},
			bynumber : {
			    map : bynumber.toString()
			},
			byabilities: {
			    map: abilities.toString()
			}
		    },
		    lists : {
			all : lister.toString()
		    }
		})))
}


//exports.scrapeIt = scrapeIt;
//console.log(process)
let inputs = fs.readFileSync(argv[2])
inputs = JSON.parse(inputs)

function recreatedb({id,label,prefix}) {
    let url = `http://${cfg.db_host}:${cfg.db_port}/${id}`
    let sets = `http://${cfg.db_host}:${cfg.db_port}/cardsets/sets`
    let mapping = `http://${cfg.db_host}:${cfg.db_port}/cardmapping/mapping`
    return Rx.Observable.from(httpPromise(url,'DELETE'))
	.mergeMap(_ => httpPromise(url,'PUT'))
	.mergeMap(_ => addview({id}))
	.mergeMap(_ => {
	    return Rx.Observable.from(httpPromise(sets,'GET'))
		.map(JSON.parse)
		.mergeMap(data => {
		    let sets = data.sets
		    if(sets.find( ({id:set_id}) => id === set_id))
			return Rx.Observable.of(data)
		    else {
			data.sets = data.sets.concat([{id, label}])
			return Rx.Observable.from(httpPromise(sets,'PUT', JSON.stringify(data)))
		    }
		})
	})
	.mergeMap(_ => {
	    return Rx.Observable.from(httpPromise(mapping, 'GET'))
		.map(JSON.parse)
		.mergeMap(data => {
		    let sets = data.mapping
		    if(sets.find( ({db}) => db === id))
			return Rx.Observable.of(data)
		    else {
			data.sets = data.sets.concat([{db:id, prefix:prefix.replace('/','_').replace('-','_').toLowerCase(),}])
			return Rx.Observable.from(httpPromise(sets,'PUT', JSON.stringify(data)))
		    }
		})
	    
	})
}



const map_to_db = o => {
    let storage = storeIt(cfg.db_host, cfg.db_port, o.id);
    if(o) {
	
	if(o.info.url) {
	    console.log(`processing ${o.info.url}`);

	    recreatedb(o)
		.mergeMap(_=> parseIt(o.info.url))
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
	    recreatedb(o)
		.mergeMap( _ => cardset(o.info.id))
		.mergeMap(storage)
		.subscribe(
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
