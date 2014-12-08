var MongoClient = require('mongodb').MongoClient,
	image 		= require('./imageCreator'),
	usersDb 	= require('./usersHandlers'),
	gameLogic	= require('./positionAlgorithm1'),
	fs 			= require('fs-extra');

//Get the current working directory of the server. 
var hardString = process.cwd() + "/images";

/**	Opens connection to canvas DB.
Passes the connection to the method with the matching event as indicated in the request's payload.*/
function openCanvasesDB(response, payload, database_ip) {
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('canvases', function(err, canvases) {
			//Attach ip address for DB to db object.
			//TODO: Might already be a way to get IP from db object. Read later in Node docs.
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
				case "insert_favorite":
					insertFavorite(response, payload, canvases, db);
					break;
				default:
					response.writeHead(422, {'Content-Type':'text/plain'});
			response.end();  // "Unknown event directive", {'Content-Type':'text/plain'}
			break;
			}
		});
	});
}

/* Inserts a canvas with the request's payload as the object to be passed in. TODO: Validate that it is a valid canvas to be inserted, aka the neccessary fields are there.*/ 
function insertCanvas(response, payload, canvases, db) {
	if (isValidBaseCanvas(payload)) {
		//Add fields that client app does not supply in the payload (at least shouldn't, throw error if it does).
		payload.script 		= ["0,0,I,i"];
		payload.image_data 	= [];
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
	} else {
		response.writeHead(418, {'Content-Type':'text/plain'});
		response.write("Invalid canvas JSON!");
		console.log(err);
	}
}

function updateCanvas(response, payload, canvases, db) {
	if (isValidBaseCanvas(payload)) { 
		//Create primary key for update.
		var querie = {title 	: payload.title, author 	: payload.author };

		var active = undefined,
		nextScript,
		nextUser,
		nextDirection,
		nextAlign,
		nextTurn,
		lastTurn;
		try {
			//Initialize as if game is still playing.
			//Implementing game logic as its own module.
			active 			= gameLogic.isGameActive(payload);
			nextScript 		= gameLogic.nextScript(payload);
			nextUser 		= gameLogic.nextUser(payload);
			nextDirection 	= gameLogic.nextDirection(payload);
			nextAlign 		= gameLogic.nextAlign(payload);
			nextTurn 		= payload.current_turn + 1;
			lastTurn 		= (payload.current_turn + 1) === payload.max_turns;
		} catch (error) {
			// if theres an error in gameLogic, game shuts down
			console.log("gameLogic error: " + error);
			active = false;
		}

		//Base update statement.
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

		//Alter variables and update if game is done.
		if (lastTurn || !active) {
			nextUser 		= 0;
			nextDirection 	= "fin";
			nextAlign 		= "fin";
			nextTurn 		= payload.max_turns + 1;
		}
		if (lastTurn) {
			updateStatement = {
					$push: {
						image_data : payload.image_data
					},
					$set : {
							current_user		: nextUser,
							current_direction 	: nextDirection,
							current_align		: nextAlign,
							current_turn		: nextTurn,
							active 				: active,
							next_direction 		: "",
							next_align 			: ""
					}
			};
		} else if (!active) {
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
			};
		}
		//Finds the document in question (canvas record) and updates it. Returns the updated canvas record. 
		canvases.findAndModify(querie, [['title', 1]], updateStatement, {'new':true} ,function(err, updatedCanvas) {
			//If no error and the game is still on:
			if (!err && updatedCanvas.active) {
				//Should hold off on this until the creation is confirmed.
				response.writeHead(200, {'Content-Type':'text/plain'});

				//Get the image file name.
				var imageFileName = getImageFilename(updatedCanvas, payload.current_turn);
				//Check if the file already exists.
				fs.exists(imageFileName, function(exists) {
					//If the file does not exist:
					if (!exists) {

						//Write the encoded image to the file system. Decodes the base64 encoding into a png.
						fs.writeFileSync(imageFileName, new Buffer(payload.image_data, "base64"));

						//Prepare the creation of the HTML canvas by getting all user's data associated with this canvas (except for password).
						usersDb.connect(db.IpAddress, function(uDb, users){
							users.find({user_id : {$in : updatedCanvas.users}}, {user_id:1, short_arm:1, long_arm:1}).toArray(function(err,uDocs) {
								//Attach full user data to the canvas.
								updatedCanvas.usersInfo = uDocs;
								//No need for user database at this point. Needed it only momentarily.
								uDb.close();
								//Send the response and canvas to the image algorithms.
								image.create(response, updatedCanvas);
							});
						});
						//Close the canvas db (no need for it in the callback above). 
						db.close();
					} else {
						//TODO Resource already exists
						response.writeHead(404, {'Content-Type':'text/plain'});
						response.end(); 
						db.close();
					}	
				});
			} else {
				if (err) {
					response.writeHead(404, {'Content-Type':'text/plain'});
					console.log(err);
				} else {
					response.writeHead(213, {'Content-Type':'text/plain'});
				}

				response.end(); 
				db.close();
			}
		});
	} else {
		//TODO: Report an error if canvas is invalid.
	}
}

