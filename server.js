//////////////////
// NODE MODULES //
//////////////////

// Required node modules
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");

///////////////////////
// SERVER & DATABASE //
///////////////////////

// Application object
var app = express();

// Database object
var db;

// Constants
var mongodbURI = "mongodb://admin:admin@ds033956.mlab.com:33956/heroku_fx99rbrv";
var defaultPort = 8080;
var ObjectID = mongodb.ObjectID;
var CONTACTS_COLLECTION = "contacts";

// Configure static files (templates and scripts) used by application
app.use(express.static(__dirname + "/public"));

// Used to save parameters of request body as JSON structure
app.use(bodyParser.json());

// Connect to the database before starting the application server
mongodb.MongoClient.connect(process.env.MONGODB_URI || mongodbURI, function (err, database) {
    // If connection fails, print errors on console and exit application
    if (err) {
        console.log(err);
        process.exit(1);
    }
    // Otherwise, store database object and start application
    db = database;
    console.log("Database connection ready");
    var server = app.listen(process.env.PORT || defaultPort, function () {
        var port = server.address().port;
        console.log("App running on port", port);
    });
});

////////////////////
// ERROR HANDLING //
////////////////////

// Generic error handler used by all API methods
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

/////////////////
// API METHODS //
/////////////////

// Get all contacts
app.get("/contacts", function(req, res) {
    db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get contacts");
        } else {
            res.status(200).json(docs);
        }
    });
});

// Create new contact
app.post("/contacts", function(req, res) {
    var newContact = req.body;
    newContact.createDate = new Date();
    if (!(req.body.firstName || req.body.lastName)) {
        handleError(res, "Invalid user input", "Must provide a first or last name", 400);
    }
    db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new contact");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

// Get contact by ID
app.get("/contacts/:id", function(req, res) {
    db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get contact");
        } else {
            res.status(200).json(doc);
        }
    });
});

// Update contact by ID
app.put("/contacts/:id", function(req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;
    db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update contact");
        } else {
            res.status(204).end();
        }
    });
});

// Delete contact by ID
app.delete("/contacts/:id", function(req, res) {
    db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete contact");
        } else {
            res.status(204).end();
        }
    });
});
