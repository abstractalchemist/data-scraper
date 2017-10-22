const { spawn } = require('child_process')
const { readFileSync } = require('fs')

let db = process.argv[2]
let config = process.argv[3]
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

let f = function({stdout, stderr}) {
    stdout.on('data', data => console.log(data.toString()))
    stderr.on('data', data => console.log(data.toString()))
}

f(spawn("node",["src/index.js", config, db]))
