var MongoClient = require('mongodb').MongoClient,
	image 		= require('./imageCreator'),
	usersDb 	= require('./usersHandlers'),
	gameLogic	= require('./positionAlgorithm1'),
	fs 			= require('fs-extra');

var hardString = process.cwd() + "/images";

function openCanvasesDB(response, payload, database_ip) {
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('canvases', function(err, canvases) {
			db.IpAddress = database_ip;
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

function insertCanvas(response, payload, canvases, db) {
	payload.script = [payload.author +",I,i"];
	payload.image_data = [];
	payload.active = true;

	canvases.insert(payload, function(err, inserted) {
		if (!err) {
			response.writeHead(201, {'Content-Type':'text/plain'});
			fs.mkdirsSync(getCanvasFolder(payload));
		} else {
			response.writeHead(418, {'Content-Type':'text/plain'});
			console.log(err);
		}
		response.end();
		db.close();
	});
}

function updateCanvas(response, payload, canvases, db) {
	var querie = { 	
		title 	: payload.title, 
		author 	: payload.author 
	};

	var active = undefined,
		nextScript,
		nextUser,
		nextDirection,
		nextAlign,
		nextTurn;
	
	try {
		active 			= gameLogic.isGameActive(payload);
		nextScript 		= gameLogic.nextScript(payload);
		nextUser 		= gameLogic.nextUser(payload);
		nextDirection 	= gameLogic.nextDirection(payload);
		nextAlign 		= gameLogic.nextAlign(payload);
		nextTurn 		= payload.current_turn + 1;
	} catch (error) {
		console.log("gameLogic error: " + error);
		active = false;
	}
	
	// if theres an error in gameLogic, game shuts down
	var updateStatement = {
			$push : {
				script 		: nextScript,
				image_data 	: payload.image_data
			}, 
			$set : {
				current_user		: nextUser,
				current_direction 	: nextDirection,
				current_align		: nextAlign,
				current_turn		: nextTurn,
				active 				: active
			}
		};
	if (!active) {
		nextUser 		= 0;
		nextDirection 	= "fin";
		nextAlign 		= "fin";
		nextTurn 		= payload.max_turns + 1;
		updateStatement = {
			$set : {
				current_user		: nextUser,
				current_direction 	: nextDirection,
				current_align		: nextAlign,
				current_turn		: nextTurn,
				active 				: active,
				next_direction 		: "",
				next_align 			: ""
			}
		}
	} 
	console.log("Updating with " + JSON.stringify(updateStatement));
	canvases.findAndModify(querie, [['title', 1]], updateStatement, {new:true} ,function(err, updatedCanvas) {
		if (!err && updatedCanvas.active) {
			response.writeHead(200, {'Content-Type':'text/plain'});			// TODO: end response somewhere?
			var imageFileName = getImageFilename(updatedCanvas, updatedCanvas.current_turn);
			fs.exists(imageFileName, function(exists) {
				if (!exists) {
					fs.writeFileSync(imageFileName, new Buffer(payload.image_data, "base64"));
					usersDb.connect(db.IpAddress, function(uDb, users){
						users.find({user_id : {$in : updatedCanvas.users}}, {user_id:1, short_arm:1, long_arm:1}).toArray(function(err,uDocs){
							updatedCanvas.usersInfo = uDocs;
							uDb.close();
							image.create(response, updatedCanvas);
						});
					});

					db.close();
				} else {
					//TODO Resource already exists
					response.writeHead(404, {'Content-Type':'text/plain'});
					response.end(); 
					db.close();
				}
			});
		} else {
			if(err){
				response.writeHead(404, {'Content-Type':'text/plain'});
				console.log(err);
			} else {
				response.writeHead(213, {'Content-Type':'text/plain'});
			}
			response.end(); 
			db.close();
		}
	});
}

function queryCanvas(response, payload, canvases, db) {
	var query 		= 	payload.query;
	var projection 	=	payload.projection;
	
	// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
	canvases.find(query, projection).toArray(function(err, docs) {
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
		fs.readFile(getCanvasFolder(payload) + "/image.html", function(err, fd) {
			if (err) {
				response.writeHead(404, {'Content-Type':'text/html'});
				console.log(err);
				response.end(); 
				db.close();
			} else {
				response.writeHead(200, {'Content-Type':'text/html'});	
				console.log("I GOT THIS HTML \n\t" + fd);	
				response.write(fd);
				response.end(); 
				db.close(); 
			}
		});
	});
}

function getImageFilename(canvas, image_number) {
	return getCanvasFolder(canvas) + "/" + image_number + ".png";
}
function getCanvasFolder(canvas) {
	return hardString + "/" + canvas.title + "_" + canvas.author;
}

exports.open = openCanvasesDB;
exports.getImageFilename = getImageFilename;
exports.getCanvasFolder = getCanvasFolder;