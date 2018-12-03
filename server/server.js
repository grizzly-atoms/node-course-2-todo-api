require('./config/config')

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcryptjs');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

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

app.post('/users', (req, res) => {
  var dirtyBody = req.body;
  var cleanBody = _.pick(dirtyBody, ['email', 'password']);
  if (!_.isEqual(cleanBody, _.omit(dirtyBody, ['_id']))) {
    return res.status(400).send({ errors: ['INVALID_PROPERTIES']});
  }

  var newUser = new User(cleanBody);
  newUser.save().then(() => {
    return newUser.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send({ user: newUser });
  }).catch((err) => {
    if (err.name == 'MongoError' && err.code == 11000) {
      return res.status(409).send({errors: ['DUPLICATE_RECORD']})
    } else if (err.name == 'ValidationError' ) {
      return res.status(422).send({errors: []});
    }
    console.log(err);
    res.status(400).send(err);
  });
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req,res) => {
  User.findByCredentials(req.body.email, req.body.password).then((user) => {
    user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send({user});
    })
  }).catch((err) => {
    res.status(403).send();
  });
});

app.listen(port, () => {
  console.log(`Started server on port ${port}`);
});

module.exports = {app};