
var http = require('http'),

	url = require('url'),
	qs = require('querystring'),
	exec = require('child_process').exec,
	MongoClient = require('mongodb').MongoClient,
	assert = require('assert'),
	fs = require('fs-extra'),
	users = require('./usersHandlers'),
	canvases = require('./canvasesHandlers');
/*
var outward_ip = '127.0.0.1';
var outward_port = 1337;
*/ 
var outward_ip = '129.22.50.175';
var outward_port = 8080;
var database_ip = "mongodb://localhost:27017/test";
/** 
 * A sample of an object that would be in ALL_DATA.canvases is below.

{
	name:"canvas of meh",
	bitmap:"some string representing bitmap, this doesn't care what it is"
		// few random other pieces of data. name and bitmap only things this needs right now (query by name)
}
*/

// create a server 
http.createServer(function (incoming_request, our_response) {
	console.log("METHOD" + incoming_request.method);
	var post_data = "";
	incoming_request.on('data', function(chunk) {
		post_data += chunk;
	});
	incoming_request.on('end', function() {
		insertRequest({
			"method"    : incoming_request.method,
			"headers"   : incoming_request.headers,
			"url"       : url.parse(incoming_request.url),
			"payload"   : post_data
		}); 		// keep track of all requests
		if (incoming_request.method == "POST")
			handlePOSTrequest(incoming_request, our_response, post_data);
	});
	if (incoming_request.method != "POST") {
		console.log(incoming_request);
		our_response.writeHead(405, {'Content-Type' : 'text/plain'});
		our_response.end();
	}
	if (incoming_request.method == "GET") {
		console.log("GET: " + incoming_request);
		var request = url.parse(req.url, true);
		console.log("URL parse: " + request);

		if (incoming_request.url.split('.png').length == 1) {
			var path = incoming_request.url.split('/');
			var folder = path[path.length -1];
			fs.readFile(process.cwd() + "/images/" + folder + "/image.html", function(err, data) {
				if (err) {
					our_response.writeHead(404, {'Content-Type':'text/plain'});
					our_response.end();
				} else {
					our_response.writeHead(200, {'Content-Type':'text/html'});
					our_response.write(data);
					our_response.end();
				}
			});
		} else if (incoming_request.url.split('.png').length > 1) {
			var path = incoming_request.url.split('/');
			var folder = path[path.length - 2];
			var fileName = path[path.length -1];
			fs.readFile(process.cwd() + "/images/" + folder + '/' + fileName, function(err, data) {
				if (err) {
					our_response.writeHead(404, {'Content-Type':'text/plain'});
					our_response.end();
				} else {
					our_response.writeHead(200, {'Content-Type':'image/png'});
					our_response.write(data);
					our_response.end();
				}
			})
		}
	}
	// handle each case - TODO: eventually change to switch-case
}).listen(outward_port, outward_ip);

console.log('Server running at http://' + outward_ip + ":" + outward_port + '/');

// main flow subfunctions
function handlePOSTrequest(request, response, post_data) {
	// TODO: refactor this the make it flow.. first parse body, then decide where to route it 
	var payload = {};
	try {
		payload = JSON.parse(post_data);
	} catch (err) {
		console.log("Error Parsing JSON Payload: " + err);
		response.writeHead(422, {'Content-Type': 'text/plain'});
		response.end();
	}
	if(payload.db == "users")
		users.open(response, payload, database_ip);
	else if(payload.db == "canvases")
		canvases.open(response, payload, database_ip);
	else {
		response.writeHead(420, {'Content-Type': 'text/plain'});
		response.end();
	}
}
// helper subfunctions
function insertRequest(request) {
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('requests', function(err, col) {
			// console.log(err);
			col.insert(request, function(err, inserted) {
				if (err) {
					// TODO: setup error log in db
				}
				db.close();
			});
		});
	});
}