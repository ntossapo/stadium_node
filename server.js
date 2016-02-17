var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
	socket.on('location', function(msg){
		console.log(msg);
	});
	
});

http.listen(33333, function(){
	console.log("server IP@33333");
})
