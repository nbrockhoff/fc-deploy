const mongoose = require('mongoose');

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });

// Connect to our Database and handle an bad connections
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
<<<<<<< HEAD
  console.error(`${err.message}`);
});

=======
  console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// READY?! Let's go!
>>>>>>> 639d046b6fc73103ce9a1f8891222334c8c327ed

// import all of our models
require('./models/Farm');
require('./models/User');
require('./models/Review');

<<<<<<< HEAD
// Start our app
=======
// Start our app!
>>>>>>> 639d046b6fc73103ce9a1f8891222334c8c327ed
const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});