const { JSDOM } = require('jsdom');
const { Observable } = require('rx');
const { httpPromise } = require('./utils');
const { fromPromise, range, fromArray, just } = Observable;

const pages = function(data) {

    let dom = JSDOM.fragment(data);
    
    let links = dom.querySelectorAll('p.pageLink a');

    
    let pageCount = links.item(links.length - 2).textContent;
    return parseInt(pageCount);
    
}

const page = function(data) {
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

const info = function(data) {

    let dom = new JSDOM(data);

    let input = dom.window.document.querySelector('table.status tr.first td:nth-child(3)').textContent;
    input = input.split('\n')[1];
    let image = dom.window.document.querySelector('table.status tr.first td:first-child img');
    let number = dom.window.document.querySelector('table.status tr:nth-child(2) td:nth-child(2)').textContent;
    let rarity = dom.window.document.querySelector('table.status tr:nth-child(2) td:nth-child(4)').textContent;
    let level = dom.window.document.querySelector('table.status tr:nth-child(5) td:nth-child(2)').textContent;
    let abilities = dom.window.document.querySelector('table.status tr:nth-child(8) td').textContent;
    let couchdbid = number.trim().toLowerCase().replace('/','-').replace(/-/g,'_')
    return { name:input,
	     level,
	     number,
	     rarity,
	     id:couchdbid,
	     abilities:[abilities],
	     image:image.src.replace('..','http://ws-tcg.com/en/cardlist')};
}

let url = 'http://ws-tcg.com/en/jsp/cardlist/expansionDetail';

const cardset = function(id) {
    return fromPromise(httpPromise(url,'POST','expansion_id=' + id))
	.map(pages)
	.selectMany(input => {

	    return range(1,input);
	})
	.selectMany(i => {
	    return fromPromise(httpPromise(url, 'POST', 'expansion_id=' + id + '&page=' + i))
	})
	.map(page)
	.selectMany(fromArray)
	.selectMany( ({href}) => {
//	    console.log("looking up " + href);
	    return fromPromise(httpPromise('http://ws-tcg.com/en/cardlist/list/' + href))
		.map(info)
		.catch(e => {
		    console.log("Error lookup: " + href + ": " + e);
		    return just("")
		})
	})


}

exports.pages = pages;
exports.page = page;
exports.info = info;
exports.cardset = cardset;
