var jade = require('jade'),
	fs = require('fs'),
	MongoClient = require('mongodb').MongoClient,
	algorithm1 = require('./positionAlgorithm1');



function prepareCanvasForCreation(database_ip, response, payload, canvases, db) {
	//TODO:: Make this a call to fs for current working directory (cwd).
	var canvasFolder = payload.title + "_" + payload.author;
	// var hardString = "/home/thugz/Documents/EECS/canvas-server/images/";
	var hardString = process.cwd() + "/images";
	var hardPath =  hardString + "/" + canvasFolder;
	var query = {
		title 	: payload.title,
		author 	: payload.author			
	};
	console.log("In prepare ::: " + query);

	// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
	canvases.find(query).toArray(function(err, docs) {
		var users = docs[0].users;
		users.push(docs[0].current_user)
		var images = docs[0].image_data;
		var relativePaths = [];
		makeDirectory(hardPath);


		for (var i = 0; i < images.length; i++) {
			var relativeFile = "_" + i + ".png";
			var hardFile = hardPath + "/" + relativeFile;
			relativePaths.push(relativeFile);
			makeFile(hardFile, images[i], true);
		}

		calculateCanvasImagePositions(database_ip, response, users, docs[0].portrait, docs[0].script, relativePaths, hardPath);

		db.close();
	});
		
}

function calculateCanvasImagePositions(database_ip, response, users, isPortrait, script, filenames, folder){
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('users', function(err, col) {
			col.find(
				{user_id : 
					{ $in : users }
				}).toArray(function(err, docs) {
					if(err) {
						console.log(err);
						response.writeHead(200, {'Content-Type':'application/json'});
						response.write(JSON.stringify(docs, 0, 4));
					} else {
						// BEGIN CALLBACK //
						var usersNormed = createNormalizedUserObjects(docs, isPortrait);
						var pos 		= algorithm1.getPositionJSON(usersNormed, script);
						var posArray 	= convertPositionsToArray(pos, script, filenames);
						var html  		= jade.renderFile('canvas.jade', {
							"posArray" : posArray
						});
						makeFile(folder + "/" +"canvas.html", html, false);
						console.log("Here's the html \n\n\t\t" + html);
						
						response.writeHead(200, {'Content-Type':'application/json'});
						response.write(JSON.stringify(docs, 0, 4));
					}
					response.end(); 
					db.close();
			});
		});
	});
}

function convertPositionsToArray(pos, script, filenames) {
	var posArray = [];
	for(var i = 0; i < script.length; i++) {
		pos[i].filename = filenames[i];
		posArray.push(pos[i]);
	}
	return posArray;
}

function createNormalizedUserObjects(usersList, isPortrait) {
	console.log("Normalizing(usersList)" + usersList);
	console.log("Normalizing(isPortrait)" + isPortrait);
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

function makeDirectory(filePrefix) {
	fs.readdir(filePrefix, function(err, dirs) {
		if(err)
			fs.mkdir(filePrefix, function(err){ if(err) console.log("HAAAALP:::::"+err); });	
	});
}

function makeFile(hardFile, data, isBase64) {
	if(!(fs.existsSync(hardFile))){
		var text;
		if(isBase64)
			text = new Buffer(data, "base64");
		else
			text = data;
		fs.writeFile(hardFile, text, function(err) {
			if(err)
				console.log("HALP::::::::::::" + err);
		});
	}
}

exports.create = prepareCanvasForCreation;