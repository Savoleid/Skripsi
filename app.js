var express = require('express');
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');

var app = express();

// add this to your app.configure
app.use(session({
  secret: "kqsdjfmlksdhfhzirzeoibrzecrbzuzefcuercazeafxzeokwdfzeijfxcerig",
  resave: false,
  saveUninitialized: false
}));

function checkAuth(req, res, next) {
	if(req.session.user_id) {
		next();
	} else {
		res.render('login', {'error': 'Silahkan melakukan login sebelum menambahkan spesies baru'} );
	}
}

function getMySQLConnection() {
	return mysql.createConnection({
	  host     : '127.0.0.1',
	  user     : 'vito',
	  password : 'vito',
	  database : 'fossil_list'
	});
}
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.set('view engine', 'pug');
app.use(express.static(__dirname + "/public"));

app.get('/login', function(req, res) {
	res.render('login');
});

app.get('/logout', function(req, res) {
	req.session.destroy(function(){
	    res.redirect('/home');
	});
});

app.post('/login', function(req, res) {
	var post = req.body;
	// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();

	connection.query('SELECT * FROM user WHERE username = \'' + post.user + '\' AND password = \'' + post.password + '\'', function(err, rows, fields) {
		if(rows.length > 0) {
			req.session.user_id = rows[0].username;
		    res.redirect('/home');	
		} else {
			res.render('login',{'error': 'Username atau password salah.'} );
		}
	});
});

app.get('/fossil',  function(req, res) {
	var fossilList = [];
	var speciesList = [];
	var idSpeciesList = [];
	var umurList = [];

	// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();

	// Do the query to get data.
	connection.query('SELECT zona_geo FROM umur_geologi ORDER BY id_umur ASC', function(err, rows, fields) {
		if (err) {
	  		res.status(500).json({"status_code": 500,"status_message": err});
	  	} else {
	  		// Loop check on each row
	  		for (var i = 0; i < rows.length; i++) {

	  			// Create an object to save current row's data
		  		var fossil = rows[i].zona_geo;
		  		
		  		// Add object into array
		  		fossilList.push(fossil);
	  		}

	  		connection.query('SELECT nama_spesies, id_spesies FROM spesies ORDER BY spesies.nama_spesies ASC', function(err, rows2, fields){
		  		if(err) {
		  			res.status(500).json({"status_code": 500,"status_message": err});
		  		} else {
		  			// Loop check on each row
			  		for (var j = 0; j < rows2.length; j++) {

			  			// Create an object to save current row's data
				  		var species = rows2[j].nama_spesies;
				  		var id_spesies = rows2[j].id_spesies;
				  		
				  		// Add object into array
				  		var spesiesData = {
				  			"id_spesies": id_spesies,
				  			"spesies_name": species
				  		}
				  		speciesList.push(spesiesData);
			  		}

			  		connection.query('SELECT spesies.id_spesies, id_umur FROM spesies INNER JOIN zona_geologi ON spesies.id_spesies = zona_geologi.id_spesies', function(err, rows3, fields) {
				  			for(var l = 0;l < speciesList.length; l++) {
					  					var umurIdList = [];
					  					for (var k = 0; k < rows3.length; k++) {
					  						if(rows3[k].id_spesies == speciesList[l].id_spesies) {
						  						umurIdList.push(rows3[k].id_umur);
						  						console.log(rows3[k]);
						  					}
					  					}
					  					var umur = {
							  				"id_spesies": speciesList[l].id_spesies,
							  				"spesies" : speciesList[l].spesies_name,
							  				"umur_list" : umurIdList
							  			};
							  			umurList.push(umur);
					  				}
					  		var data = {
						  			'fossilList' : fossilList,
						  			'speciesList' : speciesList,
						  			'umurIdList' : umurList
						  		}

						  		console.log(data);

						  		//res.status(200).json({"status_code": 200,"data": data});
						  		res.render('fossil', {"data": data});
						  		connection.end();

			  			});
		  		}

		  	});
		}
	});
});

