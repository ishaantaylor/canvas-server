function calcPos(users, script) {
	var intialUserName = script[0].split(",")[0];
	var pos = {}; pos.horizontal = {}; pos.vertical = {};
	console.log(intialUserName);
	console.log(users);
	console.log(users[intialUserName]);
	pos.horizontal.size = users[intialUserName].horizontal;
	pos.vertical.size = users[intialUserName].vertical;
	pos.vertical.off = 0;
	pos.horizontal.off = 0;
	pos[0] = {};
	pos[0].vertical = 0;
	pos[0].horizontal = 0;
	pos[0].user = users[intialUserName];
	for (var i = 1; i < script.length; i++) {
		pos[i] = {};
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

exports.getPositionJSON = calcPos;