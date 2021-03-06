var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var MongoClient = require('mongodb').MongoClient
//, assert = require('assert');
var mysql = require('mysql');
var moment = require('moment');
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
					if(result.length != 0 && status[userLocation.user] == null) {
						var stadium = [];
						for (var i = 0; i < result.length; i++) {
							client.emit('bwnproc', JSON.stringify({stadiumId: result[i].id, act:"+"}));
							stadium.push(result[i].id);
							console.log('send bwnproc ' + result[i].id);
						}
						status[userLocation.user] = {data:stadium};
						console.log("user in" + status[userLocation.user].data);
					}else if(result.length == 0 && status[userLocation.user]!= null){
						if(status[userLocation.user] != null){
							var data = status[userLocation.user].data;
							for(var i = 0 ; i < data.length ; i++){
								client.emit('bwnproc', JSON.stringify({stadiumId: data[i], act:"-"}));
							}
							status[userLocation.user] = null;
							console.log('user out');
						}
					}
				});

				isUserCheckin(userLocation, function(err, result){
					console.log('[try to checkin]');
					console.log(result);
					if(result.length >= 1){
						for(var i = 0 ; i < result.length ; i ++) {
							var userDate = moment(userLocation.date, "YYYY-MM-DD HH:mm:ss");
							var reserveDate = moment(result[i].date);
							var time_from = result[i].time_from.split(":");
							reserveDate.hour(time_from[0]);
							reserveDate.minute(time_from[1]);
							var minuteDiff = userDate.diff(reserveDate, 'minute');
							console.log(userDate.toString() + " " + reserveDate.toString());
							//console.log ('minute diff = ' + minuteDiff);
							if (minuteDiff < 30){
								checkInReserve(result[i].id);
								console.log('auto checkin');
							}
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

function isUserCheckin(userLocation, callback){
	connection.query("select reserves.* from reserves, stadiums, fields " +
		"where sqrt(pow(stadiums.latitude - ?, 2) + pow(stadiums.longitude - ?, 2)) < 0.0006 and " +
		"stadiums.id = fields.stadium_id and " +
		"fields.id = reserves.field_id and " +
		"fields.id = reserves.field_id and " +
		"reserves.isCheckIn = 0 and " + 
		"reserves.facebook_id = ?", [userLocation.lat, userLocation.lng, userLocation.user], callback);
}

function checkInReserve(reserveId){
	connection.query("update reserves set isCheckIn = 1 where reserves.id = ?", [reserveId], function(err, result){});
}

http.listen(port, function(){
	console.log("server at port " + port);
});
