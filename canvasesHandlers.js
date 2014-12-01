var MongoClient = require('mongodb').MongoClient,
	image 		= require('./imageCreator'),
	gameLogic	= require('./positionAlgorithm1'),
	fs 			= require('fs-extra');

var hardString = process.cwd() + "/images";

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
				case "get_image":
					getImage(response, payload.body, canvases, db);
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
	payload.users.unshift(payload.author);
	canvases.insert(payload, function(err, inserted) {
		console.log("inserted: " + inserted);
		if (!err) {
			response.writeHead(201, {'Content-Type':'text/plain'});
			fs.mkdirsSync(hardString + "/" + payload.title);
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
	var query = { 	
		title 	: payload.title, 
		author 	: payload.author 
	};
	console.log("AFTER PUSH " + payload.users);
	var active 			= gameLogic.isGameActive(payload),
		nextScript 		= gameLogic.nextScript(payload),
		nextUser 		= gameLogic.nextUser(payload),
		nextDirection 	= gameLogic.nextDirection(payload),
		nextAlign 		= gameLogic.nextAlign(payload),
		nextTurn 		= payload.current_turn + 1;
	if(!active) {
		nextScript 		= " , , ";
		nextUser 		= 0;
		nextDirection 	= " ";
		nextAlign 		= " ";
		nextTurn 		= payload.max_turns;
	}
	var updateStatement = {
		$push : {
			script : nextScript,
			image_data : payload.image_data
		}, 
		$set : {
			current_user		: nextUser,
			current_direction 	: nextDirection,
			current_align		: nextAlign,
			current_turn		: nextTurn,
			active 				: active
		}
	};
	
	console.log("UPDATE STATEMENT : " + JSON.stringify(updateStatement, 0, 4));
	//console.log(" query: " + JSON.stringify(query, 0, 4));
	// TODO: validate query
	// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
	canvases.update(query, updateStatement, function(err) {
		if (!err) {
			response.writeHead(200, {'Content-Type':'text/plain'});
			var imageFileName = hardString + "/" + payload.title + "/" + payload.current_turn + ".png";
			fs.exists(imageFileName, function(exists){
				if(!exists) {
					fs.writeFileSync(imageFileName, new Buffer(payload.image_data, "base64"));
					image.create(response, payload, canvases, db);

				} else {
					//TODO Resource already exists
					response.writeHead(404, {'Content-Type':'text/plain'});
					response.end(); 
					db.close();
				}

			});
		} else {
			response.writeHead(404, {'Content-Type':'text/plain'});
			console.log(err);
			response.end(); 
			db.close();
		}
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

function getImage(response, payload, canvases, db) {
	var query = { 	
		title 	: payload.title, 
		author 	: payload.author 
	};
	canvases.find(query, {image_data:0, _id:0}).toArray(function(err, docs) {
		fs.readFile(hardString + "/" + payload.title + "/" + docs[0].current_turn +".html", function(err, fd){
			response.writeHead(200, {'Content-Type':'application/json'});		
			response.write(fd);
			response.end(); 
			db.close();
		});

	});
}

exports.open = openCanvasesDB;

