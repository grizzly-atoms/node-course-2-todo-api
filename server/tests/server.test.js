const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
  _id: (new ObjectId).toString(),
  text: 'eat me'
},
{
  _id: (new ObjectId).toString(),
  text: 'drink me'
}];

beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
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

  it('should not create a todo with invalid body data', (done) => {
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
  it('should get all todos', (done) => {
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
  it('should get the expected todo', (done) => {
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

  it('should return a friendly error when the id is not found', (done) => {
    var missingId = '5bf2f0230edc174114f8a1ff';
    request(app)
      .get(`/todos/${missingId}`)
      .expect(404)
      .end(done);
  });

  it('should return a friendly error when the id is not valid', (done) => {
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
      Todo.find().then((todos) => {
        expect(todos.length).toBe(1);
        done();
      }).catch((e) => done(e));
    });
  });

  it('should return a friendly error when the id is not found', (done) => {
    var missingId = '5bf2f0230edc174114f8a1ff';
    request(app)
      .delete(`/todos/${missingId}`)
      .expect(404)
      .end(done);
  });

  it('should return a friendly error when the id is not valid', (done) => {
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