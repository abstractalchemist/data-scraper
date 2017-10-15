const http = require('http');

const db = process.argv[2];
const host = process.argv[3];

const mapper = function(doc) {
    if(doc) {
	emit(null,doc)
    }
}

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

let uuid = http.request({ method: "GET", host : host, port: "5984", path : "/_uuids"}, res => {
    let buffer = "";
    res.on('data', data => buffer += "" + data)
    res.on('end', _ => {
	let ddoc = http.request({ method: "PUT", host: host, port: "5984", path: "/" + db + "/_design/view"}, res => {
	    buffer = "";
	    res.on('data', data => buffer += "" + data);
	    res.on('end', _ => {
		console.log(buffer)
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
