/**
 * creates the mapping databases
 */

const http = require('http');
const fs = require('fs')

let series_file = process.argv[2];
let host = process.argv[3]

let inputdata = fs.readFileSync(process.argv[2]);
let info = JSON.parse(inputdata);

//const auth = "admin:1qaz@WSX"

function recreate(db, document, data) {
    let sets = http.request(
	{
	    method:"DELETE", host, port:5984, path:`/${db}`
	},
	res => {
	    let buffer = [];
	    res.on('data',data => buffer.push(data))
	    res.on('end',
		   _ => {
		       console.log(`deleted ${db} with ${buffer.join('')}`)
		       let create = http.request(
			   {
			       method:"PUT", host, port:5984, path:`/${db}`
			   },
			   res => {
			       buffer = []
			       res.on('data', data => buffer.push(data))
			       res.on('end',
				      _ => {
					  console.log(`created with ${buffer.join('')}`);
					  let sets = http.request(
					      {
						  method:"PUT",host,port:5984,path:`/${db}/${document}`
					      },
					      res => {
						  buffer =[];
						  res.on('data', data => buffer.push(data))
						  res.on('end',
							 _ => {
							     console.log(`finished writing ${db} with ${buffer.join('')}`)
							     
							 })
					      })
					  sets.write(JSON.stringify(data))
					  
					  sets.end()
				      })
			   })
		       create.write('');
		       create.end();
		   })
	})
    sets.write('')
    sets.end('')
}


recreate('cardsets','sets', { sets:info.map( ({id,label}) => {
    return {id,label}
}) })

recreate('cardmapping', 'mapping', {
    mapping:info.map( ({prefix,id:db}) => {
	let p = prefix;
	if(typeof p === 'string') {
	    return {
		prefix:prefix.replace('/','_').replace('-','_').toLowerCase(),
		db
	    }
	}
	else {
	    return prefix.map(p => {
		return {
		    prefix:p.replace('/','_').replace('-','_').toLowerCase(),
		    db
		}
	    })
	}
    }).reduce( (acc, val) => {
	if(val.length)
	    return acc.concat(val)
	else {
	    acc.push(val)
	    return acc;
	}
    }, [])
})

