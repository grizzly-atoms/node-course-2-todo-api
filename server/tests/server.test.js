const _ = require('lodash');
const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');
const tk = require('timekeeper');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');

const todos = [{
  _id: (new ObjectId).toString(),
  text: 'eat me'
},
{
  _id: (new ObjectId).toString(),
  text: 'drink me'
}];

const users = [
  {
    _id: (new ObjectId).toString(),
    email: 'user1@example.com',
    password: 'Password123!'
  },
  {
    _id: (new ObjectId).toString(),
    email: 'user2@example.com',
    password: 'Password123!'
  }];

beforeEach(() => {
  return Todo.remove({})
    .then(() => {
      return Todo.insertMany(todos);
    });
});

beforeEach(() => {
  return User.remove({})
  .then(() => {
    return User.insertMany(users);
  });;
});

describe('POST /todos', () => {
  it('creates new todos', (done) => {
    var text = 'Test todo text';
    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text)
          done();
        }).catch((e) => done(e));
      });
  });

  it('does not create a todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('gets all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('gets the expected todo', (done) => {
    var todo = todos[0];
    request(app)
    .get(`/todos/${todo._id}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(todo._id);
      expect(res.body.todo.text).toBe(todo.text);
    })
    .end(done);
  });

  it('returns a friendly error when the id is not found', (done) => {
    var missingId = '5bf2f0230edc174114f8a1ff';
    request(app)
      .get(`/todos/${missingId}`)
      .expect(404)
      .end(done);
  });

  it('returns a friendly error when the id is not valid', (done) => {
    var invalidId = 'invalid id';
    request(app)
      .get(`/todos/${invalidId}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.errors[0]).toBe('INVALID_ID');
      })
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('deletes a todo by id', (done) => {
    var todo = todos[1];
    request(app)
    .delete(`/todos/${todo._id}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(todo._id);
      expect(res.body.todo.text).toBe(todo.text);
    })
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      Todo.findById(todo._id).then((todo) => {
        expect(todo).toNotExist();
        done();
      }).catch((e) => done(e));
    });
  });

  it('returns a friendly error when the id is not found', (done) => {
    var missingId = '5bf2f0230edc174114f8a1ff';
    request(app)
      .delete(`/todos/${missingId}`)
      .expect(404)
      .end(done);
  });

  it('returns a friendly error when the id is not valid', (done) => {
    var invalidId = 'invalid id';
    request(app)
      .delete(`/todos/${invalidId}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.errors[0]).toBe('INVALID_ID');
      })
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('updates todos by id', (done) => {
    tk.freeze(Date.now())
    var todo = todos[0];
    todo.text = 'do not ' + todo.text;
    todo.completed = true;
    request(app)
      .patch(`/todos/${todo._id}`)
      .send(todo)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todo.text, 'Expected updated record to be in response');
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        Todo.findById(todo._id).then((updatedTodo) => {
          expect(updatedTodo.text).toBe(todo.text, 'Expected record to be updated in database');
          expect(updatedTodo.completed).toBe(todo.completed, 'Expected record to be updated in database');
          expect(updatedTodo.completedAt).toBe(Date.now());
          tk.reset();
          done();
        }).catch((e) => done(e));
      });
    });

    it('clears `completedAt` when completed is marked as false', (done) => {
      var completedTodo = {
        _id: (new ObjectId).toString(),
        text: 'completed todo',
        completed: true,
        completedAt: Date.now()
      }
      Todo.create(completedTodo);
      completedTodo.completed = false;
      delete completedTodo.completedAt;

      request(app)
        .patch(`/todos/${completedTodo._id}`)
        .send(completedTodo)
        .expect(200)
        .expect((res) => {
          expect(res.body.completedAt).toBe(undefined);
        })
        .end(done);
    });

  it('only updates allowed properties', (done) => {
    var originalTodo = todos[0];
    var todo = _.clone(originalTodo);
    todo._id = (new ObjectId).toString();
    todo.completedAt = 1234;
    request(app)
      .patch(`/todos/${originalTodo._id}`)
      .send(todo)
      .expect(400)
      .expect((res) => {
        expect(res.body.todo).toNotExist();
        expect(res.body.errors[0]).toBe('INVALID_PROPERTIES');
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        Todo.findById(originalTodo._id).then((updatedTodo) => {
          expect(originalTodo).toExist();
          expect(updatedTodo.completedAt).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('returns a 404 when id is not found', (done) => {
    var missingTodo = {
      _id: (new ObjectId).toString(),
      text: 'some text'
    }
    request(app)
      .patch(`/todos/${missingTodo._id}`)
      .send(missingTodo)
      .expect(404)
      .end(done);
  })

  it('returns a 404 when id is invalid', (done) => {
    var invalidTodo = {
      _id: 'invalid id',
      text: 'some text'
    }
    request(app)
      .patch(`/todos/${invalidTodo._id}`)
      .send(invalidTodo)
      .expect(404)
      .end(done);
  })
});

describe('POST /users', () => {
  it('creates users', (done) => {
    var email = 'test@example.com';
    var password = 'Password123!';
    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).toBe(email);
        expect(res.body.user.password).toBe(password);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.find({email}).then((users) => {
          expect(users.length).toBe(1);
          expect(users[0].email).toBe(email)
          expect(users[0].password).toBe(password)
          done();
        }).catch((e) => done(e));
      });
  });

  it('does not create users with duplicate emails', (done) => {
    user = users[0];
    request(app)
      .post('/users')
      .send(user)
      .expect(409)
      .expect((res) => {
        expect(res.body.errors[0]).toBe('DUPLICATE_RECORD');
      })
      .end(done);
  });

  it('only creates users with valid values', (done) => {
    user = {
      email: 'invalid@example.com',
      password: 'Password1234!',
      invalidProperty: 'invalid'
    };
    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .expect((res) => {
        expect(res.body.errors[0]).toBe('INVALID_PROPERTIES');
      })
      .end(done);
  });

  describe('Password Requirements', () => {
    it('requires passwords of at least 6 characters', (done) => {
      tooShortPassword = 'Pas1!'
      user = {
        email: 'test@example.com',
        password: tooShortPassword
      };
      request(app)
        .post('/users')
        .send(user)
        .expect(422)
        .end(done);
    });
  });

});