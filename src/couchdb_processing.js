const { Observable } = require('rxjs/Rx');
const { httpPromise } = require('./utils');
const { from } = Observable;
const { cfg } = require('./config');

const db_domain = "http://" + cfg.db_host + ":" + cfg.db_port;

function processRelationsSimple(db) {
    return from(httpPromise(db_domain + "/" + db + "/_design/view/_list/all/all"))
	.map(JSON.parse)
	.mergeMap(data => {
	    return from(data)

		.map(card => {
		    let relatedTo = data.filter(({abilities}) => {
			if(abilities.filter)
			    return abilities.filter(o => o.includes(card.name)).length > 0
			if(abilities.includes)
			    return abilities.includes(card.name);
		    })
		    if(relatedTo.length > 0) {
//			console.log(card.name + ' is related to ' + relatedTo[0].name);
			return Object.assign({}, card, { relatedTo: relatedTo[0].id })
		    }
		    return card;
		})
	})
	.mergeMap(data => {
	    return from(httpPromise(db_domain + "/" + db + "/" + data._id, "PUT", JSON.stringify(data)));
	})
    
}

function storeIt(host, port, database) {
    return function(object) {
	
	let id = object.id;
//	console.log(`using ${host} and ${port} and ${database}`);
	return from(httpPromise('http://' + host + ':' + port + "/" + database + "/" + id, "PUT", JSON.stringify(object)))
    }
}

exports.processRelationsSimple = processRelationsSimple;
exports.storeIt = storeIt;
