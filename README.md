Usage: node src/index.js <arg from src/series_info.js>

Adding new series
- must modify src/series_info.js
  - add some symbol
  - add couchdb db name
  - add heart of the cards booster translation page url
  - also requires adding to deck builder populate_db the database drop/create instructions, as well as prefix mapping ( card db id prefix )
  
- must modify src/config.js
  - add to series_code function mapping
  - this is a mapping from the transformed prefix to series code used on littleakiba site