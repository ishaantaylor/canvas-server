var MongoClient = require('mongodb').MongoClient;

function openUsersDB(res, data, database_ip) {
	MongoClient.connect(database_ip, function(err, db) {
		db.collection('users', function(err, users) {
			switch(data.event) {
				case "login":
					login(res, data, users, db);
					break;
				case "register": 
					register(res, data, users, db);
					break;
			}
		});
	});
}
function loginUser(res, data, users, db) {
	users.find({
		user_id 	: data.user_id,
		password	: data.password
	}).toArray(function(err, docs) {
			if (docs.length == 0)
				res.writeHead(401, {'Content-Type':'text/plain'});
			else if (!err)
				res.writeHead(200, {'Content-Type':'text/plain'});	
			res.end(); 
			users.update(
				query,
				{$set: {
					short_arm 	: data.short_arm, 
					long_arm	: data.long_arm
						}
				} , 
				function(err){
					db.close();
			});
		});
}
function insertUser(res, data, users, db) {
	users.insert(
		data, 
		function(err, inserted){
			if (!err)
				res.writeHead(201, {'Content-Type':'text/plain'});
			else 
				res.writeHead(418, {'Content-Type':'text/plain'});
			res.end();
			db.close();
		});
}

exports.open 	= openUsersDB;