app.post('/fossil/preview', function(req, res){
	var data = 
		 {
			"nama":req.body.Nama,
			"nomor_induk":req.body.NomorInduk,
			"tanggal":req.body.Tanggal,
			"litologi":req.body.Litologi,
			"formasi":req.body.Formasi,
			"alamat":req.body.Alamat,
			"longitude":req.body.Longitude,
			"latitude":req.body.Latitude,
			"kode_sample":req.body.KodeSample,
			"stopsite":req.body.Stopsite,
			"pengawetan":req.body.Pengawetan,
			"kelimpahan":req.body.Kelimpahan,
			"preparasi":req.body.Preparasi,
			"tujuan":req.body.Tujuan,
			"spesies":req.body.Species
		}

	var fossilList = [];
	var speciesList = [];
	var idSpeciesList = [];
	var umurList = [];
	var umurCollection = [];

	//mengubah jenis array ke array yang bisa dibaca mysql
	var spesiesArray = '';
		if(data.spesies.length>0) {
			for(var n = 0;n < data.spesies.length;n++) {
				if(n==data.spesies.length-1) {
					spesiesArray += data.spesies[n];
				} else {
					spesiesArray += data.spesies[n]+','
				}
			}
		} else {
			spesiesArray = data.spesies;
		}
	console.log(spesiesArray);

	// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();

	connection.query('SELECT zona_geo FROM umur_geologi ORDER BY id_umur ASC', function(err, rows, fields) {

		// Loop check on each row
	  		for (var i = 0; i < rows.length; i++) {

	  			// Create an object to save current row's data
		  		var fossil = rows[i].zona_geo;
		  		
		  		// Add object into array
		  		fossilList.push(fossil);
	  		}

	  		connection.query('SELECT nama_spesies, id_spesies FROM spesies WHERE id_spesies IN (' + spesiesArray + ')', function(err, rows2, fields){
	  			// Loop check on each row
			for (var j = 0; j < rows2.length; j++) {
				// Create an object to save current row's data
				var species = rows2[j].nama_spesies;
				var id_spesies = rows2[j].id_spesies;
					  		
				// Add object into array
				var spesiesData = {
					"id_spesies": id_spesies,
					"spesies_name": species
				}
				speciesList.push(spesiesData);
			}
			var query12 = 'SELECT spesies.id_spesies, id_umur FROM spesies INNER JOIN zona_geologi ON spesies.id_spesies = zona_geologi.id_spesies WHERE spesies.id_spesies IN (' + spesiesArray + ')';
			console.log(query12);
			connection.query(query12, function(err, rows3, fields) {
			for(var l = 0;l < speciesList.length; l++) {
					  					var umurIdList = [];
					  					for (var k = 0; k < rows3.length; k++) {
					  						if(rows3[k].id_spesies == speciesList[l].id_spesies) {
						  						umurIdList.push(rows3[k].id_umur);
						  					}
					  					}
					  					var umur = {
							  				"id_spesies": speciesList[l].id_spesies,
							  				"spesies" : speciesList[l].spesies_name,
							  				"umur_list" : umurIdList
							  			};
							  			umurCollection.push(umurIdList);
							  			umurList.push(umur);


					  				}

					  				var listData = [];
					  				for(var q=0;q<umurList.length;q++) {
					  					listData.push(umurList[q].umur_list[0]);
					  				}

					  				console.log('First Umur: ' + listData);
					  				
					  				var listInt = [];

					  				for(var r = 0;r<listData.length;r++) {
					  					listInt.push(parseInt(listData[r]))
					  				}

					  				var max = Math.max.apply(null, listInt);
					  				console.log('Youngest: ' + max);

					  				var result = umurCollection.shift().filter(function(v) {
							  			return umurCollection.every(function(a) {
							  				return a.indexOf(v) != -1;
							  			});
							  		});


							  		var umurArrayString = '';
									if(result.length>0) {
										for(var n = 0;n < result.length;n++) {
											if(n==result.length-1) {
												umurArrayString += result[n];
											} else {
												umurArrayString += result[n]+','
											}
										}
									} else {
										umurArrayString = result[0];
									}

									var query = 'SELECT zona_geo, umur_geo FROM umur_geologi WHERE id_umur = ' + max;
									console.log(query);
							  		connection.query(query, function(err, rows4, fields) {
							  			if(err) {
							  				var dataSpesies = {
								  				'data': data,//data isian dari formulir di atas
									  			'fossilList' : fossilList,
									  			'speciesList' : speciesList,
									  			'umurIdList' : umurList,
									  			'kesimpulan' : null
									  		}
							  				console.log(result.length);
							  				console.log(dataSpesies);

									  		//res.status(200).json({"status_code": 200,"data_spesies": dataSpesies});
									  		res.render('preview', {"data": dataSpesies});
									  		connection.end();
							  			} else {
								  			var umurSpesies = {
								  				'umurGeo' : rows4[0].umur_geo,
								  				'zonaGeo' : rows4[0].zona_geo
								  			};
								  			var dataSpesies = {
								  				'data': data,//data isian dari formulir di atas
									  			'fossilList' : fossilList,
									  			'speciesList' : speciesList,
									  			'umurIdList' : umurList,
									  			'kesimpulan' : umurSpesies
									  		}
							  				console.log(result.length);
							  				console.log(dataSpesies);

									  		//res.status(200).json({"status_code": 200,"data_spesies": dataSpesies});
									  		res.render('preview', {"data": dataSpesies});
									  		connection.end();
							  			}
							  		});
		});
	  		});
		

		
		
	});

	//res.render('preview', {"data": data});
		
});

