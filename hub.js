
var http = require('http'),
	url = require('url'),
	qs = require('querystring'),
	exec = require('child_process').exec,
	Db = require('mongodb').Db,
	MongoClient = require('mongodb').MongoClient,
	ObjectID = require('mongodb').ObjectID,
	assert = require('assert');

var outward_ip = '127.0.0.1';
var outward_port = 1337;
/*
var outward_ip = '129.22.50.175';
var outward_port = 8080;
*/

// var sql_ip = '';

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
	var post_data = "";
	if (incoming_request.method != "POST") {
		our_response.writeHead(405, {'Content-Type' : 'text/plain'});
		our_response.end();
	} else if (incoming_request.url == '/') {
		response.writeHead(420, {'Content-Type': 'text/plain'});
		response.end();
	} else {
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
	}
	// handle each case - TODO: eventually change to switch-case
	/*
	if (incoming_request.method == 'GET') {
		handleGETrequest(incoming_request, our_response);
	} else */
}).listen(outward_port, outward_ip);

console.log('Server running at http://' + outward_ip + ":" + outward_port + '/');

// main flow subfunctions
function handlePOSTrequest(request, response, post_data) {
	// TODO: refactor this the make it flow.. first parse body, then decide where to route it 
	var payload = {};
	try {
		payload = JSON.parse(post_data);
	} catch (err) {
		console.log("Error: " + err);
		response.writeHead(422, {'Content-Type': 'text/plain'});
		response.end();
	}
	if (request.url == '/canvases') {
		proceedWithCanvasServerAction(request, response, payload);
	} else if (request.url == '/users') {
		proceedWithUserAction(request, response, payload);
	} else if (request.url == '/login') {
		login(request, response, payload);
	} else {
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

function proceedWithCanvasServerAction(request, response, payload) {
	var server_event = payload.event;
	// TODO: switch few if statements to switch-case
	switch (server_event) {
		case "insert_canvas":
			insert_canvas(request, response, payload);
			break;		
		case "update_canvas":
			update_canvas(request, response, payload);
			break;
		case "query":
			query(request, response, payload);
			break;
		default:
			response.writeHead(422, {'Content-Type':'text/plain'});
			response.end();  // "Unknown event directive", {'Content-Type':'text/plain'}
			break;
	}
}

function proceedWithUserAction(request, response, payload) {
	switch (payload.event) {
		case "register_user":
			register_user(request, response, payload);
			break;
		// TODO: decide which login uri to use
		case "login":
			login(request, response, payload);
			break;
		default:
			response.writeHead(422, {'Content-Type':'text/plain'});
			response.end();
	}
}

// TODO: figure out if we are using only one method of inserting canvas with indices and then stitching them or updating an entire canvas
// supported
function insert_canvas(request, response, payload) {
	console.log(payload);
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('canvases', function(err, col) {
			col.insert(payload, function(err, inserted) {
				console.log("inserted: " + inserted);
				if (!err) {
					response.writeHead(201, {'Content-Type':'text/plain'});
				} else {
					response.writeHead(418, {'Content-Type':'text/plain'});
					console.log(err);
				}
				
				response.end();
				db.close();
			});
		});
	});
}

// supported
function update_canvas(request, response, payload) {
	console.log("payload: " + JSON.stringify(payload, 0, 4));
	var query = payload.query;
	var value = payload.update;
	console.log(" query: " + JSON.stringify(query, 0, 4));
	// TODO: validate query
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('canvases', function(err, col) {
			// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
			col.update(query, value, function(err) {
				if (!err) {
					response.writeHead(200, {'Content-Type':'text/plain'});
				} else {
					response.writeHead(404, {'Content-Type':'text/plain'});
					console.log(err);
				}

				response.end(); 
				db.close();
			});
		});
	});
}

// supported
function register_user(request, response, payload) {
	// TODO: validate payload object such that it has both user_id and password fields
	// TODO: hash password
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('users', function(err, col) {
			// TODO: check if user exists already
			col.insert(payload, function(err, inserted) {
				if (!err)
					response.writeHead(201, {'Content-Type':'text/plain'});
				else 
					response.writeHead(418, {'Content-Type':'text/plain'});
				
				response.end();
				db.close();
			});
		});
	});
}

// supported
function login(request, response, payload) {
	// TODO: implement hashing here to check against hash in db
	MongoClient.connect(database_ip, function(err, db) {
		assert.equal(null, err);

		var user = payload['user_id'],
			pass = payload['password'],
			query = {user_id:user, password:pass};

		db.collection('users', function(err, col) {
			col.find(query).toArray(function(err, docs) {
				//console.log(docs.length);
				if (docs.length == 0)
					response.writeHead(401, {'Content-Type':'text/plain'});
				else if (!err)
					response.writeHead(200, {'Content-Type':'text/plain'});
				
				response.end(); 
				db.close();
			});
		});
	});
}

// not yet supported
function query(request, response, payload) {
	// TODO: change implementation to accept payload.query, payload.projection
	// query for canvases
	var query = payload.query;

	MongoClient.connect(database_ip, function(err, db) {
		assert.equal(null, err);
		db.collection('canvases', function(err, col) {
			// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
			col.find(query).toArray(function(err, docs) {
				// console.log(docs.length);
				// c = docs.length;
				response.writeHead(200, {'Content-Type':'application/json'});
				response.write(JSON.stringify(docs, 0, 4));
				
				response.end(); 
				db.close();
			});
		});
	});
}