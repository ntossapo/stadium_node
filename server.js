var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var MongoClient = require('mongodb').MongoClient
//, assert = require('assert');
var mysql = require('mysql');

//var mongo = require('./mongo');
var config = require('./config');

//var url = 'mongodb://localhost:27017/stadium';
var port = 3000;
var connection = mysql.createConnection(config.mysql);

function update(facebookId, lat, lng, callback){
	connection.query('update user_location set latitude=?, longitude=? where facebook_id=?', [lat, lng, facebookId], callback);
}

function insert(facebookId, lat, lng, callback){
	connection.query('insert into user_location(facebook_id, latitude, longitude) values(?, ?, ?)', [facebookId, lat, lng], callback);
}

var callback = function(err, result){
}


connection.connect();
io.on('connection', function(socket){
	socket.on('location', function(msg){
		console.log(msg);
		var userLocation = JSON.parse(msg);	
		connection.query('select count(id) as count from user_location where facebook_id = ?', [userLocation.user], function(err, result){
			if(result[0].count == 0){
				insert(userLocation.user, userLocation.lat, userLocation.lng, callback);
			}else{
				update(userLocation.user, userLocation.lat, userLocation.lng, callback);
			}
		});
		
	});
});

http.listen(port, function(){
	console.log("server at port " + port);
});
