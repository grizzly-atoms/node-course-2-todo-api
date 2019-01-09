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

describe('TODOs', () => {

  let token = users[0].tokens[0].token;

  describe('POST /todos', () => {
    it('creates new todos', async () => {
      let text = 'Test todo text';
      await request(app)
        .post('/todos')
        .set('x-auth', token)
        .send({text})
        .expect(200)
        .expect((res) => {
          expect(res.body.text).toBe(text);
        })

      savedTodos = await Todo.find({text});
        expect(savedTodos.length).toBe(1);
        expect(savedTodos[0].text).toBe(text)
        expect(savedTodos[0]._creator.toString()).toBe(users[0]._id.toString())
    });

    it('does not create a todo with invalid body data', async () => {
      await request(app)
        .post('/todos')
        .set('x-auth', token)
        .send({})
        .expect(400);

      savedTodos = await Todo.find();
      expect(savedTodos.length).toBe(2);
    });

    it('requires user to be logged in to create todo', async () => {
      await request(app)
        .post('/todos')
        .send()
        .expect(401);
    });
  });

  describe('GET /todos', () => {
    it('gets the correct todos', async () => {
      await request(app)
        .get('/todos')
        .set('x-auth', token)
        .expect(200)
        .expect((res) => {
          expect(res.body.todos.length).toBe(1);
          expect(res.body.todos[0]._id).toBe(todos[0]._id)
          expect(res.body.todos[0]._creator.toString()).toBe(users[0]._id.toString())
        });
    });

    it('requires login', async () => {
      await request(app)
        .get('/todos')
        .expect(401)
        .expect((res) => {
          expect(res.body.todos).toBe(undefined);
        });
    });
  });

  describe('GET /todos/:id', () => {
    it('gets the expected todo', async () => {
      let todo = todos[0];
      await request(app)
      .get(`/todos/${todo._id}`)
      .set('x-auth', token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(todo._id);
        expect(res.body.todo.text).toBe(todo.text);
      });
    });

    it('returns a friendly error when the id is not found', async () => {
      let missingId = '5bf2f0230edc174114f8a1ff';
      await request(app)
        .get(`/todos/${missingId}`)
        .set('x-auth', token)
        .expect(404);
    });

    it('returns a friendly error when the id is not valid', async () => {
      let invalidId = 'invalid id';
      await request(app)
        .get(`/todos/${invalidId}`)
        .set('x-auth', token)
        .expect(404)
        .expect((res) => {
          expect(res.body.errors[0]).toBe('INVALID_ID');
        });
    });

    it('requires login', async () => {
      let todo = todos[0];
      await request(app)
      .get(`/todos/${todo._id}`)
      .expect(401);
    })
  });

  describe('DELETE /todos/:id', () => {
    it('deletes a todo by id', async () => {
      let todo = todos[0];
      await request(app)
        .delete(`/todos/${todo._id}`)
        .set('x-auth', token)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo._id).toBe(todo._id);
          expect(res.body.todo.text).toBe(todo.text);
        })

      deletedTodo = await Todo.findById(todo._id)
      expect(deletedTodo).toNotExist();
    });

    it('returns a friendly error when the id is not found', async () => {
      let missingId = '5bf2f0230edc174114f8a1ff';
      await request(app)
        .delete(`/todos/${missingId}`)
        .set('x-auth', token)
        .expect(404);
    });

    it('returns a friendly error when the id is not valid', async () => {
      let invalidId = 'invalid id';
      await request(app)
        .delete(`/todos/${invalidId}`)
        .set('x-auth', token)
        .expect(404)
        .expect((res) => {
          expect(res.body.errors[0]).toBe('INVALID_ID');
        });
    });

    it('requires login', async () => {
      let todo = todos[0];
      await request(app)
        .delete(`/todos/${todo._id}`)
        .expect(401);

      deletedTodo = await Todo.findById(todo._id)
      expect(deletedTodo._id.toString()).toBe(todo._id.toString());
    });

    it('cannot delete todos owned by other users', async () => {
      let todo = todos[1];
      await request(app)
        .delete(`/todos/${todo._id}`)
        .set('x-auth', token)
        .expect(404);

      deletedTodo = await Todo.findById(todo._id)
      expect(deletedTodo._id.toString()).toBe(todo._id.toString());
    });
  });

  describe('PATCH /todos/:id', () => {
    it('updates todos by id', async () => {
      tk.freeze(Date.now())
      let todo = todos[0];
      todo.text = 'do not ' + todo.text;
      todo.completed = true;
      await request(app)
        .patch(`/todos/${todo._id}`)
        .set('x-auth', token)
        .send(todo)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.text).toBe(todo.text, 'Expected updated record to be in response');
        })

      updatedTodo = await Todo.findById(todo._id)
      expect(updatedTodo.text).toBe(todo.text, 'Expected record to be updated in database');
      expect(updatedTodo.completed).toBe(todo.completed, 'Expected record to be updated in database');
      expect(updatedTodo.completedAt).toBe(Date.now());
      tk.reset();
    });

    it('clears `completedAt` when completed is marked as false', async () => {
      var completedTodo = {
        _id: (new ObjectId).toString(),
        text: 'completed todo',
        completed: true,
        completedAt: Date.now(),
        _creator: users[0]._id
      }
      Todo.create(completedTodo);
      completedTodo.completed = false;
      delete completedTodo.completedAt;

      await request(app)
        .patch(`/todos/${completedTodo._id}`)
        .set('x-auth', token)
        .send(completedTodo)
        .expect(200)
        .expect((res) => {
          expect(res.body.completedAt).toBe(undefined);
        });
    });

    it('only updates allowed properties', async () => {
      let originalTodo = todos[0];
      let todo = _.clone(originalTodo);
      todo._id = (new ObjectId).toString();
      todo.completedAt = 1234;
      await request(app)
        .patch(`/todos/${originalTodo._id}`)
        .send(todo)
        .set('x-auth', token)
        .expect(400)
        .expect((res) => {
          expect(res.body.todo).toNotExist();
          expect(res.body.errors[0]).toBe('INVALID_PROPERTIES');
        })

      updatedTodo = await Todo.findById(originalTodo._id)
      expect(originalTodo).toExist();
      expect(updatedTodo.completedAt).toNotExist();
    });

    it('returns a 404 when id is not found', async () => {
      var missingTodo = {
        _id: (new ObjectId).toString(),
        text: 'some text'
      }
      await request(app)
        .patch(`/todos/${missingTodo._id}`)
        .set('x-auth', token)
        .send(missingTodo)
        .expect(404)
    })

    it('returns a 404 when id is invalid', async () => {
      var invalidTodo = {
        _id: 'invalid id',
        text: 'some text'
      }
      await request(app)
        .patch(`/todos/${invalidTodo._id}`)
        .set('x-auth', token)
        .send(invalidTodo)
        .expect(404)
    })

    it('requires login', async () => {
      let todo = todos[0];
      await request(app)
        .patch(`/todos/${todo._id}`)
        .expect(401)
    });

    it('cannot update todos owned by other users', async () => {
      let todo = todos[1];
      await request(app)
        .patch(`/todos/${todo._id}`)
        .set('x-auth', token)
        .expect(404)
    });
  });
});

describe('Users', () => {
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
          expect(jwt.verify(res.headers['x-auth'], process.env.JWT_SECRET)).toBeA('object');
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

            var verifiedToken = jwt.verify(users[0].tokens[0].token, process.env.JWT_SECRET);
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
          expect(jwt.verify(res.headers['x-auth'], process.env.JWT_SECRET)).toBeA('object');
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
});