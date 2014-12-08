var classes = require('./algorithm1classes');

function calcPos(unmodifiedUsers, scripts, isPortrait) {
    var users       = createNormalizedUserObjects(unmodifiedUsers, isPortrait);
    var pos 		= new classes.Pos(users);
	console.log("SCRIPT " + scripts);
	var s = new classes.PieceArray(scripts, users);
	pos.addPiece(s.getPiece(0));
	pos.updateCorners();
	for (var i = 0; i < s.scripts.length; i++) {
		var piece = s.getPiece(i);
		calcPosHelper(pos, piece);
		pos.addPiece(piece);
		pos.updateCorners();
	}
	return pos;
}

//Creates normalized user objects.
function createNormalizedUserObjects(usersList, isPortrait) {
	var users = [];

	for (var i = 0; i < usersList.length; i++) {
		var aUser = usersList[i];
		var u = 
		users.push(new classes.User(aUser, isPortrait, i));
	}

	return users;
}

function calcPosHelper(pos, piece){
//	console.log(JSON.stringify(piece, 0, 4));
	if(piece.dir === "U" || piece.dir === "L"){
		piece.setMajor(corner.getMajor(piece) - piece.getMajorSize());
	} else {
		piece.setMajor(corner.getMajor(piece));
	}
	if(piece.align !== "m") {
		var corner = pos.getCornerObject(piece.dir, piece.align);
	//If the piece is to be 'near' the variant axis:
		if(piece.align === "f") {
			piece.setMinor(corner.getMinor(piece) - piece.getMinor());
		} else {
			piece.setMinor(corner.getMinor(piece))
		}
	}else {
		var midpoint = pos.getMiddle(piece.dir).getMinor(piece);
		var distanceFromMidpointMinor = midpoint - piece.getMinorSize() / 2.0;
		piece.setMinor(distanceFromMidpointMinor);
	}
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
	+ getNextUser(data) + ","
	+ data.next_direction + "," 
	+ data.next_align;
}

function isCanvasActive(data) {
	return !(data.current_turn > data.max_turns);
}

exports.getPositionJSON = 	calcPos;
exports.nextUser 		=	getNextUser;
exports.nextDirection 	=	getNextDirection;
exports.nextAlign 		= 	getNextAlign;
exports.nextScript 		=	getNextScript;
exports.isGameActive 	= 	isCanvasActive;