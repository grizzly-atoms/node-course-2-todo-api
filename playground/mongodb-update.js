// const MongoClient = require('mongodb').MongoClient;

// Object destructuring
// var user = {name: 'Josh', age: 39}
// var {name} = user
// console.log(name);
const {MongoClient, ObjectID} = require('mongodb');

// Mongo allows us to create id's using its own ObjectID generation
// var obj = new ObjectID();
// console.log(obj.getTimestamp());

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
  if(err) {
    return console.log('Could not connect to MongoDB server');
  }
  console.log('Connected to MongoDB server');

  // findOneAndUpdate
  // db.collection('Todos').findOneAndUpdate({
  //   _id: new ObjectID('5bec5bdc1fcaa151402c2823')
  // }, {
  //   $set: {
  //     completed: true
  //   }
  // }, {
  //     returnOriginal: false
  // }).then((result) => {
  //   console.log(result);
  // });

  db.collection('Users').findOneAndUpdate({
    _id: new ObjectID('5bee2531ff6b2a5c8b618194')
  }, {
    $set: {
      name: 'Josh'
    },
    $inc: {
      age: 2
    }
  }, {
      returnOriginal: false
  }).then((result) => {
    console.log(result);
  });

  // db.close();
});