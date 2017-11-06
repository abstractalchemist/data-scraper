const { JSDOM } = require('jsdom');
const { Observable } = require('rxjs/Rx');
const { httpPromise } = require('./utils');
const { from, range, of } = Observable;

const pages = function(data) {
    let dom = JSDOM.fragment(data);
    
    let links = dom.querySelectorAll('p.pageLink a');

    
    let pageCount = links.item(links.length - 2).textContent;
    return parseInt(pageCount);
    
}

const page = function(data) {
//    console.log("looking at page");
    let dom = JSDOM.fragment(data);
    let cards = dom.querySelectorAll('tr');
    
    let output = [];
    for(let i = 1; i < cards.length; ++i) {
	let nameRow = dom.querySelector('tr:nth-child(' + (i + 1) + ') td:nth-child(1)');
	
	

	let hrefRow = dom.querySelector('tr:nth-child(' + (i + 1) + ') td:nth-child(3) a');
	if(nameRow && hrefRow)
	    output.push({name:nameRow.textContent,href:hrefRow.href});
    }
    return output;
}

const map_trigger_value = function(value) {
    if(value) {
	if(value.endsWith("soul.gif"))
	    return "soul"
	if(value.endsWith("salvage.gif"))
	    return "salvage"
	if(value.endsWith("draw.gif"))
	    return "draw"
	if(value.endsWith("treasure.gif"))
	    return "treasure"
	if(value.endsWith("stock.gif"))
	    return "pool"
	if(value.endsWith("bounce.gif"))
	    return "bounce"
	else {
	    console.log(`failed to map ${value} as a trigger value`)
	    return "";
	}
	
    }
	
}

const processtrigger = function(trigger_data) {
    if(trigger_data && trigger_data.length) {
	let trigger1 = trigger_data[0] ? trigger_data[0].src : ""
	let trigger2 = trigger_data[1] ? trigger_data[1].src : "";

	// probably a climax card
	if(trigger1 && trigger2) {
	    let one = map_trigger_value(trigger1)
	    let two = map_trigger_value(trigger2)
	    if(one === 'soul' && two === 'soul')
		return "soul2"
	}

	// only trigger1
	return map_trigger_value(trigger1)
	
    }
    return ""
}

const info = function(data) {

    let dom = new JSDOM(data);

    let input = dom.window.document.querySelector('table.status tr.first td:nth-child(3)').textContent;
    input = input.split('\n')[1];
    let image = dom.window.document.querySelector('table.status tr.first td:first-child img');
    let number = dom.window.document.querySelector('table.status tr:nth-child(2) td:nth-child(2)').textContent;
    let rarity = dom.window.document.querySelector('table.status tr:nth-child(2) td:nth-child(4)').textContent;
    let level = dom.window.document.querySelector('table.status tr:nth-child(5) td:nth-child(2)').textContent;
    let abilities = dom.window.document.querySelector('table.status tr:nth-child(8) td').textContent;
    
    let cost = dom.window.document.querySelector('table.status tr:nth-child(5) td:nth-child(4)').textContent;
    let power = dom.window.document.querySelector('table.status tr:nth-child(6) td:nth-child(2)').textContent;
    let soul = dom.window.document.querySelectorAll('table.status tr:nth-child(6) td:nth-child(4) img').length
    let trigger = processtrigger(dom.window.document.querySelectorAll('table.status tr:nth-child(7) td:nth-child(2) img'))
    let couchdbid = number.trim().toLowerCase().replace('/','-').replace(/-/g,'_')
    return { name:input,
	     level,
	     number,
	     rarity,
	     power,
	     soul,
	     cost,
	     trigger,
	     id:couchdbid,
	     abilities:[abilities],
	     image:image.src.replace('..','http://ws-tcg.com/en/cardlist').replace(',','.')};
}

let url = 'http://ws-tcg.com/en/jsp/cardlist/expansionDetail';

const cardset = function(id) {
    return from(httpPromise(url,'POST','expansion_id=' + id))

	.map(pages)
	.mergeMap(input => {

	    return range(1,input);
	})
	.mergeMap(i => {
	    return from(httpPromise(url, 'POST', 'expansion_id=' + id + '&page=' + i))
	})
	.map(page)
	.mergeMap( data => {
	    return from(data)
	})
	.mergeMap( ({href}) => {
//	    console.log("looking up " + href);
	    return from(httpPromise('http://ws-tcg.com/en/cardlist/list/' + href))
		.map(info)
		.catch(e => {
		    console.log("Error lookup: " + href + ": " + e);
		    return of("")
		})
	})


}

exports.pages = pages;
exports.page = page;
exports.info = info;
exports.cardset = cardset;
