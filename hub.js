
var http = require('http'),
url = require('url'),
qs = require('querystring'),
exec = require('child_process').exec,
Db = require('mongodb').Db,
MongoClient = require('mongodb').MongoClient,
ObjectID = require('mongodb').ObjectID,
assert = require('assert'),
fs = require('fs'),
jade = require('jade');
/*
var outward_ip = '127.0.0.1';
var outward_port = 1337;
*/ 
var outward_ip = '129.22.50.175';
var outward_port = 8080;
var location = '129.22.59.175:8080/home/thugz/images'
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
		our_response.writeHead(405, {'Content-Type' : 'text/plain'});
		our_response.end();
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
		case "create":
			getCanvasImage(request, response, payload);
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
	payload.script = [];
	payload.image_data = [];
	payload.active = true;
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
	var query = { 	title 	: payload.title, 
		author 	: payload.author 
	};
	var nextScript = "" + payload.current_user + "," 
	+ payload.current_direction + "," 
	+ payload.current_align;
	payload.users.push(payload.current_user);
	payload.active = !((payload.current_turn + 1) == payload.max_turns);

	var updateStatement = {
		$push : {
			script : nextScript,
			image_data : payload.image_data
		}, 
		$set : {
			current_user		: payload.users.pop(),
			current_direction 	: payload.next_direction,
			current_align		: payload.next_align,
			current_turn		: payload.current_turn + 1,
			users				: payload.users,
			active 				: payload.active
		}
	};
	console.log(" query: " + JSON.stringify(query, 0, 4));
	// TODO: validate query
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('canvases', function(err, col) {
			// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
			col.update(query, updateStatement, function(err) {
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
				col.update(query, {$set: {short_arm:payload.short_arm, long_arm:payload.long_arm}} , function(err){
					db.close();
				});
			});
		});
	});
}

