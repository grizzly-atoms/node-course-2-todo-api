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

  // db.collection('Todos').insertOne({
  //   text: 'Something to do',
  //   completed: false
  // }, (err, result) => {
  //   if(err) {
  //     return console.log('unable to insert todo', err);
  //   }
  //   console.log(JSON.stringify(result.ops, undefined, 2));
  // });

  // db.collection('Users').insertOne({
  //   name: 'Josh',
  //   age: 38,
  //   location: 'South Dakota'
  // }, (err, result) => {
  //   if(err){
  //     return console.log('unable to insert user', err);
  //   }
  //   console.log(JSON.stringify(result.ops[0]._id.getTimestamp(), undefined, 2));
  // });

  db.close();
});