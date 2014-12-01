var jade = require('jade'),
fs = require('fs-extra'),
MongoClient = require('mongodb').MongoClient,
algorithm1 = require('./positionAlgorithm1');


var example = {
	srcPath: undefined,
	srcData: null,
	srcFormat: null,
	dstPath: undefined,
	quality: 0.8,
	format: 'jpg',
	progressive: false,
	width: 0,
	height: 0,
	strip: true,
	filter: 'Lagrange',
	sharpening: 0.2,
	customArgs: []
}

var hardString = process.cwd() + "/images";


function prepareCanvasForCreation(response, payload, canvases, db) {
	//TODO:: Make this a call to fs for current working directory (cwd).
	var canvasFolder = payload.title + "_" + payload.author;
	// var hardString = "/home/thugz/Documents/EECS/canvas-server/images/";
	var hardPath =  hardString + "/" + canvasFolder;
	var query = {
		title 	: payload.title,
		author 	: payload.author			
	};
	console.log("In prepare ::: " + query);

	// TODO: convert this functionality to stream it instead of creating array of theoretically huge, memory-eating size
	canvases.find(query, {image_data:0, _id:0}).toArray(function(err, docs) {
		calculateCanvasImagePositions( 
			response, 
			docs[0]);
		db.close();
	});

}

function calculateCanvasImagePositions(response, canvas) {
	// BEGIN CALLBACK //
	var pos 		= algorithm1.initPos();
	var users 		= createNormalizedUserObjects(canvas.users, canvas.portrait);
	var pos 		= algorithm1.getPositionJSON(pos, users, canvas.script);
	console.log("Positions determined : \n\n\t" + pos.arr);
	var html  		= jade.renderFile('canvas.jade', {
		"posArray" 	: pos.arr,
		"rotation" 	: (canvas.portrait ? 0 : 270),
		"pretty"	: true
	});
	fs.writeFileSync(hardString + "/" + canvas.title + "/" + (canvas.current_turn - 1) +".html", html);

	response.write(html);
	response.writeHead(200, {'Content-Type':'application/json'});
	response.end(); 
}

function createNormalizedUserObjects(usersList, isPortrait) {
	console.log("Normalizing(usersList)" + usersList);
	console.log("Normalizing(isPortrait)" + isPortrait);
	var users = [];

	for (var i = 0; i < usersList.length; i++) {
		var user = usersList[i];
		users.push({"y" : 0, "x" : 0});
		if(isPortrait){
			users[i].y 	= usersList[i].long_arm;
			users[i].x 	= usersList[i].short_arm;
		} else {
			users[i].y 	= usersList[i].short_arm;
			users[i].x 	= usersList[i].long_arm;
		}
		users[i].name = usersList[i].user_id;
	}
	return users;
}

function makeDirectory(filePrefix) {
	fs.readdir(filePrefix, function(err, dirs) {
		if(err)
			fs.mkdir(filePrefix, function(err){ if(err) console.log("HAAAALP:::::"+err); });	
	});
}

function makeImage(fileName, data){
	makeFile(fileName, data, true);
}

function makeTextFile(fileName, data){
	makeFile(fileName, data, false);
}

function makeFile(hardFile, data, isBase64) {
	if(isBase64) {
		var text = new Buffer(data, "base64");
		fs.exists(hardFile, function(exists){
			fs.writeFileSync(hardFile, text);
		});
	}
	else {
		fs.writeFile(hardFile, data, function(err) {if(err)console.log("HALP::::::::::::" + err);});
	}
}

exports.create    		= prepareCanvasForCreation;
exports.makeImage 		= makeImage;
exports.makeTextFile 	= makeTextFile;
exports.makeDirectory 	= makeDirectory;
exports.makeFile 		= makeFile;