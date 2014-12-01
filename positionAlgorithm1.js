function calcPos(pos, users, script) {
	console.log("About to calculate positions \n" + JSON.stringify(pos, 0,4) + "\n\n\n\tAnd with users as \n" + JSON.stringify(users, 0,4));
	for (var i = 0; i < script.length; i++) {
		var userDirAlign = script[i].split(","),
			user_index 	= parseInt(userDirAlign[0]),
			dir 		= userDirAlign[1],
			align 		= userDirAlign[2];
		var major = "", minor = "";

		pos.arr.push({"u" : users[user_index]});
		pos.arr[i].user = users[user_index];
		if (dir == "U" || dir == "D") 	major = "y"; minor = "x";
		else  							major = "x"; minor = "y";
		calcPosHelper(pos, major, minor, 
			users[user_index], dir, align, i);
	}
	return pos;
}

function calcPosHelper(pos, major, minor, user, dir, align, i){
	if(align == "n")
		pos.arr[i][minor] = 0;
	else {
		var difference = 0;
		if(align == "m")
			difference = (pos[minor].size / 2) - (user[minor] / 2);
		else
			difference = pos[minor].size - user[minor];

		if(difference < 0) {
			pos.arr[i][minor] = 0;
			pos[minor].off += -difference;
		} 
		else 
			pos.arr[i][minor] = difference;
	}

	if (dir == "D" || dir == "R") 
		pos.arr[i][major] = pos[major].size;
	else {
		pos.arr[i][major] = 0;
		pos[major].off += user[major];
	}
	pos[major].size += user[major];
	if(user[minor] > pos[minor].size) 
		pos[minor].size = user[minor];


	for(var j = 0; j <= i - 1; j++){
		pos.arr[i][major] += pos[major].off;
		pos.arr[i][minor] += pos[minor].off;
	}
	pos[major].off = 0;
	pos[minor].off = 0;
}


function getNextUser(data) {
	return (data.current_user + 1) % data.users.length;
}

function getNextDirection(data) {
	return data.next_direction;
}

function getNextAlign(data) {
	return data.next_align;
}

function getNextScript(data) {
	return data.current_user + "," 
	+ data.next_direction + "," 
	+ data.next_align;
}

function isCanvasComplete(data) {
	return !((data.current_turn + 1) >= data.max_turns);
}

function initializePositionObject()/*()*/ {
	var pos = {}; 
	pos.x = {}; pos.x.size = 0; pos.x.off = 0;
	pos.y = {}; pos.y.size = 0; pos.y.off = 0;
	pos.arr = [];
	return pos;
}


exports.getPositionJSON = 	calcPos;
exports.nextUser 		=	getNextUser;
exports.nextDirection 	=	getNextDirection;
exports.nextAlign 		= 	getNextAlign;
exports.nextScript 		=	getNextScript;
exports.isGameActive 	= 	isCanvasComplete;
exports.initPos 		=   initializePositionObject;