app.post('/fossil/save', function(req, res){
	var data = 
		 {
			"nama":req.body.Nama,
			"nomor_induk":req.body.NomorInduk,
			"tanggal":req.body.Tanggal,
			"litologi":req.body.Litologi,
			"formasi":req.body.Formasi,
			"alamat":req.body.Alamat,
			"longitude":req.body.Longitude,
			"latitude":req.body.Latitude,
			"kode_sample":req.body.KodeSample,
			"stopsite":req.body.Stopsite,
			"pengawetan":req.body.Pengawetan,
			"kelimpahan":req.body.Kelimpahan,
			"preparasi":req.body.Preparasi,
			"tujuan":req.body.Tujuan,
			"spesies":JSON.parse(req.body.Species)
		}

	console.log('data:' + data );


		// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();

	// Do the query to get data.
	connection.query('INSERT INTO observer (nomor_induk, nama_observer, tanggal) VALUES (\'' + data.nomor_induk + '\', \'' + data.nama + '\', \'' + data.tanggal + '\')', function(err, result) {
		if(err) {
			res.status(500).json({"status_code": 500,"message1": err});
		} else {
			connection.query('INSERT INTO studi_area (lokasi, id_obs, litologi, formasi, longitude, latitude) VALUES (\'' + data.alamat + '\', ' + result.insertId + ', \'' + data.litologi +'\', \'' + data.formasi+ '\', \'' + data.longitude +'\', \'' +data.latitude+'\')', function(err, result2) {
				if(err) {
					res.status(500).json({"status_code": 500,"message2": err});
				} else {
					var resultId = result2.insertId;
					var i = 0;
					var query = 'INSERT INTO sample (id_sa, id_spesies, kode_sample, kelimpahan, preparasi, pengawetan, tujuan, stopsite) VALUES ';

					for (var i = 0; i < data.spesies.length; i++) { //untuk pengulangan biar bisa pilih spesies lebih dari satu
						query += '(' + resultId + ',' + data.spesies[i].id_spesies + ', \'' +  data.kode_sample  + '\' , \'' + data.kelimpahan + '\' , \'' + data.preparasi + '\' , \'' + data.pengawetan + '\' , \'' + data.tujuan + '\' ,\'' + data.stopsite + '\')';
						if(i!=data.spesies.length-1) {
							query += ',';
						}
					}
					console.log(query);

					connection.query(query, function(err, result3) {
								if(err) {
									res.status(500).json({"status_code": 500,"message3": err, "data":data});
									throw err;
								} else {
									console.log('Conection closed at: ' + i);
									connection.end(); 

									//res.status(200).json({"status_code" : 200, "message3" : "success"});
									res.writeHead(301, {Location: '../../sample'});
									res.end();
								}
							});
				}
				});
		}
	});
});

