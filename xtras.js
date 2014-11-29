var MongoClient = require('mongodb').MongoClient,
	fs 			= require('fs'),
	jade 		= require('jade');

function createNormalizedUserObjects(usersList, isPortrait) {
	var users = {};
	for (var i = 0; i < usersList.length; i++) {
		users[usersList[i].user_id] = {"vertical" : 0, "horizontal" : 0};
		if(isPortrait){
			users[i].vertical = usersList[i].long_arm;
			users[i].horizontal = usersList[i].short_arm;
		} else {
			users[i].vertical = usersList[i].short_arm;
			users[i].horizontal = usersList[i].long_arm;
		}
	}
	return users;
}

function calcPos(users, script) {
	var pos = {};
	pos.horizontal.size = users[0].horizontal;
	pos.vertical.size = users[0].vertical;
	pos.vertical.off = 0;
	pos.horizontal.off = 0;
	
	pos[0].vertical = 0;
	pos[0].horizontal = 0;
	pos[0].user = users[script[0].split(" ")[0]];
	for (var i = 0; i < script.length; i++) {
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