// parse a booster translation file from Heart of the cards

const { Observable } = require('rxjs/Rx');
const { create, from } = Observable;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { httpPromise } = require('./utils');
const { rebuildAbilities } = require('./dom_parsing');
//const { series_code } = require('./config');

const config_data = fs.readFileSync(process.argv[2]);
const config = JSON.parse(config_data)
function series_code(id) {
//    console.log(`checking ${id}`)
    let info = config.find( ({prefix,info}) => {
	if(info.url && info.id) {
	    if(typeof prefix === 'string')
		return id.startsWith(prefix.replace("/","_").replace("-","_").toLowerCase())
	    return prefix.find( i => id.startsWith(i.replace("/","_").replace("-","_").toLowerCase()))
	}
    })
    if(info) {
	return info.info.id;
    }
    else
	console.log("id mapping not found")
}

const re1 = new RegExp("TEXT:");
const lvlre = /^Level: ([0-9]).*/;
const idre = new RegExp("^Card No[.]: (.+)\w*Rarity:(.+)");

function parsePartition(partition) {
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
    let couchdbid = id[1].trim().toLowerCase().replace('/','_').replace('-','_')
    let splitid = couchdbid.split('_');

    return {
	rarity:id[2].trim(),
	data,
	lvl,
	id,
	couchdbid,
	abilities,
	splitid
    }
}

function findImageHref(dom) {
    let img = dom.window.document.querySelectorAll('div.card_details img.thumbnail');
//    console.log(img)
    if(img && img.length > 0) {
//	console.log("parsed " + couchdbid);
	return img[0].src.replace(/"/g,'');
    }
    else {
//	console.log("error, could not parse " + couchdbid);
	return "";
    }
    return img;
}

function generateFileParser(file) {
    return create(observer => {
	const read = fs.createReadStream(file);
	let buffer = [];
	read.on('data', chunk => buffer.push(chunk));
	read.on('end', _ => {

	    observer.onext(buffer.join());
	    observer.complete()
	})
	read.on('error', err => {
	    observer.error();
	})
    })
}

function generateHttpParser(url) {
    return from(httpPromise(url));
}



function parseIt(file) {
    //    console.log("Parsing it");
    let parseFunc;
    if(file.startsWith("/"))
	parseFunc = generateFileParser;
    else if(file.startsWith("http"))
	parseFunc = generateHttpParser;
    else
	throw "Could not locate a parser for input";
    return parseFunc(file)
	.map(data => new JSDOM(data))
	.map(dom => dom.window.document.querySelector("pre").textContent)
	.mergeMap(data => {
	    return from(data.split("================================================================================"));
	})
	.filter(data => {
	    return new RegExp("Level:").test(data)
	})
	.mergeMap(partition => {
	    let { lvl, data, id, couchdbid, abilities, splitid, rarity } = parsePartition(partition);
	    return from(httpPromise('https://littleakiba.com/tcg/weiss-schwarz/card.php?series_id=' + series_code(couchdbid) + '&code=' + splitid[splitid.length - 1]  +  '&view=Go'))
//		.do(data => fs.writeFile('/tmp/' + couchdbid + '.html', data, err => { if(err) console.log(err)} ))
		.map(data => new JSDOM(data))
		.map(findImageHref)
		.map(imgsrc => {
//		    console.log(imgsrc);
		    return {name:data[0],
			    level:lvl,
			    rarity:rarity,
			    number:id[1].trim(),
			    id:couchdbid,
			    abilities:abilities,
			    image:imgsrc}
		})
	})
					  
	    
}

exports.parseIt = parseIt;
exports.parsePartition = parsePartition;
exports.findImageHref = findImageHref;
