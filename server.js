'use strict';
// declare the requirements
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const database = require('./helpers.js');
const addHTTP = require('./helpers.js').addHTTP;


// DB stuff
const MongoClient = require("mongodb").MongoClient;
const dbURI = process.env.dbURI;
const dbCollection = process.env.dbCollection;

// enable cross origins, parsing of form data, public folder 
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
  res.sendFile(process.cwd()+ '/public/index.html');
})


app.post('/save', (req, res, next) => {
  var URLtoSave = req.body.originalLink;
  var linkObj = req.body;
  

  // test if correct format
  var regex = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
  if (!URLtoSave.match(regex))
    res.send("Invalid URL");
  
  
  database.check(linkObj, function (err, alreadyInDB) {
    if (err) throw err;
    // if link already in DB, return linkID to browser
    if (alreadyInDB){
      database.getDBEntry(linkObj, function(err, DBEntry) {
        if (err) throw err;
        res.json(Object.assign({},DBEntry,{"maskedLink": "https://lngka-maskurl.glitch.me/load/" + DBEntry.linkID}));
      });
    }
    
    // else save and return saved object to browser (savedDoc, whatever man..)
    else {
      database.save(linkObj, function (err, savedDoc) {
        if (err) throw err;
        res.json(savedDoc);
      });
    }
  });
}); 

// path to load saved things
app.get('/load/:linkID', (req, res) => {
  var linkID = req.params.linkID;
  database.load(linkID, function (err, DBEntry) {
    if (err) throw err;
    if (DBEntry === null) res.status(404).send("LinkID " + linkID + " not found.");
    
    // call addHTTP to add "http://" if the link is without protocol, e.g. such string: "google.com"
    // addHTTP("google.com") return "http://google.com"
    // this is to prevent res.redirect() mistakenly redirect to an internal route
    else res.redirect(addHTTP(DBEntry.originalLink));
  })
});

// path to view saved things
app.get('/view/:linkID', (req, res) => {
  var linkID = req.params.linkID;
  database.load(linkID, function (err, DBEntry) {
    if (err) throw err;
    if (DBEntry === null) res.status(404).send("LinkID " + linkID + " not found.");
    else res.json(DBEntry);
  })
});



app.listen(process.env.PORT, ()=>{
  console.log("Server listens at port " + process.env.PORT)
})