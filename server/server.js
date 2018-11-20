var express = require('express');
var bodyParser = require('body-parser');
const {ObjectId} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  // console.log(req.body);
  var todo = new Todo({
    text: req.body.text
  });
  todo.save().then((todo) => {
    res.send(todo);
  }, (err) => {
    res.status(400).send(err);
  });
});

app.get('/todos', (req, res) => {
  Todo.find({}).then((todos) => {
    res.send({todos});
  },
  (err) => {
    res.status(400).send(err);
  });
});

app.get('/todos/:id', (req, res) => {
  if(!ObjectId.isValid(req.params.id)) {
    res.status(404).send({
      errors: ['INVALID_ID']
    });
  }
  Todo.findById(req.params.id).then((todo) => {
    if(!todo) return res.status(404).send();
    res.send({todo});
  }, (err) => {
    res.status(400).send();
  });
});

app.delete('/todos/:id', (req, res) => {
  if(!ObjectId.isValid(req.params.id)) {
    res.status(404).send({
      errors: ['INVALID_ID']
    });
  }
  Todo.findByIdAndRemove(req.params.id).then((todo) => {
    if(!todo) return res.status(404).send();
    res.send({todo});
  });
});

app.listen(port, () => {
  console.log(`Started server on port ${port}`);
});

module.exports = {app};