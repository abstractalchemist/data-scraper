const http = require('http');

const db = process.argv[2];
const host = process.argv[3];

const mapper = function(doc) {
    if(doc) {
	emit(null,doc)
    }
}

const lister = function(head,req) {
    send("[");
    row = getRow();
    send(JSON.stringify(row.value));
    
    while(row = getRow()) {
	send("," + JSON.stringify(row.value));
    }
    send("]");
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
