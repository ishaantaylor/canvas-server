/**
 * New node file
 */
function Pos(users){ 
	this.x = {}; this.x.size = 0;
	this.y = {}; this.y.size = 0;
	this.users = users;
	this.pieces = [];
	this.UL = [0,0];
	this.DL = [0,0];
	this.UR = [0,0];
	this.DR = [0,0];
	this.left = 0;
	this.top = 0;
	this.right = 0;
	this.bottom = 0;
	
	this.addPiece = function(piece) {
		this.pieces.push(piece);
	};
	this.getUser = function(userIndex) {
		return this.users[userIndex];
	};
	this.getPiece = function(index) {
		return this.pieces[index];
	};
    
    this.updateCorners = function() {
    	var left = 0,
    		right = 0,
    		bottom = 0,
    		top = 0;
    	for(var i = 0; i < this.pieces.length; i++) {
    		var piece = this.getPiece(i);
    		if (piece.getLeft() < left){
    			left = piece.x;
    		} 
    		if (piece.getRight() > right) {
    			right = piece.getRight();
    		}
    		if (piece.getTop() < top) {
    			top = piece.getTop();
    		}
    		if (piece.getBottom() > bottom) {
    			bottom = piece.getBottom();
    		}
    	}
    	this.top = top;
    	this.bottom = bottom;
    	this.left = left;
    	this.right = right;
    };
    
    this.getCorner = function(dir, align) {
    	if(dir === "U" && align === "n" || dir === "L" && align === "n"){
    		return [this.left, this.top];
    	} else if(dir === "U" && align === "f" || dir === "R" && align === "n" ){
    		return [this.right, this.top];
    	} else if(dir === "D" && align === "n" || dir === "L" && align === "f") {
    		return [this.left, this.bottom];
    	} else if(dir === "D" && align === "f" || dir === "R" && align === "f") {
    		return [this.right, this.bottom];
    	} 
    	return null;
    };
    this.getCornerObject = function(dir, align) {
    	var corner = this.getCorner(dir, align);
    	if (corner === null) {
    		return this.getMiddle(dir);
    	} 
    	return this.getPointObject(corner[0], corner[1]);
    };
    
    this.getPointObject = function(x, y) {
    	var toReturn =  {
    			x : x,
    			y : y,
    			getStaticSide : function(piece) {
    				if(piece.is_LEFT_COORDINATE_STILL()) {
    					return this.x;
    				} else {
    					return this.y;
    				}
    			}, 
    			getMovingSide : function(piece) {
    				if(piece.is_LEFT_COORDINATE_STILL()){
    					return this.y;
    				} else {
    					return this.x;
    				}
    			}
    	};
    	console.log(JSON.stringify(toReturn, 0,4));
    	return toReturn;
    };
    this.getMiddle = function(dir) {
    	if(dir === "U") {
    		return this.getPointObject(this.left + (this.right - this.left)/2.0, this.top);
    	} else if(dir === "L") {
    		return this.getPointObject(this.left, this.top + (this.bottom - this.top)/2.0);
    	} else if(dir === "D") {
    		return this.getPointObject(this.left + (this.right - this.left)/2.0, this.bottom);
    	} else if(dir === "R") {
    		return this.getPointObject(this.right, this.top + (this.bottom - this.top)/2.0);
    	}
    };
    this.getWidth = function() {
    	return this.right - this.left;
    };
    this.getHeight = function() {
    	return this.bottom - this.top;
    };
	
}


function User(aUser, isPortrait, index) {
    this.isPortrait = isPortrait;
    this.name       = aUser.user_id;
    this.index      = index;
    if(isPortrait){
    	this.y 	= aUser.long_arm;
    	this.x	= aUser.short_arm;
    } else {
    	this.y 	= aUser.short_arm;
    	this.x 	= aUser.long_arm;
    }
}

function Piece(rUser, dir, align, index) {
    this.user       = rUser;
    this.userIndex  = rUser.index;
    this.pieceIndex = index;
    this.dir 		= dir;
    this.align 		= align;
    this.x          = 0;
    this.y          = 0;
    
    this.getTop 	= function() {
    	return this.y;
    };
    this.getBottom  = function() {
//		console.log("Piece BOTTOM : " + (this.y + this.user.y));

    	return this.y + this.user.y;
    };
    this.getLeft    = function() {
//		console.log("Piece LEFT : " + this.y);

    	return this.x;
    };
    this.getRight   = function() {
//		console.log("Piece RIGHT : " + (this.x + this.user.x));

    	return this.x + this.user.x;
    };
    
    this.is_LEFT_COORDINATE_STILL = function() {
    	return this.dir === "L" || this.dir === "R";
    };
    this.getStaticSideSize  = function() {
    	if(this.is_LEFT_COORDINATE_STILL()){
    		return this.user.x;
    	} else {
    		return this.user.y;
    	}
    };
    this.getMovingSideSize = function() {
    	if(this.is_LEFT_COORDINATE_STILL()){
    		return this.user.y;
    	} else {
    		return this.user.x;
    	}
    };
    this.setStaticSideCoord = function(value) {
    	if(this.is_LEFT_COORDINATE_STILL()){
    		this.x = value;
    	} else {
    		this.y = value;
    	}
    };
    this.setMovingSideCoord = function(value) {
    	if(this.is_LEFT_COORDINATE_STILL()) {
    		this.y = value;
    	} else {
    		this.x = value;
    	}
    };
}
function PieceArray(scriptList, users) {
	
    this.scripts = [];
	for (var i = 0; i < scriptList.length; i++) {
	    var pieces = scriptList[i].split(",");
	    var rUser = parseInt(pieces[1]);
	    var ss = new Piece(users[rUser], pieces[2], pieces[3], i);
	    this.scripts.push(ss);
	}
	this.getPiece = function(index)  {
		return this.scripts[index];
	};
}

exports.User = User;
exports.Piece = Piece;
exports.PieceArray = PieceArray;
exports.Pos = Pos;