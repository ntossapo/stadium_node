var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var MongoClient = require('mongodb').MongoClient
//, assert = require('assert');

//var mongo = require('./mongo');
var config = require('./config');

//var url = 'mongodb://localhost:27017/stadium';
var port = 9990;



io.on('connection', function(socket){
	console.log('connected');
	socket.on('notification_center', function(msg){
		console.log(msg)
		var jsonNoti = JSON.parse(msg);
		io.emit(jsonNoti.toUser, msg);
		console.log(jsonNoti.toUser);		
	});
});

http.listen(port, function(){
	console.log("server at port " + port);
});
