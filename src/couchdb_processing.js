const { Observable } = require('rx');
const { httpPromise } = require('./utils');
const fromArray = Observable.fromArray;
const fromPromise = Observable.fromPromise;

const { cfg } = require('./config');

const db_domain = "http://" + cfg.db_host + ":" + cfg.db_port;

function processRelationsSimple(db) {
    return fromPromise(httpPromise(db_domain + "/" + db + "/_design/view/_list/all/all"))
	.map(JSON.parse)
	.selectMany(data => {
	    return fromArray(data)

		.map(card => {
		    let relatedTo = data.filter(({abilities}) => abilities.filter(o => o.includes(card.name)).length > 0);
		    if(relatedTo.length > 0) {
//			console.log(card.name + ' is related to ' + relatedTo[0].name);
			return Object.assign({}, card, { relatedTo: relatedTo[0].id })
		    }
		    return card;
		})
	})
	.selectMany(data => {
	    return fromPromise(httpPromise(db_domain + "/" + db + "/" + data._id, "PUT", JSON.stringify(data)));
	})
    
}

function storeIt(host, port, database) {
    return function(object) {
	
	let id = object.id;
	return fromPromise(httpPromise(db_domain + "/" + database + "/" + id, "PUT", JSON.stringify(object)))
    }
}

exports.processRelationsSimple = processRelationsSimple;
exports.storeIt = storeIt;
