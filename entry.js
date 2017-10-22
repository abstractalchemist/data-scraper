/* provides list and mapping functions for couchdb
 * format of urls are 
 * /<db>/_design/view/_view/<view key> - for views
 * /<db>/_design/view/_list/<list key>/<view key> - for formatted views
 * queries should be done with POST, where data is JSON {"keys": [.. some keys ]}
 *
 * arguments <db> <host> <arg> where arg is either "--add" or "--delete"
 * --add - add the view to the database
 * --delete - delete the view from the database
 */

const http = require('http');

const db = process.argv[2];
const host = process.argv[3];
const task = process.argv[4] || "--recreate";

const mapper = function(doc) {
    if(doc) {
	emit(null,doc)
    }
}

const auth = "admin:1qaz@WSX"

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

function recreatedb(endIt) {
    let del = http.request({ method:"DELETE", host, port:"5984",path:"/" + db,auth},
			   res => {
			       let buffer = []
			       res.on('data',data => buffer.join('data'))

			       res.on('end', _ => {
				   console.log(`deleted ${db} with ${buffer.join('')}`)
				   let create = http.request({method:"PUT",host,port:"5984",path:"/" + db, auth},
							     res => {
								 buffer = []
								 res.on('data', data => buffer.push(data))
								 res.on('end', _ => {
								     
								     console.log(`finished creating ${db} with out ${buffer.join('')}`)
								     if(endIt)
									 endIt();
								 })
							     })
				   create.write('');
				   create.end();
			       })
			   });
    del.write('');
    del.end();
}

function addview(endIt) {
    let uuid = http.request({ method: "GET", host : host, port: "5984", path : "/_uuids"}, res => {
	let buffer = "";
	res.on('data', data => buffer += "" + data)
	res.on('end', _ => {
	    let ddoc = http.request({ method: "PUT", host: host, port: "5984", path: "/" + db + "/_design/view",auth}, res => {
		buffer = "";
		res.on('data', data => buffer += "" + data);
		res.on('end', _ => {
		    console.log(buffer)
		    if(endIt)
			endIt();
		})
	    })

	    ddoc.write(JSON.stringify({
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
	    }));
	    ddoc.end();
	})
    })
    uuid.write('');
    uuid.end();
}

function removeview() {

    let req = http.request({ method: "GET", host: host, port: "5984", path: "/" + db + "/_design/view"}, res => {
	let buffer = [];
	res.on('data', data => buffer.push(data))
	res.on('end', _ => {
	    let view = JSON.parse(buffer.join(''));
	    if(view._rev) {
		let deleteReq = http.request({method:"DELETE",host:host,port:"5984",path:"/" + db + "/_design/view?rev=" + view._rev,auth}, res => {
		    let buffer2 = [];
		    res.on('data', data => buffer2.push(data));
		    res.on('end', _ => {
			console.log(buffer2.join(''));
		    })
		})
		deleteReq.end();
	    }
	})
    })
    req.end();
}

if(task === '--add')
    addview();
else if(task === '--delete')
    removeview();
else if(task === '--recreate')
    recreatedb(addview);
