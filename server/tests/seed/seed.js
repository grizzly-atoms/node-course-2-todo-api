const {ObjectId} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();

const users = [
  {
    _id: userOneId,
    email: 'user1@example.com',
    password: 'Password123!',
    tokens: [{
      access: 'auth',
      token: jwt.sign({
        _id: userOneId,
        access: 'auth'
      }, process.env.JWT_SECRET).toString()
    }]
  },
  {
    _id: userTwoId,
    email: 'user2@example.com',
    password: 'Password123!'
  }];

  const todos = [{
    _id: (new ObjectId).toString(),
    text: 'eat me',
    _creator: userOneId
  },
  {
    _id: (new ObjectId).toString(),
    text: 'drink me',
    _creator: userTwoId
  }];

  const populateTodos = (done) => {
    Todo.remove({}).then(() => {
      return Todo.insertMany(todos);
    }).then(() => done());
  }

  const populateUsers = (done) => {
    User.remove({}).then(() => {
      var userOne = new User(users[0]).save();
      var userTwo = new User(users[1]).save();
      Promise.all([userOne, userTwo]).then(() => done());
    });
  };

  module.exports = {
    todos,
    users,
    populateTodos,
    populateUsers
  }