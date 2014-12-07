var supertest 	= require('supertest'),
	request 	= require('superagent'),
	should 		= require('chai').should(),
	server 		= supertest('http://129.22.50.175:8080');

describe('User Events', function() {
	describe('POST event:"login"', function() {
		var ok 		= 'should return 200 OK when ';
		var not_ok 	= 'should return when ';
		
		// this is what the client app sends
		var body = {
						"event" : "login",
						"db" : "users",
						"body" : {
							"user_id": "ishaant",
							"password": "pwd",
							"long_arm": 1365,
							"short_arm": 1050
						},
						"user info": {
							"user_id": "ishaant",
							"password": "pwd",
							"long_arm": 1365,
							"short_arm": 1050
						}
					};
		//tests
		it(ok + 'a correct username and password combination', function() {
			runUserTest(200, body);
		});

		it(not_ok + 'has incorrent credential combination', function () {
			body.body.user_id = "ishaa";
			runUserTest(401, body);
			body.body.user_id = "ishaant";
		});

		it(not_ok + 'no password', function() {
			body.body.password = "";
			runUserTest(401, body);
			body.body.password = "pwd";
		});

		it(not_ok + 'no username', function() {
			body.body.user_id = "";
			runUserTest(401, body);
			body.body.user_id = "ishaant";
		});

		it(not_ok + 'no password nor username', function() {
			body.body.user_id = "";
			body.body.password = "";
			runUserTest(401, body);
			body.body.user_id = "ishaant";
			body.body.password = "pwd";
		});

		it(not_ok + 'null username', function() {
			body.body.user_id = null;
			runUserTest(400, body);
			body.body.user_id = "ishaant";

		});

		it(not_ok + 'null password', function() {
			body.body.password = null;
			runUserTest(400, body);
			body.body.password = "pwd";
		});

		it(not_ok + 'undefined username', function() {
			body.body.password = undefined;
			runUserTest(400, body);
			body.body.user_id = "ishaant";

		});

		it(not_ok + 'undefined password', function() {
			body.body.password = undefined;
			runUserTest(400, body);
			body.body.password = "pwd";
		});
	});

	function runUserTest(expected_repsonse_code, body) {
		server
			.post('')
			.send(body)
			.expect(expected_repsonse_code)
			.end(function (err, response) {
				if (err) return done(err);
			});
	}

	describe('POST event:"register"', function() {
		var ok 		= 'should return 201 CREATED when '
		var not_ok 	= 'should return 418 IM A TEAPOT when ';
		var body = {
						"event" : "register",
						"db" : "users",
						"body" : {
							"user_id" : "pshaantay",
							"password" : "pwd",
							"long_arm": 1365,
    						"short_arm": 1050
						}
					};
		it(ok + 'user registers with a valid username and password AND username does not already exist', function() {
			server
				.post('')
				.send(body)
				.expect(201)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'db has existing user', function () {
			body.body.user_id = "ishaant";
			server
				.post('')
				.send(body)
				.expect(418)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'does NOT enter a username', function() {
			body.body.user_id = "";
			server
				.post('')
				.send(body)
				.expect(418)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'does NOT enter a password', function() {
			body.body.password = "";
			server
				.post('')
				.send(body)
				.expect(418)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'missing both username and password', function() {
			body.body.user_id
			body.body.password = "";
			server
				.post('')
				.send(body)
				.expect(418)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});
	});
});