// not yet supported
function query(request, response, payload) {
	// TODO: change implementation to accept payload.query, payload.projection
	// query for canvases
	

	MongoClient.connect(database_ip, function(err, db) {
		assert.equal(null, err);
		
		// get querystring from url
		var theURL = url.parse(request.url);
		var queryJSON = qs.parse(theURL.query);

		// query canvases
		var user = queryJSON['user_id'],
		activeFlag = queryJSON['active'];
		var query = {};
		// activeFlag determines if we search for active canvases or inactive.. in progress or completed
		if(activeFlag === null)
			query = {users:user};
		else
			query = {users:user, active:activeFlag};
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

function getCanvasImage(request, response, payload) {
	var filePrefix =   "/" + payload.title + "_" + payload.author +"/";
	MongoClient.connect(database_ip, function(err, db) {
		assert.equal(null, err);
		var query = {
			title 	: payload.title,
			author 	: payload.author			
		};
		db.collection('canvases', function(err, canvases) {
			// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
			canvases.find(query).toArray(function(err, docs) {
				var users = docs[0].users;
				var images = docs[0].image_data;
				var fileNames = [];
				fs.readdir("/home/thugz/images" + filePrefix, function(err, dirs) {
					if(err){
						fs.mkdir("/home/thugz/images" + filePrefix, 0666, function(err){});
					}
				});
				for (var i = 0; i < images.length; i++) {
					var file = location + filePrefix + "_" + i + ".png";
					fileNames.push(file);
					if(!(fs.existsSync("/home/thugz/images" + filePrefix + "_" + i + ".png"))){
						fs.writeFile(file, new Buffer(images[i], "base64"), function(err) {});
					}
				}
				createCanvasImage(docs[0], fileNames);

				response.writeHead(200, {'Content-Type':'application/json'});
				response.write(JSON.stringify(docs, 0, 4));

				response.end(); 
				db.close();
				
			});
		});
	});
}

function createNormalizedUserObjects(usersList, isPortrait) {
	console.log(usersList);
	console.log(isPortrait);
	var users = {};
	for (var i = 0; i < usersList.length; i++) {
		var userName = usersList[i].user_id;
		users[userName] = {"vertical" : 0, "horizontal" : 0};
		if(isPortrait){
			users[userName].vertical = usersList[i].long_arm;
			users[userName].horizontal = usersList[i].short_arm;
		} else {
			users[userName].vertical = usersList[i].short_arm;
			users[userName].horizontal = usersList[i].long_arm;
		}
	}
	return users;
}

function calcPos(users, script) {
	var intialUserName = script[0].split(",")[0];
	var pos = {}; pos.horizontal = {}; pos.vertical = {};
	console.log(intialUserName);
	console.log(users);
	console.log(users[intialUserName]);
	console.log(users.intialUserName);
	var key;
	for each (var variable in users) { 
		console.log(variable);
		console.log(users[variable]);
	}
	pos.horizontal.size = users[intialUserName].horizontal;
	pos.vertical.size = users[intialUserName].vertical;
	pos.vertical.off = 0;
	pos.horizontal.off = 0;
	
	pos[0].vertical = 0;
	pos[0].horizontal = 0;
	pos[0].user = users[intialUserName];
	for (var i = 1; i < script.length; i++) {
		var userDirAlign = script[i].split(" ");
		var major = "", minor = "";
		pos[i].user = users[userDirAlign[0]];
		if (userDirAlign[1] == "U" || userDirAlign[1] == "D") {
			major = "vertical"; minor = "horizontal";
		} else {
			major = "horizontal"; minor = "vertical";
		}	
		calcPosHelper(pos, major, minor, 
			users[userDirAlign[0]], userDirAlign[1], userDirAlign[2], i);
	}
	return pos;
}

function calcPosHelper(pos, major, minor, user, dir, align, i){
	if(align == "n")
		pos[i][minor] = 0;
	else {
		var difference = 0;
		if(align == "m")
			difference = (pos[minor].size / 2) - (user[minor] / 2);
		else
			difference = pos[minor].size - user[minor];

		if(difference < 0) {
			pos[i][minor] = 0;
			pos[minor].off += -difference;
		} 
		else 
			pos[i][minor] = difference;
	}

	if (dir == "D" || dir == "R") {
		pos[i][major] = pos[major].size;
	} else {
		pos[i][major] = 0;
		pos[major].off += user[major];
	}

	pos[major].size += user[major];
	if(user[minor] > pos[minor].size) 
		pos[minor].size = user[minor];
	updateCurrentPositions(pos, i);
}

function updateCurrentPositions(pos, size) {
	var offx = pos.horizontal.off;
	var offy = pos.vertical.off;
	for(var i = 0; i <= size; i++){
		pos[i].horizontal += offx;
		pos[i].vertical += offy;
	}
	pos.horizontal.off = 0;
	pos.vertical.off = 0;
}

function createCanvasImage(canvasRecord, filenames){
	MongoClient.connect(database_ip, function(err, db) {
		assert.equal(null, err);
		db.collection('users', function(err, col) {
			col.find(
				{user_id : 
					{ $in : canvasRecord.users }
				}
			).toArray(function(err, docs) {
				if(err)
					console.log(err);
				var users = createNormalizedUserObjects(docs, canvasRecord.portrait);
				var pos = calcPos(users, canvasRecord.script);
				var posArray = [];
				for(var i = 0; i < canvasRecord.script.length; i++) {
					pos[i].filename = filenames[i];
					posArray.push(pos[i]);
				}
				var html = jade.renderFile('canvas.jade', {
					"posArray" : posArray
				});

				fs.writeFile("home/thugs/images" + canvasRecord.title + "_" + payload.author + "/" + "canvas.html",
							html, function(err){});
				
				response.writeHead(200, {'Content-Type':'application/json'});
				response.write(JSON.stringify(docs, 0, 4));
				
				response.end(); 
				db.close();
			});
		});
	});
}