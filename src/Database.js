/*
	db.js
*/

Database = {};

Database.setup = function(file, version, name, size, tables) {
  this._db = window.openDatabase(file, version, name, size);

  this._db.transaction(function(tx) { //transaction

    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        var query = "CREATE TABLE IF NOT EXISTS "+ table.name +"( ";

          for (var b = 0; b < table.fields.length; b++) {
            var field = table.fields[b];

            query += field.name +" "+ field.type;
            if(b != table.fields.length -1)
              query += ", ";
          };

          query += ")";
          tx.executeSql(query);
      };

  }, function() {} /* error */, function(){} /* success */ );

};

Database._clone_obj = function(original) {
    var clone = {};

    var key;

    for (key in original) {
        clone[key] = original[key];
    }

    return clone ;
}

Database.query = function(sql, params, callback) {
  this._db.transaction(function(tx) {
  tx.executeSql(sql, params, function(tx, results) {
    var models = [];
    for (var i = 0; i < results.rows.length; i++) {
      models.push(Database._clone_obj(results.rows.item(i)));
    };
    callback(models);
  }, function(err) { console.log("Error processing SQL: "+ sql, err); });
}, function(err) { console.log("Error processing SQL: "+ sql, err)}, function() {  });

};

Database.all = function(table, callback) {
    this.query("SELECT * FROM "+ table, [], function(result) {
      callback(result);
    });
 },

Database.count = function(table, callback) {
    this.query("SELECT COUNT(*) as count FROM "+ table, [], function(result) {
      var count = result[0].count;
      callback(count);
    });
 },

Database.find = function(id, table, callback) {
    var query = 'SELECT * FROM '+ table +' WHERE id = ?';
    this.query(query, [id], function(models){
      var model = (models.length) ? Database._clone_obj(models[0]) : null;
      callback(model); 
    });
 },

 Database.query_one = function(sql, params, callback) {
    this.query(sql, params, function(result) {
      //console.log("query_one", sql, $result);
      if(result.length > 0)
        callback(Database._clone_obj(result[0]));
      else
        callback(null);
    });
},

Database.remove = function(id, table, callback) {
    var sql = 'DELETE FROM '+ table +' WHERE id ='+ id;

    this.execute_sql(sql, callback);
},

Database.first = function(table, callback) {
	this.query_one("SELECT * FROM "+ table +" ORDER BY id ASC", [], callback);
},

Database.last = function(table, callback) {
	this.query_one("SELECT * FROM "+ table +" ORDER BY id DESC", [], callback);
},

Database.remove_all = function(table, callback) {
	var sql = 'DELETE FROM '+ table;

	this.execute_sql(sql, callback);
};

Database.execute_sql = function(sql, callback){
	this._db.transaction(function(tx) {
	      tx.executeSql(sql);
	      callback();
	    }, function(err) { console.log("Error processing SQL: ", err)}, function() {  });
},

Database.insert = function(table, fields, values, callback) {
    var sql = 'INSERT INTO '+ table +' (';

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      sql += field;

      if(i != fields.length -1)
          sql += ", ";

    };

    sql += ') VALUES (';

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      sql += '?'; 

      if(i != fields.length -1)
          sql += ", ";

    };

    sql += ')';

    //console.log("insert", sql);

    var database = this;
    
    this._db.transaction(function(tx) {
          //console.log(sql, values);
          tx.executeSql(sql, values, function(tx, results){
            //database.find(results.insertId, table, callback);
            //callback();
          });
          //callback();
        }, function(err) { console.log("Error processing SQL: ", err)}, function() { callback();  });
};


/*

	
      insert_bulk: function(table, fields, values, callback) {
        var sql = 'INSERT INTO '+ table +' (';

        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          sql += field;

          if(i != fields.length -1)
              sql += ", ";

        };

        sql += ') VALUES (';

        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          sql += '?'; 

          if(i != fields.length -1)
              sql += ", ";

        };

        sql += ')';

        //console.log("insert", sql);

        var database = this;
        
        db.transaction(function(tx) {
              for (var i = 0; i < values.length; i++) {
              	var value = values[i];
              	tx.executeSql(sql, value, function(tx, results){ });
              };

              //tx.executeSql(sql, values, function(tx, results){ });
              //callback();
            }, function(err) { console.log("Error processing SQL: ", err)}, function() { callback();  });
      },
	
*/

Database.update = function(id, table, fields, values, callback) {
    console.log("Database.update()", id, table);

    var sql = 'UPDATE '+ table +' SET ';

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      sql += field +"= ? ";

      if(i != fields.length -1)
          sql += ",";

    };

    sql += ' WHERE id=?';

    //return;

    values.push(id);

    console.log("Database.update()", sql, values);

    var database = this;
    
    this._db.transaction(function(tx) {
      tx.executeSql(sql, values);
      //console.log("update transaction");
      callback();
    }, function(err) { console.log("Error processing SQL: ", err)}, function() {  });
 };

Database.update_model = function(table, model, callback) {
	console.log("Database.update_model", table.fields.length);

	var fields 	= [];
	var values 	= [];

	for (var i = 0; i < table.fields.length; i++) {
		var field = table.fields[i].name;
		var value = model[field];

		if(value != undefined && field != "id a") {
			fields.push(field);
			values.push(value);
		}
	}

	this.update(model.id, table.name, fields, values, callback);
};

Database.insert_model = function(table, model, callback) {
	console.log("Database.insert_model", table.fields.length);

	var fields 	= [];
	var values 	= [];

	for (var i = 0; i < table.fields.length; i++) {
		var field = table.fields[i].name;
		var value = model[field];

		if(value != undefined) {
			fields.push(field);
			values.push(value);
		}
	}

	//console.log(fields, values);


	this.insert(table.name, fields, values, callback);
}


Database.insert_models = function(table, models, callback) {
  //console.log("Database.insert_models", table.fields.length);

  var model;
  var cmds = [];

	for (var i = 0; i < models.length; i++) {
	  	model = models[i];

		var fields  = [];
		var values  = [];
		var masks 	= [];
		var sql 	= "";

		for (var a = 0; a < table.fields.length; a++) {
			var field = table.fields[a].name;
			var value = model[field];

			if(value != undefined) {
				fields.push(field);
				values.push(value);
			}
		}

		//values = values.join(',');

		for (var b = 0; b < fields.length; b++) {
			masks.push("?");
		};

		fields = fields.join(',');

		masks = masks.join(",");


		var sql = 'INSERT INTO '+ table.name +' ('+ fields +') VALUES ('+ masks +'); ';

		cmds.push({sql: sql, values: values});

	};

	//console.log(cmds);

	this._db.transaction(function(tx) {

		for (var i = 0; i < cmds.length; i++) {
			var cmd = cmds[i];
			tx.executeSql(cmd.sql, cmd.values);
		};

      //console.log("update transaction");
      callback();
    }, 
    	function(err) { console.log("Error processing SQL: ", err)}, 
    	function() {  }
    );
};

Database.drop_table = function(table, callback) {
    var sql = 'DROP TABLE IF EXISTS '+ table;
    this.execute_sql(sql, callback);
    //tx.executeSql('DROP TABLE IF EXISTS tarefa');
}



