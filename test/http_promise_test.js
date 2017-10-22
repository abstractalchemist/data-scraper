const chai = require('chai');
const expect = chai.expect;
const { httpPromise, retrieveHrefs } = require('../src/utils.js');
const { Observable } = require('rxjs/Rx');
const { from } = Observable.from;
const { JSDOM } = require('jsdom');

describe('utils test', function() {
    it('http', function(done) {
	this.timeout(15000);
	from(httpPromise('https://www.google.com'))
	    .subscribe(
		_ => {
		  
		},
		err => {
		    done(err);
		},
		_ => {
		    done();
		})
    })

    it('hrefs', function() {
	const dom = new JSDOM("<table class='cardsearch'>" +
			      "<tr></tr>" + // ignores this row
			      "<tr><td><a/></td></tr>" + // finds this row
			      "<tr><td><a/></td></tr>" + // finds this row
			      "</table>");
	const refs = retrieveHrefs(dom);
	expect(refs).to.have.lengthOf(2);
    })
})
