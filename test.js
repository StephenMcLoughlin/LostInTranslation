var chai = require('chai'), chaiHttp = require('chai-http');
chai.use(chaiHttp);
var assert = require('assert');
var app = require('./app');

var base_url = 'http://danu7.it.nuigalway.ie:8535/';

describe("Login Test", function() {
	describe("POST /users/login", function() {
		it("Returns loggedIn", function(done) {
			chai.request(app)
			.post('/users/login')
			.send({
				'email': 'test@test.com',
				'password': 'test'
			}).end(function(err, res) {
				if(err) console.log(err)
					assert.equal("loggedIn", res.body.success);
				done();
			})
		})

		it("Returns you are logged out", function(done) {
			chai.request(app)
			.post('/users/logout')
			.send({
				loggedIn: false	
			}).end(function(err, res) {
				if(err) console.log(err)
					assert.equal(200, res.statusCode);
				done();
			})
		})

		it("Returns username not found", function(done) {
			chai.request(app)
			.post('/users/login')
			.send({
				'email': 'test@test.co',
				'password': 'test'
			}).end(function(err, res) {
				if(err) console.log(err)
					assert.equal("Username not found", res.body.body);
				done();
			})
		})

		it("Returns Email or password does not match", function(done) {
			chai.request(app)
			.post('/users/login')
			.send({
				'email': 'test@test.com',
				'password': 'tes'
			}).end(function(err, res) {
				if(err) console.log(err)
					assert.equal("Email or password does not match", res.body.body);
				done();
			})
		})
		
	});
});

describe("Register Test", function() {
	describe("POST /users/register", function() {
		it("Returns Email already registered", function(done) {
			chai.request(app)
			.post('/users/register')
			.send({
				'email': 'test@test.com',
				'username': 'test',
				'password': 'test'
			}).end(function(err, res) {
				if(err) 
					assert.equal("Email already registered", res.body.body);
				done();
			})
		})

		it("Returns Username already taken", function(done) {
			chai.request(app)
			.post('/users/register')
			.send({
				'email': 'testing@test.com',
				'username': 'test',
				'password': 'test'
			}).end(function(err, res) {
				if(err) 
					assert.equal("Username already taken", res.body.body);
				done();
			})
		})

		it("Returns account created", function(done) {
			chai.request(app)
			.post('/users/register')
			.send({
				'email': 'testing@test.com',
				'username': 'testing',
				'password': 'testing'
			}).end(function(err, res) {
				if(err) 
					assert.equal("account created", res.body.success);
				done();
			})
		})

	});
});


describe("Unauthorized access Test", function() {
	describe('Unauthorized access GET /home', function() {
		it("Returns You are not logged in.", function(done) {
			chai.request(app)
			.get('/home')
			.end(function(err, res) {
				if(err) 
					assert.equal("You are not logged in.", res.body);
				done();
			})
		})
	});

describe('Unauthorized access PUT /incrementGamesPlayed', function() {
		it("Returns You are not logged in.", function(done) {
			chai.request(app)
			.put('/incrementGamesPlayed')
			.end(function(err, res) {
				if(err) 
					assert.equal("You are not logged in.", res.body);
				done();
			})
		})
	});
});



