// DB stuff
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const dbURI = process.env.dbURI;
const dbCollection = process.env.dbCollection;
const countingDocQuery = {"_id": mongodb.ObjectID("597da250734d1d58c9abd7f7")};

// exportations
module.exports.check = check;
module.exports.getDBEntry = getDBEntry;
module.exports.save = save;
module.exports.load = load;
module.exports.addHTTP = addHTTP;

/*
*check if an URL is already in database
*@params someLinkObj: url to check
*@params callback: function to handle the checkResult
*@return checkResult: a boolean
*/
function check(someLinkObj, callback) {
  MongoClient.connect(dbURI, function (err, db) {
    if (err) {
      callback(err);
      return;
    } 
    var collection = db.collection(dbCollection);
    
    collection.find(someLinkObj).toArray(function(err, result) {
      db.close();
      var checkResult = (result.length > 0)? true : false;
      callback(err, checkResult);
    });
  });
}

/*
*get linkID if linkObj is in database
*@params someLink: url to check
*@params callback (err, linkID)
*@return linkID:Integer
*/
function getDBEntry(someLinkObj, callback) {
  MongoClient.connect(dbURI, function (err, db) {
    if (err) callback(err);
    else {
      var collection = db.collection(dbCollection);
      
      collection.find(someLinkObj).toArray(function(err, documentArray) {
        if (err) callback(err);
        else {
          // return DBEntry also known as documentArray[0] to callback function
          if(documentArray.length > 0) callback(err, documentArray[0]);
          else callback(err, null);  
        }     
      });
    }
  });
}

/*
*save link to database
*@params linkObj: linkObj to save
*@params callback (err, savedDoc): function to handle the checkResult
*@return linkID:Integer
*/
function save(linkObj, callback) {
  MongoClient.connect(dbURI, function (err, db) {
    if (err) callback(err);
    else {
      var collection = db.collection(dbCollection);
      
      // first read the counting document to know the next available linkID
      collection.find(countingDocQuery).toArray(function(err, result) {
        if (err) callback(err);
        else {
        
          // create the new document
          var nextLinkID = result[0].nextLinkID;
          var totalLinks = result[0].totalLinks;
          var toSave = Object.assign({}, linkObj, {"linkID": nextLinkID})
     
          
          // actually save the document
          collection.insert(toSave, function(err, result) {
            if (err) callback(err);
            else {
              
              // update the counting document for the next save
              collection.update(countingDocQuery, {
                $set: {"nextLinkID": ++nextLinkID, "totalLinks": ++totalLinks}
              }, function(err) {
                if (err) callback(err);
                else {
                  
                  // close connection and return
                  db.close();
                  callback(err, toSave);
                }
              });
            }
          });
        }
      });
    }
  });
}

/*
* load link from database
*@params linkID: id to look for
*@params callback (err, DBEntry): function to handle the loaded document
*@return DBEntry
*/

function load(linkID, callback) {
  MongoClient.connect(dbURI, function (err, db) {
    if (err) callback(err);
    else {
      var collection = db.collection(dbCollection);
      var query = {
        "linkID": Number(linkID)
      };
      collection.find(query).toArray(function(err, result) {
        if (err) callback(err, null);
        else {
          if(result.length > 0) callback(err, result[0]);
          else callback(null, null); // if no entry found, return null error and null entry  
        }     
      });
    }
  });
}

function addHTTP(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}