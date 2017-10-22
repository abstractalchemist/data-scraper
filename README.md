Usage: node src/index.js <arg from src/series_info.js>

Adding new series
- must modify series.json
```
    {
	"id":"vivid_strike_ws",
	"label":"Vivid Strike",
	"prefix":"VS/W50",
	"info":
	{
	    "url":"http://www.heartofthecards.com/translations/vivid_strike!_booster_pack.html",
	    "id":331
	}
    },

```
  - id - the database name; also the unique id of the series within the system
  - label - a human readable label
  - prefix - the prefix of all card numbers within the series, should be unique to each series
  - info - info object to get information, currently supports
    - Japanese
      - url - add heart of the cards booster translation page url
      - id - this is a mapping from the transformed prefix to series code used on littleakiba site
    - English
      - id - series id on ws-tcg web site