app.get('/sample/', function(req, res){
	var sampleList = [];
	// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();
	connection.query('SELECT sa.id_sa,obs.id_obs, obs.nama_observer, obs.nomor_induk, DATE_FORMAT(obs.tanggal,\'%d %M %Y\') tanggal, sa.formasi, sm.kode_sample, sm.tujuan FROM studi_area sa JOIN observer obs ON sa.id_obs = obs.id_obs JOIN sample sm ON sa.id_sa = sm.id_sa WHERE obs.deleted = 0 GROUP BY sm.id_sa ORDER BY obs.id_obs DESC ', function(err, rows, fields) {
		if(err) {
			res.status(500).json({"status_code": 500,"status_message": err});
		} else{

		for (var i = 0; i < rows.length; i++) {

	  			// Create an object to save current row's data
		  		var sample = {
		  			'id_sa' : rows[i].id_sa,
		  			'id_obs' : rows[i].id_obs,
		  			'nama_observer' : rows[i].nama_observer,
		  			'nomor_induk' : rows[i].nomor_induk,
		  			'tanggal' : rows[i].tanggal,
		  			'formasi' : rows[i].formasi,
		  			'kode_sample' : rows[i].kode_sample,
		  			'tujuan' : rows[i].tujuan
		  		};
		  		
		  		// Add object into array
		  		sampleList.push(sample);
		  	}
		  	if(!req.session.user_id) {
		  		res.render('sample', {"data" : sampleList, "login": false});
		  	} else {
		  		res.render('sample', {"data" : sampleList, "login": true});
		  	}
		  	//res.status(200).json({"status_code": 200,"status_message": "success", "data": sampleList});
		  }
	});
});

app.get('/search', function(req, res) {

		var spesies = req.query.spesies;
		var formasi = req.query.formasi;
		var sampleList = [];
		// Connect to MySQL database.
		var connection = getMySQLConnection();
		connection.connect();
		connection.query("SELECT sa.id_sa,obs.id_obs, obs.nama_observer, obs.nomor_induk, DATE_FORMAT(obs.tanggal,\'%d %M %Y\') tanggal, sa.formasi, sm.kode_sample, sm.tujuan, sp.nama_spesies FROM studi_area sa JOIN observer obs ON sa.id_obs = obs.id_obs JOIN sample sm ON sa.id_sa = sm.id_sa JOIN spesies sp ON sm.id_spesies = sp.id_spesies WHERE obs.deleted = 0 AND sp.nama_spesies LIKE '%" + spesies + "%' AND sa.formasi LIKE '%" + formasi + "%' ORDER BY obs.id_obs DESC", function(err, rows, fields) {
			if(err) {
				res.status(500).json({"status_code": 500,"status_message": err});
			} else{

			for (var i = 0; i < rows.length; i++) {

		  			// Create an object to save current row's data
			  		var sample = {
			  			'id_sa' : rows[i].id_sa,
			  			'id_obs' : rows[i].id_obs,
			  			'nama_observer' : rows[i].nama_observer,
			  			'nomor_induk' : rows[i].nomor_induk,
			  			'tanggal' : rows[i].tanggal,
			  			'formasi' : rows[i].formasi,
			  			'kode_sample' : rows[i].kode_sample,
			  			'tujuan' : rows[i].tujuan,
			  			'spesies' : rows[i].nama_spesies
			  		};
			  		
			  		// Add object into array
			  		sampleList.push(sample);
			  	}
			  	if(!req.session.user_id) {
				  	res.render('search', {"data" : sampleList, "spesies" : spesies, "formasi": formasi, "login" : false});
				 } else {
				 	res.render('search', {"data" : sampleList, "spesies" : spesies, "formasi": formasi, "login" : true});
				 }
			  	//res.status(200).json({"status_code": 200,"status_message": "success", "data": sampleList});
			  }
		});
});

