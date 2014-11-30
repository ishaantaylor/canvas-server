var MongoClient = require('mongodb').MongoClient,
	image 		= require('./imageCreator');

function openCanvasesDB(response, payload, database_ip) {
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('canvases', function(err, canvases) {
			switch (payload.event) {
				case "insert":
					insertCanvas(response, payload.body, canvases, db);
					break; 		
				case "update":
					updateCanvas(response, payload.body, canvases, db);
					break;
				case "query":
					queryCanvas(response, payload.body, canvases, db);
					break;
				case "generate":
					image.create(database_ip, response, payload.body, canvases, db);
					break;
				default:
					response.writeHead(422, {'Content-Type':'text/plain'});
					response.end();  // "Unknown event directive", {'Content-Type':'text/plain'}
					break;
			}
		});
	});
}

// TODO: figure out if we are using only one method of inserting canvas with indices and then stitching them or updating an entire canvas
// supported
function insertCanvas(response, payload, canvases, db) {
	console.log(payload);
	payload.script = [];
	payload.image_data = [];
	payload.active = true;
	canvases.insert(payload, function(err, inserted) {
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
}
// supported
function updateCanvas(response, payload, canvases, db) {
	//console.log("payload: " + JSON.stringify(payload, 0, 4));
	var query = { 	
		title 	: payload.title, 
		author 	: payload.author 
	};
	var nextScript = "" + payload.current_user + "," 
						+ payload.current_direction + "," 
						+ payload.current_align;
	payload.users.push(payload.current_user);
	console.log("AFTER PUSH " + payload.users);
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
	console.log("UPDATE STATEMENT : " + updateStatement);
	//console.log(" query: " + JSON.stringify(query, 0, 4));
	// TODO: validate query
	// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
	canvases.update(query, updateStatement, function(err) {
		if (!err) {
			response.writeHead(200, {'Content-Type':'text/plain'});
		} else {
			response.writeHead(404, {'Content-Type':'text/plain'});
			console.log(err);
		}

		response.end(); 
		db.close();
	});
}
// not yet supported
//// my ass it isn't
function queryCanvas(response, payload, canvases, db) {
	var query = 		payload.query;
	var projection =	payload.projection;
	
	// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
	canvases.find(query, projection).toArray(function(err, docs) {
		// console.log(docs.length);
		// c = docs.length;
		response.writeHead(200, {'Content-Type':'application/json'});
		response.write(JSON.stringify(docs, 0, 4));
		
		response.end(); 
		db.close();
	});
}

exports.open = openCanvasesDB;

