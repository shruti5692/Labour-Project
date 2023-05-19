// Required dependencies
const express = require('express');
const app = express();
const mysql = require('mysql2');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const bodyParser = require('body-parser');
const port= 3000;
const flash = require('connect-flash');


// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edisup',
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Middleware for parsing request body
app.use(express.urlencoded({ extended: false }));

// Middleware for session handling
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Middleware for passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(
    {
      usernameField: 'phone',
      passwordField: 'password',
    },
    (phone, password, done) => {
      // Check if user with the given phone number exists in the database
      connection.query(
        'SELECT * FROM users WHERE phone = ?',
        [phone],
        (error, results) => {
          if (error) {
            console.error('Error executing MySQL query:', error);
            return done(error);
          }

          if (results.length === 0) {
            return done(null, false, { message: 'Incorrect phone number' });
          }

          const user = results[0];

          // Compare the provided password with the stored password (plaintext comparison)
          if (password === user.password) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Incorrect password' });
          }
        }
      );
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Fetch user from the database using the provided id
  connection.query(
    'SELECT * FROM users WHERE id = ?',
    [id],
    (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        return done(error);
      }

      if (results.length === 0) {
        return done(null, false);
      }

      const user = results[0];
      done(null, user);
    }
  );
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: false }));

// Root route
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Signup route
app.post('/signup', (req, res) => {
  console.log(req.body);
  const { firstName, lastName, phone, address, userType, password } = req.body;

  // Insert user data into the database
  connection.query(
    'INSERT INTO users (first_name, last_name, phone, address, user_type, password) VALUES (?, ?, ?, ?, ?, ?)',
    [firstName, lastName, phone, address, userType, password],
    (err, results) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).send('Error signing up');
        return;
      }

      res.send('Signup successful');
    }
  );
});

// Login route
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Middleware for checking if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Dashboard route (authenticated)
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.send('Welcome to the dashboard!');
});





// Login page route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup page route
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Signup form submission route
/*app.post('/signup', (req, res) => {
  const { firstName, lastName, phone, address, userType, password } = req.body;

  // Create a new user object
  const newUser = {
    firstName,
    lastName,
    phone,
    address,
    userType,
    password
  };

  // Insert the new user into the database
  connection.query('INSERT INTO users SET ?', newUser, (err, results) => {
    if (err) {
      console.error('Error inserting user into database:', err);
      return res.status(500).send('Error signing up');
    }

    console.log('User signed up successfully');
    res.status(200).send('Signup successful');
  });
});*/

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
