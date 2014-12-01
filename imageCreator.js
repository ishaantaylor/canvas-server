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


function prepareCanvasForCreation(response, canvas, db) {
	var canvasFolder = canvas.title + "_" + canvas.author;
	var hardPath 	 = hardString + "/" + canvasFolder;
	calculateCanvasImagePositions(response, canvas);
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
	fs.writeFileSync(hardString + "/" + canvas.title + "/" + "image.html", html);

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

exports.create    		= prepareCanvasForCreation;