app.get('/sample/:id', function(req, res) {
	var connection = getMySQLConnection();
	var umurCollection = [];
	connection.connect();
	connection.query('SELECT sm.id_sample, obs.nama_observer, obs.nomor_induk, DATE_FORMAT(obs.tanggal,\'%d %M %Y\') tanggal, sa.id_sa, sa.litologi, sa.formasi, sa.lokasi, sa.longitude, sa.latitude, sm.kode_sample, sm.kelimpahan, sm.preparasi, sm.pengawetan, sm.tujuan, sm.stopsite, sp.nama_spesies FROM sample sm JOIN studi_area sa ON sm.id_sa = sa.id_sa JOIN observer obs ON sa.id_obs = obs.id_obs JOIN spesies sp ON sm.id_spesies = sp.id_spesies WHERE sa.id_sa = ' + req.params.id, function(err, rows, fields) {
		if(err) {
			res.status(500).json({"status_code": 500,"status_message": err});
		} else{

			// Create an object to save current row's data
		  		var sample = {
		  			'id_sample' : rows[0].id_sample,
		  			'nama_observer' : rows[0].nama_observer,
		  			'nomor_induk' : rows[0].nomor_induk,
		  			'tanggal' : rows[0].tanggal,
		  			'litologi' : rows[0].litologi,
		  			'formasi' : rows[0].formasi,
		  			'lokasi' : rows[0].lokasi,
		  			'longitude' : rows[0].longitude,
		  			'latitude' : rows[0].latitude,
		  			'kode_sample' : rows[0].kode_sample,
		  			'kelimpahan' : rows[0].kelimpahan,
		  			'preparasi' : rows[0].preparasi,
		  			'pengawetan' : rows[0].pengawetan,
		  			'tujuan' : rows[0].tujuan,
		  			'stopsite' : rows[0].stopsite,
		  			'nama_spesies' : rows[0].nama_spesies,
		  		};

		  		connection.query('SELECT id_spesies FROM `sample` WHERE id_sa = ' + req.params.id, function(err, rows1, fields) {
		  			//mengubah jenis array ke array yang bisa dibaca mysql
					var spesiesArray = '';
						if(rows.length>0) {
							for(var n = 0;n < rows1.length;n++) {
								if(n==rows1.length-1) {
									spesiesArray += rows1[n].id_spesies;
								} else {
									spesiesArray += rows1[n].id_spesies + ',';
								}
							}
						} else {
							spesiesArray = data.spesies;
						}

					var fossilList = [];
					var speciesList = [];
					var idSpeciesList = [];
					var umurList = [];

					connection.query('SELECT zona_geo FROM umur_geologi ORDER BY id_umur ASC', function(err, rows, fields) {

						// Loop check on each row
					  		for (var i = 0; i < rows.length; i++) {

					  			// Create an object to save current row's data
						  		var fossil = rows[i].zona_geo;
						  		
						  		// Add object into array
						  		fossilList.push(fossil);
					  		}

					  		connection.query('SELECT nama_spesies, id_spesies FROM spesies WHERE id_spesies IN (' + spesiesArray + ')', function(err, rows2, fields){
					  			// Loop check on each row
							for (var j = 0; j < rows2.length; j++) {
								// Create an object to save current row's data
								var species = rows2[j].nama_spesies;
								var id_spesies = rows2[j].id_spesies;
									  		
								// Add object into array
								var spesiesData = {
									"id_spesies": id_spesies,
									"spesies_name": species
								}
								speciesList.push(spesiesData);
							}

							connection.query('SELECT spesies.id_spesies, id_umur FROM spesies INNER JOIN zona_geologi ON spesies.id_spesies = zona_geologi.id_spesies WHERE spesies.id_spesies IN (' + spesiesArray + ')', function(err, rows3, fields) {
							for(var l = 0;l < speciesList.length; l++) {
									  					var umurIdList = [];
									  					for (var k = 0; k < rows3.length; k++) {
									  						if(rows3[k].id_spesies == speciesList[l].id_spesies) {
										  						umurIdList.push(rows3[k].id_umur);
										  						console.log(rows3[k]);
										  					}
									  					}
									  					var umur = {
											  				"id_spesies": speciesList[l].id_spesies,
											  				"spesies" : speciesList[l].spesies_name,
											  				"umur_list" : umurIdList
											  			};
											  			umurCollection.push(umurIdList);
											  			umurList.push(umur);
									  				}
									  				var result = umurCollection.shift().filter(function(v) {
							  			return umurCollection.every(function(a) {
							  				return a.indexOf(v) != -1;
							  			});
							  		});


									//rekomendasi
									var listData = [];
					  				for(var q=0;q<umurList.length;q++) {
					  					listData.push(umurList[q].umur_list[0]);
					  				}

					  				console.log('First Umur: ' + listData);
					  				
					  				//mendefinisikan list deretan umur
					  				var listInt = [];

					  				for(var r = 0;r<listData.length;r++) {
					  					listInt.push(parseInt(listData[r]))
					  				}

					  				//untuk mencari umur termuda
					  				var max = Math.max.apply(null, listInt);
					  				console.log('Youngest: ' + max);
									var query = 'SELECT * FROM umur_geologi WHERE id_umur = ' + max;
									console.log(query);
							  		connection.query(query, function(err, rows4, fields) {
							  			if(err) {
							  				var dataSpesies = {
								  				'sample': sample,//data isian dari formulir di atas
									  			'fossilList' : fossilList,
									  			'speciesList' : speciesList,
									  			'umurIdList' : umurList,
									  			'kesimpulan' : umurGeoList
									  		}
							  				console.log(result.length);
							  				console.log(dataSpesies);

									  		//res.status(200).json({"status_code": 200,"data_spesies": dataSpesies});
									  		res.render('sample_detail', {"data": dataSpesies});
									  		connection.end();
							  			} else {
								  			var umurSpesies = {
								  				'umurGeo' : rows4[0].umur_geo,
								  				'zonaGeo' : rows4[0].zona_geo
								  			};
								  			var dataSpesies = {
								  				'sample': sample,//data isian dari formulir di atas
									  			'fossilList' : fossilList,
									  			'speciesList' : speciesList,
									  			'umurIdList' : umurList,
									  			'kesimpulan' : umurSpesies
									  		}
							  				console.log(result.length);
							  				console.log(dataSpesies);

									  		//res.status(200).json({"status_code": 200,"data_spesies": dataSpesies});
									  		res.render('sample_detail', {"data": dataSpesies});
									  		connection.end();
								  	}
							  		});
						});
					  		});
						

						
						
					});

		  		});
		  }
	});
});

