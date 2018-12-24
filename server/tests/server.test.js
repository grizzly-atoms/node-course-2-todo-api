const _ = require('lodash');
const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');
const tk = require('timekeeper');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, users, populateTodos, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

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
        expect(res.body.user.password).toNotExist();
        expect(res.body.user.token).toNotExist();
        expect(res.body.user.__v).toNotExist();
        expect(res.headers['x-auth']).toBeA('string');
        expect(jwt.verify(res.headers['x-auth'], 'abc123')).toBeA('object');
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.find({email}).then((users) => {
          expect(users.length).toBe(1);
          expect(users[0].email).toBe(email);

          var stored_password = users[0].password;
          bcrypt.compare(password, stored_password, (err, res) => {
            expect(res).toBe(true);
          });

          expect(users[0].tokens[0].access).toBe('auth');

          var verifiedToken = jwt.verify(users[0].tokens[0].token, 'abc123');
          expect(verifiedToken._id).toBe(users[0]._id.toString());
          expect(verifiedToken.access).toBe('auth');

          done();
        }).catch((e) => done(e));
      });
  });

  it('does not create users with duplicate emails', (done) => {
    user = users[0];
    request(app)
      .post('/users')
      .send({
        email: user.email,
        password: user.password
      })
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

describe('GET /users/me', () => {
  it('should return a user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .send()
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toString())
        expect(res.body.email).toBe(users[0].email)
      })
      .end(done);
  });
  it('should return a 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .send()
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({})
      })
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login', (done) => {
    request(app)
      .post('/users/login')
      .send(_.pick(users[0], ['email', 'password']))
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).toBe(users[0].email)
        expect(jwt.verify(res.headers['x-auth'], 'abc123')).toBeA('object');
      })
      .end(done);
  });

  it('should fail login when passing an invalid password', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[0].email,
        password: 'invalidpassword'
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.user).toEqual(undefined)
      })
      .end(done);
  })

  describe('DELETE /users/login', () => {
    it('should log out', async () => {
      let token = users[0].tokens[0].token

      await request(app)
        .delete('/users/login')
        .set('x-auth', token)
        .expect(200);

      await request(app)
        .delete('/users/login')
        .set('x-auth', token)
        .expect(401)
    });

    it('should should fail with invalid credentials', async () => {
      await request(app)
        .delete('/users/login')
        .expect(401);
    });
  });
});