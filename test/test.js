var supertest 	= require('supertest'),
	request 	= require('superagent'),
	should 		= require('chai').should(),
	server 		= supertest('http://129.22.50.175:8080');

describe('User Events', function() {
	describe('POST event:"login"', function() {
		var ok 		= 'should return 200 OK when '
		var not_ok 	= 'should return 401 UNAUTHORIZED when ';
		var body = {
						"event" : "login",
						"db" : "users",
						"body" : {
							"user_id" : "ishaant",
							"password" : "pwd"
						}
					};
		it(ok + 'user has a correct username and password combination', function() {
			server
				.post('')
				.send(body)
				.expect(200)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'has incorrent credential combination', function () {
			body.user_id = "ishaa";
			server
				.post('')
				.send(body)
				.expect(401)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'does NOT enter a password', function() {
			body.password = "none";
			server
				.post('')
				.send(body)
				.expect(401)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'does NOT enter a username', function() {
			body.user_id = "";
			server
				.post('')
				.send(body)
				.expect(401)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});

		it(not_ok + 'does NOT enter a password', function() {
			body.password = "";
			server
				.post('')
				.send(body)
				.expect(401)
				.end(function (err, response) {
					if (err) return done(err);
				});
		});
	});
});