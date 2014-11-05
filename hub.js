
re('http');
var qs = require('querystring');

var outward_ip = '127.0.0.1';
var outward_port = 1337;
// var outward_ip = '129.22.50.175';
// var outward_port = 8080;
// var sql_ip = '';

/*
// make a connection to sql
var connection =  mysql.createConnection({
	host : “hostName”,
	user : “username”,
	password: “password”
});
console.log("Successfully connected");
*/


// console.log(ALL_DATA.canvases);

var ALL_HTTP_REQUESTS = [];
var ALL_DATA = {
	"canvases": []
};
/** 
 * A sample of an object that would be in ALL_DATA.canvases is below.

{
	name:'canvas of meh',
	bitmap:'some string representing bitmap, this doesn't care what it is'
		// few random other pieces of data. name and bitmap only things this needs right now (query by name)
}
*/

// create a server 
http.createServer(function (incoming_request, our_response) {
	ALL_HTTP_REQUESTS.push(incoming_request);		// keep track of all requests per session
	
	// console.log(JSON.stringify(incoming_request.body));

	// handle each case - TODO: eventually change to switch-case
	if (incoming_request.method == 'GET') {
		handleGETrequest(incoming_request, our_response);
	
	} else if (incoming_request.method == 'POST') {
		handlePOSTrequest(incoming_request, our_response);
	
	/** No need to support PUT
	} else if (incoming_request.method == 'PUT') {
		handlePUTrequest(incoming_request, our_response);
	*/

	} else {
		our_response.writeHead(405, {'Content-Type': 'text/plain'});
		our_response.end("Whatchu tryna do?");
	}
}).listen(outward_port, outward_ip);

console.log('Server running at http://' + outward_ip + ":" + outward_port + '/');
// console.log();

// subfunctions
function handleGETrequest(request, response) {
	if (request.url != "/canvas") {
		var json = {
		    "name": "Ishaan",
		    "occupation": "Software Engineer",
		    "interests": [
		        "Bhangra",
		        "Life",
		        "Music"
		    ],
		    "groups": {
		        "nsteak": [
		            "pshant",
		            "zach",
		            "sagar",
		            "shouvik"
		        ]
		    }
		};
		response.writeHead(200, { 'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" })
		response.write( JSON.stringify( json, 0, 4 ));
		response.end();
	} else if (request.url == "/canvas") {
		response.setHeader('Content-Type', 'application/json');
		response.write( JSON.stringify( ALL_DATA.canvases, 0, 4 ));
		response.end();
	} else {
		response.writeHead(405, {'Content-Type': 'text/plain'});
		response.end("Invalid path.");
	}
}

function handlePOSTrequest(request, response) {
	if (request.url == '/canvas') {
		request.on('data', function(chunk) {			// using library to read POST payload (json)
			var payload = JSON.parse(chunk);
			ALL_DATA.canvases.push(payload);			// push JSON to database
														// then write response
			response.writeHead(201, {'Content-Type' : 'application/json'});		
			response.end(JSON.stringify(ALL_DATA.canvases));
			console.log("Canvases: %j", ALL_DATA.canvases);
	    });		

	    /** Prints POST data
		console.log((request.pipe(process.stdout)));
		response.end();
		*/
	}
}

/** No need to support this.
function handlePUTrequest(request, response) {
	if (request.url == '/canvas') {
		var incoming_canvas_name = 1;
		for (var i = 0; i < ALL_DATA.canvases.length; i++) {
			if (ALL_DATA.canvases[i].name == getPayloadFromRequest(request)) {			// if the name in the request exists in the 'database'
				ALL_DATA.canvases[i].name = getPayloadFromRequest(request);
				console.log("success");
			}
		}
		// TODO: do stuff here
	}
}
*/

/* TODO: fix race condition (bypassed for now)
function getPayloadFromRequest(request) {
	request.on('data', function(chunk) {
    	return JSON.parse(chunk);
    });
}
*/


String.prototype.escapeSpecialChars = function() {
    return this.replace(/\\n/g, "\\n")
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\\&/g, "\\&")
               .replace(/\\r/g, "\\r")
               .replace(/\\t/g, "\\t")
               .replace(/\\b/g, "\\b")
               .replace(/\\f/g, "\\f");
};












