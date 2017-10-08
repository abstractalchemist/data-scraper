const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;
const Rx = require('rx');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const fs = require('fs');

function httpPromise(url, method, data) {
    const u = new URL(url);
    method = method || "GET";
    data = data || "";
    console.log(url);
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

function series_code(id) {
    if(id.startsWith('vs-w50')) {
	return '331'

    }
    else if(id.startsWith('n1-w32') || id.startsWith('n2-w32')) {
	return '151';
    }
    else if(id.startsWith('ll-w24')) {
	return '120';
    }
}

function storeIt(host, port, database) {
    return function(object) {
	
	let id = object.id;
	return Rx.Observable.fromPromise(httpPromise("http://" + host + ":" + port + "/" + database + "/" + id, "PUT", JSON.stringify(object)))
    }
}

let localhost = storeIt("localhost", "5984", "vivid_strike_ws");

function checkDOM(dom) {
    const document = dom.window.document;
    const nameElem = document.querySelector('table.cards tr:nth-child(1) td:nth-child(2)');
    let name = nameElem ? nameElem.textContent : "Name Not Found";
    const idElem = document.querySelector('table.cards tr:nth-child(2) td:nth-child(2)');
    let id = idElem ? idElem.textContent : "Id not found";
    const levelElem = document.querySelector('table.cards tr:nth-child(4) td:nth-child(4)')
    let level = levelElem ? levelElem.textContent : "level not found";
    const imageElem = document.querySelectorAll('img[src*="images/cards"]');
    let image = imageElem ? imageElem.src : "";
    if(!(nameElem && idElem && levelElem && imageElem)) {
	console.log("Something went missing from : " + document.location.href);
	return {};
    }
    else
	return { name:name,
		 id:id, 
		 level:level,
		 image:image }

}

function retrieveHrefs(dom) {
    const document = dom.window.document;
    return document.querySelectorAll('table.cardsearch tr:not(:nth-child(1)) td:nth-child(1) a:nth-child(1)');
    
}
const re = new RegExp("^TEXT:(.+)$");

function rebuildAbilities(input) {

    let buffer = [];
    for(let i = 0; i < input.length; ++i) {
	
	let data = input[i];
	
	try {
	    let rei = re.exec(data);
	    if(rei && rei.length > 0) {
		data = rei[1].trim();
	    }
	    if(!data.startsWith("[")) {
		buffer[buffer.length - 1] += " " + data;
	    }
	    else
		buffer.push(data);
	}
	catch(e) {
	    console.log(e);
	}
	

    }

    return buffer;
}

const re1 = new RegExp("TEXT:");
const lvlre = /^Level: ([0-9]).*/;
const idre = new RegExp("^Card No[.]: (.+)\w*Rarity:(.+)");

function parseIt(file) {
    console.log("Parsing it");
    return Rx.Observable.create(observer => {
	const read = fs.createReadStream(file);
	let buffer = [];
	read.on('data', chunk => buffer.push(chunk));
	read.on('end', _ => {

	    observer.onNext(buffer.join());
	    observer.onCompleted()
	})
	read.on('error', err => {
	    observer.onError();
	})
    })
	.map(data => new JSDOM(data))
	.map(dom => dom.window.document.querySelector("pre").textContent)
	.selectMany(data => {
	    return Rx.Observable.fromArray(data.split("================================================================================"));
	})
	.filter(data => {
	    return new RegExp("Level:").test(data)
	})
	.selectMany(partition => {

	    const data = partition.split("\n").map(o => o.trim()).filter(o => o.length > 0);
	    const index = data.findIndex(input => re1.test(input));
	    let abilities = "";
	    if(index >= 0) {
		
		const sliced = data.slice(index);

		abilities = rebuildAbilities(sliced);
	    }
	    const level = lvlre.exec(data[4]);
	    
	    let lvl = level ? level[1] : "no level";
	    let id = idre.exec(data[2])
	    let couchdbid = id[1].trim().toLowerCase().replace('/','-');
	    let splitid = couchdbid.split('-');
	    return Rx.Observable.fromPromise(httpPromise('https://littleakiba.com/tcg/weiss-schwarz/card.php?series_id=' + series_code(couchdbid) + '&code=' + splitid[splitid.length - 1]  +  '&view=Go'))
		.do(data => fs.writeFile('/tmp/' + couchdbid + '.html', data, err => { if(err) console.log(err)} ))
		.map(data => new JSDOM(data))
		.map(dom => {

		    let img = dom.window.document.querySelectorAll('div.card_details img.thumbnail');
		    if(img && img.length > 0) {
			console.log("parsed " + couchdbid);
			return img[0].src.replace(/"/g,'');
		    }
		    else {
			console.log("error, could not parse " + couchdbid);
			return "";
		    }
		})
		.map(imgsrc => {
		    //console.log(imgsrc);
		    return {name:data[0],
			    level:lvl,
			    number:id[1].trim(),
			    id:couchdbid.replace(/-/g,'_'),
			    abilities:abilities,
			    image:imgsrc}
		})
	})
					  
	    
}

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

function parseSets() {
    parseVividStrike().subscribe(
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

parseSets();
