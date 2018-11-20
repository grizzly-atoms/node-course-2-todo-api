const {ObjectId} = require('mongodb');
const {mongoose} = require('./../server/db/mongoose')
const {Todo} = require('./../server/models/todo')
const {User} = require('./../server/models/user')

var id = '5bf34bff7061055b30f087f51';
// if(!ObjectId.isValid(id)) {
//   console.log('ID not valid');
// }

// Todo.find({
//   _id: id
// }).then((todos) => {
//   console.log('Todos: ', todos);
// });

// Todo.findOne({
//   _id: id
// }).then((todo) => {
//   console.log('Todo: ', todo);
// });

// Todo.findById(id).then((todo) => {
//   if(!todo) {
//     return console.log ('id not found');
//   }
//   console.log('Todo: ', todo);
// }).catch((e) => console.log(e));

var userId = '5bf3155b2d7150a61bf319dc';

User.findById(userId).then((user) => {
  if(!user) {
    return console.log('user not found');
  }
  console.log(JSON.stringify(user, undefined, 2));
}, (e)=> console.log(e));