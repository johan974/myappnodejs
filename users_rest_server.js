var express = require('express');
var app = express();
var http = require('http');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

// Handling POST messages
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// General setting for allowing CORS (cross domain) access
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Example 1 - list users from a local users.json file
app.get('/listUsers', function (req, res) {
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       console.log( data );
       res.end( JSON.stringify(data ));
   });
})

// Example 2 - complete set of RESTful services
// 2.1 - list the avaialble phones from a file and return as a JSON array
app.get('/phone', function (req, res) {
   console.log( "Server: /phone");
    // read local file
    fs.readFile( file, 'utf8', function (err, data) {
       if( debug) { console.log( JSON.stringify(data )); };
       // return as JSON string
       res.end( data);
   });
})
// 2.2 - get 1 phone
app.get('/phone/:id', function(req, res) {
    if( debug) { console.log( "Server get: /phone"); };
    var phones = [];
    fs.readFile( file, 'utf8', function (err, data) {
       if( err) {
            console.log( "Phone/get: cannot read server data");
            res.statusCode = 402;
            res.end( JSON.stringify( { "error" : "Phone/get: cannot read server data" } ));
       } else { 
            // from JSON to objects
            phones = JSON.parse( data);
            for( var i = 0; i < phones.length; i++) {
                if( debug) { console.log( " > checking id: \"" + phones[i].id + "\"") };
                if( phones[i].id === req.params.id) {
                    if( debug) { console.log( "Phone/get: serving data: " + JSON.stringify( phones[i])); };
                    res.json( phones[i]);
                    return ; 
                }
            }
            if( debug) { console.log( "No phone with this id found: " + req.params.id ); };
            return res.send( JSON.stringify( { "error" : "No phone with this id found: " + req.params.id }));            
       }
    });
})
// 2.3 - update/create a phone
app.post('/phone', jsonParser, function(req, res) {
    if( debug) { console.log( "Server post: /phone: "); };
    //console.log( "Post: req.header: " + JSON.stringify(req.headers));
    if( ! req.body) { // there is NO body
        if( debug) { console.log( "There is no body"); };
        return res.sendStatus(400);
    }
    if( debug) { console.log( 'The body contains: ' + JSON.stringify( req.body)); };
    if( req.body.phoneId === undefined || req.body.name === undefined) {
        if( debug) { console.log( 'Error 400: post syntax misses name in body'); };
        res.statusCode = 400;
        return res.send( 'Error 4400: post syntax misses name in body');
    }
    if( debug) { console.log( "Phone/post: " + req.body.phone.id); };
    var phones = [];
    fs.readFile( file, 'utf8', function (err, data) {
       if( err) {
            if( debug) { console.log( "Phone/post: cannot read server data");
            res.statusCode = 402;
            res.end( JSON.stringify( { "error" : "Phone/post: cannot read server data" } ));
       } else { 
            phones = JSON.parse( data);
            for( var i = 0; i < phones.length; i++) {
                if( debug) { console.log( " > checking id: \"" + phones[i].id + "\"") };
                if( phones[i].id === req.body.id) {
                    phones[i].name = req.body.name;
                    if( debug) { console.log( "Phone/post: serving CHANGED (not saved) data: " + JSON.stringify( phones[i])); };
                    res.json( phones[i]);
                    return ; 
                }
            } 
            var newPhone = { id : req.body.id, name : req.body.name, snippet : 'Just some stuff' }; 
            if( debug) { console.log( "Will create with id: " + JSON.stringify( newPhone)); };
            // add to the list of phones
            phones.push( newPhone);
            // write to file
            fs.writeFile(file, JSON.stringify(phones), function (err) {
                 if( err ){
                      if( debug) { console.log( err ); };
                 }else{
                       if( debug) { console.log( "Write succesfull"); };
                 }
                return res.json( phones[i]);
            });            
       }}});
})
// 2.4 - delete phone
app.delete( '/phone/:id', function( req, res) {
    if( debug) { console.log( "Server delete: /phone"); };
    var phones = [];
    fs.readFile( file, 'utf8', function (err, data) {
       if( err) {
            if( debug) { console.log( "Phone/delete: cannot read server data"); };
            res.statusCode = 402;
            res.end( JSON.stringify( { "error" : "Phone/post: cannot read server data" } ));
       } else { 
           phones = JSON.parse( data);
            for( var i = 0; i < phones.length; i++) {
                if( debug) { console.log( " > checking id: \"" + phones[i].id + "\""); };
                if( phones[i].id === req.params.id) {
                    if( debug) { console.log( 'Delete phone with id = ' + req.params.id + ' name = ' + phones[i].name); };
                    // delete 1 element from the phones list
                    phones.splice( i, 1);
                    fs.writeFile( file, JSON.stringify(phones), function (err) {
                        if( err ){
                              if( debug) { console.log( err ); };
                        } else{
                              if( debug) {  console.log( "Write succesfull"); };
                        }
                    })
            }}
       }
    });    
})
// Simple echo server
app.get('/echo', function (req, res) {
   if( debug) { console.log( "Asking for echo ...");    }; 
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.write( "<html><body>Dit is een string</body></html>")
   res.end();
})

app.get('/addUser', function (req, res) {
	// what is the request: 
	var fbResponse = req.query;
	console.log( "Add user input = " + fbResponse.field);
	var userInput = JSON.parse( fbResponse.field);
	console.log( "User input = " + userInput);
	console.log( "Name = " + userInput.name);
	// First read existing users.
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
		data = JSON.parse( data );
		data["user4"] = userInput;
		var newText = JSON.stringify(data);
		fs.unlink("output_new.json", function(err) {
			if (err) {
				return console.error(err);
			}
			console.log("File deleted successfully!");
		});
		fs.writeFile( "output_new.json", newText, function (err, data2) {
			if (err) {
				return console.error(err);
			}
		});
		console.log("Data written successfully!");
		console.log( newText );
		res.end( newText);
	});
})

app.get('/user/*', function (req, res) {
	var path = url.parse(req.url).pathname; 
	var pathparts = path.split("/");
	if( pathparts.length != 3) { 
		res.end( JSON.stringify( { "error" : "Syntax should be: */users/id" } ));
		return ; 
	}
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       users = JSON.parse( data );
       var user = users["user" + pathparts[2]] 
	   if( user == undefined) { 
	       res.end( JSON.stringify( { "error" : "User does not exist" + pathparts[2] } ));
		   return ; 
	   }
       console.log( user );
       res.end( JSON.stringify(user));
	});
})

http.createServer(app).listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
    server();
});