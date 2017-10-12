const { expect } = require('chai');
const { JSDOM } = require('jsdom');
const { pages, page, info, cardset } = require('../src/eng_scraper');
const { Observable } = require('rx');
const { create, fromArray } = Observable;
const { createReadStream } = require('fs');

let reader = function(input) {
    return create(observer => {
	let stream = createReadStream(input);
	let buffer = [];
	stream.on('data', data => buffer.push(data));
	stream.on('end', _ => {
	    observer.onNext(buffer.join(''));
	    observer.onCompleted();
	})
	stream.on('error', err => {
	    observer.onError(err);
	})
    })

}

describe('eng scraper', function() {
    it('pages', function(done) {
	reader('test-resources/expansionDetail.html')
	    .map(pages)
	    .subscribe(
 		data => {
		    expect(data).equal(22);
		    done(); 
		});
    })
    it('page', function(done) {
	let cards = [];
	reader('test-resources/expansionDetail.html')
	    .map(page)
	    .selectMany(fromArray)
	    .subscribe(
		data => cards.push(data),
		err => done(err),
		_ => {
		    expect(cards).to.have.lengthOf(10)
		    let c = cards[0];
		    console.log(c);
		    expect(c.name).to.equal("LL/EN-W02-E001");
		    expect(c.href).to.equal("?cardno=LL/EN-W02-E001");

		    done();
		})
	
    })

    it('detail', function(done) {
	reader('test-resources/cardDetail.html')
	    .map(info)
	    .subscribe(
		data => {
		    expect(data.name).to.equal('Tea Time, Kotori & Hanayo')
		    expect(data.rarity).to.equal('U');
		    expect(data.number).to.equal('LL/EN-W02-E002');
		    expect(data.image).to.equal("http://ws-tcg.com/en/cardlist/cardimages/WS_LLEN_W02_E002.png");
		    done();
		},
		err => {
		    done(err);
		})
    })

    it('cardset', function(done) {
	this.timeout(60000)
	cardset(32).subscribe(
	    data => {
		console.log(data);
		
	    },
	    err => {
		console.log(err);
		done();
	    },
	    _ => {
		done();
	    });
	    
    })
})
