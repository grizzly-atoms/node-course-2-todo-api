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

  // db.collection('Todos').find({
  //   _id: new ObjectID('5bec5bdc1fcaa151402c2823')
  // }).toArray().then((docs) => {
  //   console.log('Todos');
  //   console.log(JSON.stringify(docs, undefined, 2));
  // }, (err) => {
  //   console.log('Unable to fetch todos', err);
  // });

  db.collection('Users').find({
    name: 'Josh'
  }).toArray().then((docs) => {
    console.log(`${docs.length} Todo(s)`);
    console.log(JSON.stringify(docs, undefined, 2));
  }, (err) => {
    console.log('Unable to fetch todos', err);
  });

  // db.collection('Todos').find().count().then((count) => {
  //   console.log(`Todos count: ${count}`);
  // }, (err) => {
  //   console.log('Unable to fetch todos', err);
  // });

  // db.close();
});