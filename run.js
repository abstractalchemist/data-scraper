const { spawn } = require('child_process')
const { readFileSync } = require('fs')

let db = "localhost"
let config = "series.json"
let mapping = spawn("node", ["mappings.js", config, db])
let configdata = readFileSync(config)
let parsed = JSON.parse(configdata)
mapping.stdout.on('data',
		  data => {
		      console.log(data.toString())
		  })

mapping.stderr.on('data',
		  data => {
		      console.log(data.toString())
		  })
mapping.on('close', _ => {
    parsed.forEach( ({id}) => {
	let entry = spawn("node",["entry.js", id, db]);
	entry.stdout.on('data', data => console.log(data.toString()))
	entry.stderr.on('data', data => console.log(data.toString()))
    })
			   
})