/* Queries the canvas db and returns the results. TODO: Switch to a stream instead of an array. See below. */
function queryCanvas(response, payload, canvases, db) {
	//Query and projection are determined by the requesting client.
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

/* Inserts user into favorites field in canvas */
function insertFavorite(response, payload, canvases, db) {
	var user = payload.user_info['user_id'];

	// build query
	var query = payload.body['query'];
	var projection = {
		image_data:0,
		_id:0
	}

	// add user to favorites
	canvases.find(query, projection).toArray(function(err, docs) {
		// TODO: check if user already exists in favorites
		var temp_docs = [];
		
		// get current favorites
		if (err) {
			response.writeHead(404, {'Content-type':'text/plain'});
			response.end();
			db.close();
		} else {
			// add user to favorites
			for (var i = 0; i < docs.length; i++) {
				docs[i].favorites.push(user);
				// store this new list
				temp_docs[i] = docs[i];
			}			
		}

		// check if author's canvas can have favorites
		var error;
		try {
			if (temp_dpcs[0].favorites)
				error = false;
		} catch (e) {
			error = true;
		}
		
		// add this new list to favorites
		if (temp_docs.length = 1 && !error) {
			canvases.update(query, 
				{
					$set: {
						favorites: temp_docs[0].favorites
					}
				}, {w: 1, multi:true},
				function(err) {
					if (err) {
						console.log("error updating: " + err);
						response.writeHead(400, {'Content-type':'text/plain'});
						response.end();
						db.close();
					} else {
						response.writeHead(200, {'Content-type':'text/plain'});
						response.end();

						console.log("check if worked");
					}
				});
		} else if (temp_docs.length > 1) {
			console.log("multiple canvases with same query result");
			response.writeHead(409, {'Content-type':'text/plain'});
			response.end();
			db.close();
		} else {
			response.writeHead(404, {'Content-type':'text/plain'});
			response.end();
			db.close();
		}
	});
}

/* Gets the HTML file associated with this canvas. Possibly not needed anymore. */
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

/* Implement at a later time. Validates the canvas that is passed in. */
function isValidBaseCanvas(canvas){
	return true;
}

/* Gets the pathname for the image of the specified canvas and number. */
function getImageFilename(canvas, image_number) {
	return getCanvasFolder(canvas) + "/" + image_number + ".png";
}
/* Gets the folder name of the canvas and its images. */
function getCanvasFolder(canvas) {
	return hardString + "/" + canvas.title + "_" + canvas.author;
}

exports.open = openCanvasesDB;
exports.getImageFilename = getImageFilename;
exports.getCanvasFolder = getCanvasFolder;