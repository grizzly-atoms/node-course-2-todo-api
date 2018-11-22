require('./config/config')

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectId} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
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
  }, (err) => {
    res.status(400).send();
  });
});

app.patch('/todos/:id', (req, res) => {
  var id = req.params.id;

  var dirtyBody = req.body;
  var cleanBody = _.pick(dirtyBody, ['text', 'completed']);
  if (!_.isEqual(cleanBody, _.omit(dirtyBody, ['_id']))) {
    return res.status(400).send({ errors: ['INVALID_PROPERTIES']});
  }

  if(!ObjectId.isValid(id)) {
    return res.status(404).send({
      errors: ['INVALID_ID']
    });
  }

  if(_.isBoolean(cleanBody.completed)){
    cleanBody.completedAt =  cleanBody.completed ? Date.now() : null;
  }

  Todo.findByIdAndUpdate(id, {
    $set: cleanBody
  }, {
    new: true
  }).then((todo) => {
    if(!todo) return res.status(404).send();
    res.send({todo: todo});
  }, (err) => {
    console.log(err);
  });
});

app.listen(port, () => {
  console.log(`Started server on port ${port}`);
});

module.exports = {app};