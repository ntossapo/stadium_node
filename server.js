var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

var mongo = require('./mongo');

var url = 'mongodb://localhost:27017/stadium';
var port = 3333;

MongoClient.connect(url, function(err, db){
	assert.equal(null, err);
	console.log('	[.]mongodb connected');

	io.on('connection', function(socket){

		socket.on('location', function(msg){
			mongo.insert(db, 'location', msg,
				function(err, result){
					assert.equal(null, err);
				});		
		});

	});

	db.close();
});

http.listen(port, function(){
	console.log("server at port " + port);
});