app.get('/dashboard', checkAuth, function (req, res) {
	var speciesList = [];
	// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();

	connection.query('SELECT * FROM spesies', function(err, rows, fields) {
		for(var i = 0; i<rows.length;i++) {
			var species = {
				"id_spesies" : rows[i].id_spesies,
				"nama_spesies" : rows[i].nama_spesies
			};
			speciesList.push(species);
		}

		//res.status(200).json({"status_code": 200,"data": speciesList});
		res.render('dashboard', {"data" : speciesList});
	});
});

app.get('/dashboard/add', checkAuth, function(req, res) {
	var umurList = [];
	// Connect to MySQL database.
	var connection = getMySQLConnection();
	connection.connect();
	connection.query('SELECT * FROM umur_geologi ORDER BY id_umur', function(err, rows, fields) {
		for(var i=0;i<rows.length;i++) {
			var umur = {
				"id_umur" : rows[i].id_umur,
				"zona_geo" : rows[i].zona_geo
			};
			umurList.push(umur);
		}
		res.render('dashboard_add', {"data":umurList});
	});
});

app.post('/dashboard/save', checkAuth, function(req, res){
	var data = {
		"nama_spesies" : req.body.nama_spesies,
		"awal" : req.body.umur_awal,
		"akhir" : req.body.umur_akhir
	}

	var connection = getMySQLConnection();
	connection.connect();

	connection.query('INSERT INTO spesies(nama_spesies) VALUES(\"' + data.nama_spesies + '\")', function(err, result) {
		var idSpesies = result.insertId;
		console.log('Spesies ID: ' + result.insertId);
		//mengubah jenis array ke array yang bisa dibaca mysql
		var umurArrayString = '';
		console.log('awal: ' + data.awal + ', akhir: ' + data.akhir);
		var awal = parseInt(data.awal);
		var akhir = parseInt(data.akhir);
		//untuk isi umur otomatis
		for(var n = awal; n <= akhir; n++) {
				console.log(n);
				//membuat format umur untuk query berikutnya
				if(n==akhir) {
					umurArrayString += '(' + idSpesies + ',' + n + ')';
				} else {
					umurArrayString += '(' + idSpesies + ',' + n + '),';
				}
				console.log(n);
			}
		console.log(umurArrayString);
		var query = 'INSERT INTO zona_geologi (id_spesies, id_umur) VALUES ' + umurArrayString;
		console.log(query);
		connection.query(query, function(err, result) {
			if(err) {
				connection.end();
				res.status(500).json({"status_code": 500,"message": err});
			} else{
				connection.end();
				res.writeHead(301, {Location: '../../dashboard'});
				res.end();
			}
		});
	});
});

