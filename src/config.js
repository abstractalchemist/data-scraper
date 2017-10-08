function series_code(id) {
    if(id.startsWith('vs-w50')) {
	return '331'

    }
    else if(id.startsWith('n1-w32') || id.startsWith('n2-w32')) {
	return '151';
    }
    else if(id.startsWith('ll-w24')) {
	return '120';
    }
}

let cfg = (function() {
    return {
	db_host : "localhost",
	db_port : "5984"
    }
})()

exports.series_code = series_code;
exports.cfg = cfg;
