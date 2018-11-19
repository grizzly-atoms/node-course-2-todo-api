var express = require('express');
var bodyParser = require('body-parser');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  console.log(req.body);
  var todo = new Todo({
    text: req.body.text
  });
  todo.save().then((todo) => {
    res.send(todo);
  }, (err) => {
    res.status(400).send(err);
  });
});

app.listen(3000, () => {
  console.log('Started server on port 3000');
});

// var newUser = new User({
//   email: 'foo@bar.com   '
// })

// newUser.save().then((user) => {
//   console.log('Saved user. ', JSON.stringify(user, undefined, 2));
// }, (err) => {
//   console.log('could not save user. ', JSON.stringify(err, undefined, 2));
// });

// var newTodo = new Todo({
//   text: 'Cook dinner',
//   completed: true,
//   completedAt: Date.now()
// });

// var newTodo = new Todo({
//   text: 'Blah dee blah blah blah dee blah '
// });

// newTodo.save().then((doc) => {
//   console.log('Saved todo: ', doc)
// }, (err) => {
//   console.log('Unable to save todo', err)
// });