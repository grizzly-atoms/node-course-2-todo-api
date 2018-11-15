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

  // deleteMany
  // db.collection('Todos').deleteMany({text: 'eat lunch'}).then((res) => {
  //   console.log(res);
  // });

  db.collection('Users').deleteMany({name: 'Josh'}).then((res) => {
    console.log(res);
  });

  // deleteOne
  // db.collection('Todos').deleteOne({text: 'eat lunch'}).then((res) => {
  //   console.log(res);
  // });

  // findOneAndDelete
  // db.collection('Todos').findOneAndDelete({text: 'eat lunch'}).then((res) => {
  //   console.log(res);
  // });

  db.collection('Users').findOneAndDelete({
    _id: new ObjectID('5bec98d147352f5674bba5b4')
  }).then((res) => {
    console.log(res);
  }, (err) => {
    console.log('Could not find and delete record. ', err)
  });

  // db.close();
});