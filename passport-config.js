const LocalStrategy = require('passport-local').Strategy;

function initialize(passport, getUserByEmail, getUserById) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      getUserByEmail(email)
        .then((user) => {
          if (!user) {
            return done(null, false, { message: 'Incorrect email' });
          }

          if (password === user.password) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Incorrect password' });
          }
        })
        .catch((err) => {
          return done(err);
        });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    getUserById(id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  });
}

module.exports = initialize;
