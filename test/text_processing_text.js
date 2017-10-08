const { expect } = require('chai');
const { parseIt, parsePartition, findImageHref } = require('../src/translation_parsing.js');
const { JSDOM } = require('jsdom');

describe('text processing', function() {
    it('parse testing', function() {
	let data = "Arf, Equal Partner\n" +
	    "対等のパートナー アルフ\n" +
	    "Card No.: N1/W32-002  Rarity: U\n" +
	    "Color: Yellow   Side: Weiss  Character\n" +
	    "Level: 1   Cost: 0   Power: 3000   Soul: 1\n" +
	    "Trait 1: 使い魔 (Familiar)      Trait 2: 動物 (Animal)\n" +
	    "Triggers: None" +
	    "Flavor: Fate: \"Thank you...... Arf......\"\n" +
	    "TEXT: [A] BOND/\"Fate, Thinking of Mother\" [Put the top card of your Library in\n" +
	    "your Clock]\n" +
	    "[A] CHANGE [(2) Discard a card from hand to your Waiting Room, put this in the\n" +
	    "Waiting Room] At the start of your Climax Phase, you may pay cost. If so,\n" +
	    "choose an \"Arf, Wolf Form\" in your Waiting Room and put it in the Slot this was\n" +
	    "in.";
	let obj = parsePartition(data);
	expect(obj.lvl).to.equal("1");
	expect(obj.id[0]).to.eql("Card No.: N1/W32-002  Rarity: U");
	expect(obj.couchdbid).to.equal("n1-w32-002");
	expect(obj.abilities).to.eql(["[A] BOND/\"Fate, Thinking of Mother\" [Put the top card of your Library in your Clock]", "[A] CHANGE [(2) Discard a card from hand to your Waiting Room, put this in the Waiting Room] At the start of your Climax Phase, you may pay cost. If so, choose an \"Arf, Wolf Form\" in your Waiting Room and put it in the Slot this was in."]);
    })
    it('find image href', function() {
	const dom = new JSDOM("<div/><div/><div class='card_details'><img class='thumbnail' src='foo'/></div>");
	const href = findImageHref(dom);
	expect(href).to.equal('foo');
    })
})
