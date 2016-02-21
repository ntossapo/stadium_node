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
	socket.on('notification_center', function(msg){
		var jsonNoti = JSON.parse(msg);
		socket.emit(jsonNoti.toUser, jsonNoti.data);		
	});
});

http.listen(port, function(){
	console.log("server at port " + port);
});
