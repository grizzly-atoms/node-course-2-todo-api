const {SHA256} = require('crypto-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')

var password = '123abc!';

bcrypt.genSalt(17, (err, salt) => {
  bcrypt.hash(password, salt, (err, hash) => {
    console.log(hash);
    bcrypt.compare(password, hash, (err, res) => {
      console.log(res);
    }, function(progress, x) {
      console.log("Progress: ", progress);
    });
  })
});

var hashedPassword = '$2a$10$a6O5EPfBh4SyKcOEw2xIjOFO7yelbBXRP7tOtcKjyv5RVTsTtBEXK';

// bcrypt.compare(password, hashedPassword, (err, res) => {
//   console.log(res);
// }, function(progress) {
//   console.log("Progress: ", progress);
// });

// var data = {
//   id: 10
// }

// secret = 'secret123abc'

// var token = jwt.sign(data, secret);
// console.log("Token: ", token);

// var decoded = jwt.verify(token, secret);
// console.log("Decoded: ", decoded);

// var message = 'I am user number 3';
// var hash = SHA256(message).toString();

// console.log(`Message: ${message}`);
// console.log(`Hash: ${hash}`);

// var data = {
//   id: 4
// };

// var token = {
//   data,
//   hash: SHA256(JSON.stringify(data) + 'somesecret').toString()
// }

// token.data.id = 5;
// token.hash = SHA256(JSON.stringify(data)).toString()

// var resultHash = SHA256(JSON.stringify(token.data) + 'somesecret').toString();

// if(resultHash === token.hash) {
//   console.log('Data was not changed');
// } else {
//   console.log('Data was changed.  Do not trust');
// }