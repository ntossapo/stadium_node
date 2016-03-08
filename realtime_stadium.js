/**
 * Created by benvo_000 on 23/2/2559.
 */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mysql = require('mysql');
var config = require('./config');

var port = 9991;

io.on('connect', function(socket){
    socket.on('bwnproc', function(msg){
        var data = JSON.parse(msg);
	console.log('data in');
	console.log(data);
	console.log('send');
        io.emit("stadium"+data.stadiumId, data.act);
    });
});

http.listen(port, function(){
    console.log("server at port " + port);
});
