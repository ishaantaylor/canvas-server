var classes = require('./algorithm1classes');

function calcPos(unmodifiedUsers, scripts, isPortrait, canvas) {
	var sortedUsers = [];
	for (var i = 0; i < canvas.users.length; i++) {
		for (var j = 0; j < unmodifiedUsers.length; j++) {
			if(canvas.users[i] === unmodifiedUsers[j].user_id) {
				sortedUsers.push(unmodifiedUsers[j]);
			}
		}
	}

	var bound = 0;
	if(canvas.current_turn < canvas.max_turns) {
		bound = scripts.length - 1;
	} else {
		bound = scripts.length;
	}
    var users       = createNormalizedUserObjects(sortedUsers, isPortrait);
    var pos 		= new classes.Pos(users);
	var s = new classes.PieceArray(scripts, users);
	pos.addPiece(s.getPiece(0));
	pos.updateCorners();
	for (var i = 1; i < bound; i++) {
		var piece = s.getPiece(i);
		calcPosHelper(pos, piece);
		pos.addPiece(piece);
		pos.updateCorners();
	}
	return pos;
}

function testPos(unmodifiedUsers, scrappydo, isPortrait, canvas) {
	var sortedUsers = [{user_id : 'box1',long_arm: 100,short_arm: 50}, {user_id : 'box2',long_arm: 100,short_arm:50}, {user_id : 'box3',long_arm: 200,short_arm:100}];
	var scripts = ["0,0,I,i", "0,1,U,m", "1,2,U,m"];
    var users       = createNormalizedUserObjects(sortedUsers, true);
    var s = new classes.PieceArray(scripts, users);
    var test0 = s.getPiece(1);
    console.log("piece 1 : \n" + JSON.stringify(test0, 0, 4));
    console.log("Testing major function : Is left/right coordinate still? : " + test0.is_LEFT_COORDINATE_STILL());
    console.log("\t" + " : " + test0.getStaticSideSize() + " : now getting minor size : " + test0.getMovingSideSize());
    console.log("\t\t" + " : " + test0.setStaticSideCoord(50) + " : now setting minor coords : " + test0.setMovingSideCoord(100));
    console.log("\t\t" + " : " + test0.y + " : now getting minor coords : " + test0.x);
    var pos = new classes.Pos(users);
	pos.addPiece(s.getPiece(0));
	pos.updateCorners();
	for (var i = 1; i < scripts.length; i++) {
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
	var corner = pos.getCornerObject(piece.dir, piece.align);
	if (piece.dir === "U" || piece.dir === "L") {
		piece.setStaticSideCoord(corner.getStaticSide(piece) - piece.getStaticSideSize());
	} else {
		piece.setStaticSideCoord(corner.getStaticSide(piece));
	}
	if (piece.align !== "m") {
	//If the piece is to be 'near' the variant axis:
		if (piece.align === "f") {
			piece.setMovingSideCoord(corner.getMovingSide(piece) - piece.getMovingSideCoord());
		} else {
			piece.setMovingSideCoord(corner.getMovingSide(piece));
		}
	} else {
		var midpoint = corner.getMovingSide(piece);
		var distanceFromMidpointMinor = midpoint - (piece.getMovingSideSize() / 2.0);
		piece.setMovingSideCoord(distanceFromMidpointMinor);
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
	return !(data.current_turn + 1 > data.max_turns);
}

exports.getPositionJSON = 	calcPos;
exports.nextUser 		=	getNextUser;
exports.nextDirection 	=	getNextDirection;
exports.nextAlign 		= 	getNextAlign;
exports.nextScript 		=	getNextScript;
exports.isGameActive 	= 	isCanvasActive;