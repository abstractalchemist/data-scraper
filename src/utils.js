const http = require('http');
const https = require('https');
const { URL } = require('url');

function httpPromise(url, method, data) {
    const u = new URL(url);
    method = method || "GET";
    data = data || "";
//    console.log(url);
    return new Promise( (resolve, reject) => {
	let module = http;
	if(u.protocol == 'https:')
	    module = https;
	const req = module.request({ method:method,
				     hostname:u.hostname,
				     port:u.port,
				     path:u.pathname + u.search,
				     protocol:u.protocol},
				   res => {
				       
				     if(res.statusCode === 200 || res.statusCode == 201) {
					 let buffer = [];
					 res.on('data', chunk => buffer.push(chunk));
					 res.on('end', _ => {
					     resolve(buffer.join(''));
					 })
					 
					 
				     }
				     else {
					 reject("error " + res.statusCode + " on " + url);
				     }
				 });
	req.on('error', err => {
	    console.log("error " + err);
	    reject(err);
	})
	req.write(data);
	req.end();
    })
}

function retrieveHrefs(dom) {
    const document = dom.window.document;
    return document.querySelectorAll('table.cardsearch tr:not(:nth-child(1)) td:nth-child(1) a:nth-child(1)');
    
}

exports.httpPromise = httpPromise;
exports.retrieveHrefs = retrieveHrefs;
