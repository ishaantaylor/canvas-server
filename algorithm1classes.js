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
    	console.log("x:" + x + ", y:" + y);
    	return {x : x,
    			y : y,
    			getMajor : function(piece) {
    				if(piece.getMajor()) {
    					return this.y;
    				} else {
    					return this.x;
    				}
    			}, 
    			getMinor : function(piece) {
    				if(piece.getMajor()){
    					return this.x;
    				} else {
    					return this.y;
    				}
    			}
    	};
    };
    this.getMiddle = function(dir) {
    	if(dir === "U") {
    		return this.getPointObject(this.left + (this.right - this.left)/2.0, this.top);
    	} else if(dir === "L") {
    		return this.getPointObject(this.left, this.top + (this.bottom - this.top)/2.0);
    	} else if(dir === "B") {
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
    	this.x	    = aUser.short_arm;
    } else {
    	this.y 	= aUser.short_arm;
    	this.x 	= aUser.long_arm;
    }
    this.getSize    = function(horizontal) {
            if (horizontal)
                return this.y;
            else
                return this.x;
            };
}

function Piece(rUser, dir, align, index) {
    this.user       = rUser;
    this.userIndex  = rUser.index;
    this.pieceIndex = index;
    this.dir 		= dir;
    this.align 		= align;
    this.x          = 0;
    this.y          = 0;
    this.getSizeOf  = this.user.getSize;
    
    this.getTop 	= function() {
    	return this.y;
    };
    this.getBottom  = function() {
    	return this.y + this.getSizeOf(true);
    };
    this.getLeft    = function() {
    	return this.x;
    };
    this.getRight   = function() {
    	return this.x + this.getSizeOf(false);
    };

    this.getMajor  = function() {
    	//If vertically invariant
    	if (this.dir === "U" || this.dir === "D") {
    		return false;
    	//Else horizontally invariant
    	} else {
    		return true;
    	}
    };
    this.getMajorSize	= function() {
    	return this.getSizeOf(this.getMajor());
    };
    this.getMinorSize   = function() {
    	return this.getSizeOf(!this.getMajor());
    };
    this.setMajor  = function(value) {
    	if(this.getMajor()){
    		this.y = value;
    	} else {
    		this.x = value;
    	}
    };
    this.setMinor  = function(value) {
    	if(this.getMajor()) {
    		this.x = value;
    	} else {
    		this.y = value;
    	}
    };
}
function PieceArray(scriptList, users) {
	
    this.scripts = [];
	for (var i = 0; i < scriptList.length; i++) {
	    var pieces = scriptList[i].split(",");
	    //var dUser = parseInt(pieces[0]);
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