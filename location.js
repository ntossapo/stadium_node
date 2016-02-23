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
var ioc = require('socket.io-client');
var client = ioc.connect('http://188.166.184.199:9991');

function update(facebookId, lat, lng, callback){
	connection.query('update user_location set latitude=?, longitude=? where facebook_id=?', [lat, lng, facebookId], callback);
}

function insert(facebookId, lat, lng, callback){
	connection.query('insert into user_location(facebook_id, latitude, longitude, last_used) values(?, ?, ?, ?)', [facebookId, lat, lng, new Date()], callback);
}

var callback = function(err, result){
}

var status = {};

client.once('connect', function(iocSocket){
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
				isNearByStadium(userLocation, function(err, result){
					if(result.length != 0) {
						var stadium = [];
						for (var i = 0; i < result.length; i++) {
							iocSocket.emit('bwnproc', JSON.stringify({stadiumId: result[i].id, act:"+"}));
							stadium.push(result[i].id);
						}
						status[userLocation.user] = {data:stadium};
					}else{
						if(status[userLocation.user] != null){
							var data = status[userLocation.user].data;
							for(var i = 0 ; i < data.length ; i++){
								iocSocket.emit('bwnproc', JSON.stringify({stadiumId: result[i].id, act:"-"}));
							}
							status[userLocation.user] = null;
						}
					}
				});
			});
		});
	});
});

function isNearByStadium(userLocation, callback){
	connection.query("select stadiums.* from stadiums " +
		"where sqrt(pow(stadiums.latitude - ?, 2) + pow(stadiums.longitude - ?, 2)) < 0.0006 " +
		"order by sqrt(pow(stadiums.latitude - ?, 2) + pow(stadiums.longitude - ?, 2)) asc", [userLocation.lat, userLocation.lng, userLocation.lat, userLocation.lng], callback);
}

http.listen(port, function(){
	console.log("server at port " + port);
});