app.get('/dashboard/:id/delete', checkAuth, function(req, res) {
	var spesiesId = req.params.id;
	var connection = getMySQLConnection();
	connection.connect();

	connection.query('DELETE FROM spesies WHERE id_spesies = ' + spesiesId, function(err, result) {
		if(err) {
			connection.end();
				res.status(500).json({"status_code": 500,"message": err});
		} else{
			connection.end();
				res.writeHead(301, {Location: '../../../dashboard'});
				res.end();
		}
	}) 
});

app.get('/sample/:id/delete', function(req, res) {
	var observerId = req.params.id;
	var connection = getMySQLConnection();
	connection.connect();

	connection.query('UPDATE observer SET deleted = 1 WHERE id_obs = '+ observerId, function(err, result) {
		if(err) {
			connection.end();
			res.status(500).json({"status_code" :500, "message" : err});
		} else {
			connection.end();
			res.writeHead(301, {Location: '../../../sample'});
			res.end();
		}
	});
});

app.get('/species/top10', function(req, res) {
	var topSpecies = [];
	var connection = getMySQLConnection();
	connection.connect();
	connection.query('SELECT sp.nama_spesies FROM spesies sp JOIN sample sm ON sm.id_spesies = sp.id_spesies GROUP BY sp.nama_spesies ORDER BY COUNT(*) DESC LIMIT 10', function(err, rows, fields) {
		if(err) {
			connection.end();
			res.status(500).json({"status_code" :500, "message" : err});
		} else {
			for(var i=0;i<rows.length;i++) {
				topSpecies.push(rows[i].nama_spesies);
			}

			res.render('top', {"data" : topSpecies});
		}
	});
});

app.get('/home', function(req, res){
	if(req.session.user_id) {
		res.render('home', {"login" : true});
	} else {
		res.render('home', {"login" : false});
	}
});

