const chai = require('chai');
const expect = chai.expect;
const { checkDOM, rebuildAbilities  } = require('../src/dom_parsing');
const { JSDOM } = require('jsdom');

describe('dom parsing', function() {
    it('checkDOM', function() {
	const dom = new JSDOM('<table class="cards">' +
			      '<tr><td /><td>foo</td></tr>' +
			      '<tr><td /><td>0</td></tr>' +
			      '<tr><td /><td></td></tr>' +
			      '<tr><td /><td /><td /><td>1</td></tr>' +
			      '<tr><td /><td>foo</td></tr>' +
			      '</table>' +
			      '<img src="http://foo.com/bar/images/cards/bin" ></img>');
	const item = checkDOM(dom);
	expect(item.name).to.equal('foo');
	expect(item.id).to.equal('0');
	expect(item.level).to.equal('1');

	// not sure why this is failing;  ignore for now
	expect(item.image).to.equal('http://foo.com/bar/images/cards/bin');
    })

    it('rebuild abilities', function() {
	const abilitiesList = ["[1] something else here", "to join", "[2] and here"];
	const rebuilt = rebuildAbilities(abilitiesList);
	expect(rebuilt).to.have.lengthOf(2);
	expect(rebuilt).to.eql(["[1] something else here to join", "[2] and here"]);
    })
})
