var jade = require('jade'),
	fs = require('fs-extra'),
	MongoClient = require('mongodb').MongoClient,
	algorithm1 = require('./positionAlgorithm1'),
	canvasesExtra = require('./canvasesHandlers');


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

//Get current working directory of server and append the images location to it.
var hardString = process.cwd() + "/images";

/* Calls the 'algorithm' to get position for each users canvas based on the script of the canvas.  */
function calculateCanvasImagePositions(response, canvas) {
	// BEGIN CALLBACK //
	//Get the positions for each user.
	var pos 		= algorithm1.getPositionJSON(canvas.userInfo, canvas.script, canvas.portrait);
	console.log("Positions determined:::\n\t" + JSON.stringify(pos));
	//Create the html file using jade. If you didn't make the file indicated in the arguments, then do not touch this.
	var html  		= jade.renderFile('canvas.jade', {
		"base"		: "/" + canvas.title + "_" + canvas.author, 
		"posArray" 	: pos.arr,
		"rotation" 	: (canvas.portrait ? 0 : 270),
		"pretty"	: true
	});

	//Write to file system.
	fs.writeFileSync(canvasesExtra.getCanvasFolder(canvas) + "/image.html", html);

	//Respond as successful.
	response.write(html);
	response.writeHead(200, {'Content-Type':'application/json'});
	response.end(); 
}


exports.create    		= calculateCanvasImagePositions;