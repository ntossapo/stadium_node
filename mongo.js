var insert = function(db, colName, data, callback){
	var col = db.collection(colName);
	col.insert(data, callback);
}

module.export = [
	"insert" : insert,
]