app.get('/sample/:id/edit', function(req, res) {
	var connection = getMySQLConnection();
	connection.connect();
	connection.query('SELECT obs.id_obs, sm.id_sample, obs.nama_observer, obs.nomor_induk, DATE_FORMAT(obs.tanggal,\'%Y-%c-%d\') tanggal, sa.id_sa, sa.litologi, sa.formasi, sa.lokasi, sa.longitude, sa.latitude, sm.kode_sample, sm.kelimpahan, sm.preparasi, sm.pengawetan, sm.tujuan, sm.stopsite, sp.nama_spesies FROM sample sm JOIN studi_area sa ON sm.id_sa = sa.id_sa JOIN observer obs ON sa.id_obs = obs.id_obs JOIN spesies sp ON sm.id_spesies = sp.id_spesies WHERE sa.id_sa = ' + req.params.id, function(err, rows, fields) {
		if(err) {
			res.status(500).json({"status_code" :500, "message" : err});
		} else {
			var sample = {
		  			'id_sample' : rows[0].id_sample,
		  			'nama_observer' : rows[0].nama_observer,
		  			'nomor_induk' : rows[0].nomor_induk,
		  			'tanggal' : rows[0].tanggal,
		  			'litologi' : rows[0].litologi,
		  			'formasi' : rows[0].formasi,
		  			'lokasi' : rows[0].lokasi,
		  			'longitude' : rows[0].longitude,
		  			'latitude' : rows[0].latitude,
		  			'kode_sample' : rows[0].kode_sample,
		  			'kelimpahan' : rows[0].kelimpahan,
		  			'preparasi' : rows[0].preparasi,
		  			'pengawetan' : rows[0].pengawetan,
		  			'tujuan' : rows[0].tujuan,
		  			'stopsite' : rows[0].stopsite,
		  			'nama_spesies' : rows[0].nama_spesies,
		  			"id_obs" : rows[0].id_obs,
		  			"id_sa" : rows[0].id_sa
		  		};
		  connection.end();
		  res.render('edit', {"sample" : sample});
		}
	});
});

app.post('/sample/update', function(req, res) {
	var connection = getMySQLConnection();
	connection.connect();
	var data = 
		 {
		 	"id_sa":req.body.id_sa,
		 	"id_sample":req.body.id_sample,
		 	"id_obs":req.body.id_obs,
			"nama":req.body.Nama,
			"nomor_induk":req.body.NomorInduk,
			"tanggal":req.body.Tanggal,
			"litologi":req.body.Litologi,
			"formasi":req.body.Formasi,
			"alamat":req.body.Alamat,
			"longitude":req.body.Longitude,
			"latitude":req.body.Latitude,
			"kode_sample":req.body.KodeSample,
			"stopsite":req.body.Stopsite,
			"pengawetan":req.body.Pengawetan,
			"kelimpahan":req.body.Kelimpahan,
			"preparasi":req.body.Preparasi,
			"tujuan":req.body.Tujuan
		}

	console.log('data:' + data );

	var query = "UPDATE observer SET nama_observer = '" + data.nama + "', nomor_induk = '" + data.nomor_induk +"', tanggal = '" + data.tanggal + "' WHERE id_obs = " + data.id_obs;
	console.log(query);
	connection.query(query, function(err, result){
		console.log(err);
		connection.query("UPDATE studi_area SET lokasi = '" + data.alamat + "', litologi = '" + data.litologi + "', formasi = '" + data.formasi + "', longitude = '" + data.longitude + "', latitude = '" + data.latitude + "' WHERE id_sa = " + data.id_sa, function(err, result) {
			console.log(err);
			connection.query("UPDATE sample SET kode_sample = '" + data.kode_sample + "', kelimpahan = '" + data.kelimpahan + "', preparasi = '" + data.preparasi + "', pengawetan = '" + data.pengawetan + "', tujuan = '" + data.tujuan + "', stopsite = '" + data.stopsite + "' WHERE id_sample = " + data.id_sample, function(err, result) {
				console.log(err)
				connection.end(); 

									//res.status(200).json({"status_code" : 200, "message3" : "success"});
									res.writeHead(301, {Location: '../sample'});
									res.end();
			})
		});
	});
});

app.listen(3000, function () {
    console.log('listening on port', 3000);
});