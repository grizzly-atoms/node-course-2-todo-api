var mongoose = require('mongoose');

// Configure mongoose to use global promsise provider
mongoose.Promise = global.Promise;

// Hold connection and manage queries
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose};