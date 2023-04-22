const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers.js');
const { users, urlDatabase } = require('./db.js');

const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

app.listen(PORT, () => {
  console.log(`tinyAPP is listening on port ${PORT}!`);
});

app.get('/', (req, res) => { // homepage
  const user = users[req.session.user_id];
  if (user) { // if user is logged in
    res.redirect('/urls'); // redirect to URLs page
  } else {
    res.redirect('/login'); // otherwise redirect to login page
  }
});

app.get('/urls', (req, res) => { // list of URLs page
  const userID = req.session.user_id;
  if (userID) { 
    let templateVars = {
      urls: urlsForUser(userID, urlDatabase),
      user: users[userID]
    };
    res.render('urls_index', templateVars);
  } else {
    let templateVars = {
      user: users[userID],
      error: 'Sorry, please login or register to access this website',
    };
    res.render('error', templateVars); // pass error message to error page
    return;
  }
});

app.get('/urls/new', (req, res) => { // new URL page
  const userID = req.session.user_id;
  let templateVars = {
    urls: urlDatabase,
    user: users[userID]
  };
  if (!userID) {
    res.redirect('/login');
    return;
  }
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => { // edit URL page
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  if (!userID) {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, please log in to edit or view your URL',
    };
    res.render('error', templateVars);
    return;
  } else if (userID === urlDatabase[shortURL].userID) { // if URL belongs to user
    let templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[userID]
    };
    res.render('urls_show', templateVars);
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, you do not have permission to view or edit this URL',
    };
    res.render('error', templateVars);
    return;
  }
});

app.get('/u/:id', (req, res) => { // the short link -- redirects to the long URL
  const url = urlDatabase[req.params.id];
  if (url) {
    const longURL = url.longURL;
    res.redirect(longURL);
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, the requested URL does not exist',
    };
    res.render('error', templateVars);
    return;
  }
});

app.get('/login', (req, res) => { // login page
  const userID = req.session.user_id;
  let templateVars = {
    user: users[userID]
  };
  if (userID) {
    res.redirect('/urls'); // redirect to URLs page if already logged in
    return;
  }
  res.render('login', templateVars);
});

app.get('/register', (req, res) => { // registration page
  const userID = req.session.user_id;
  let templateVars = {
    user: users[userID]
  };
  if (userID) {
    res.redirect('/urls');
    return;
  }
  res.render('register', templateVars);
});

app.post('/urls', (req, res) => { // POST new URL to database -- used in urls_new.ejs
  const userID = req.session.user_id;
  if (!userID) {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, you must be logged in to shorten URLs',
    };
    res.render('error', templateVars);
    return;
  }
  const shortID = generateRandomString();
  urlDatabase[shortID] = { 
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`/urls/${shortID}`);
});

app.post('/login', (req, res) => { // POST login -- used in login.ejs
  const email = req.body.email;
  const password = req.body.password;

  if (!getUserByEmail(email, users)) {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, the email address you entered can not be found',
    };
    res.render('error', templateVars);
    return;
  } else {
    for (let userID in users) {
      if (email === users[`${userID}`]['email'] && bcrypt.compareSync(password, users[`${userID}`]['password'])) {
        req.session.user_id = userID;
        res.redirect('/urls');
      } else {
        let templateVars = {
          user: users[req.session.user_id],
          error: 'Sorry, the password you have entered is incorrect',
        };
        res.render('error', templateVars);
        return;
      }
    }
  }
});

app.post('/logout', (req, res) => { // POST logout -- used in partials/_header.ejs
  req.session = null; // clear cookies
  res.redirect('/login');
});

app.post('/register', (req, res) => { // POST register new user -- used in register.ejs
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) { // if email or password are empty
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, the email address or password can not be blank',
    };
    res.render('error', templateVars);
    return;
  } else if (getUserByEmail(email, users)) { // if email already exists
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, the email address you have entered already exists',
    };
    res.render('error', templateVars);
    return;
  } else {
    const newUserID = generateRandomString();
    users[newUserID] = {
      id: newUserID,
      email: email,
      password: hashedPassword,
    };
    req.session.user_id = newUserID; // set cookie
  }
  res.redirect('/urls');
});

app.put('/urls/:id', (req, res) => { // PUT URLs -- used in urls_show.ejs
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  if (userID === urlDatabase[shortURL].userID) { // if URL belongs to user
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, you do not have permission to edit this URL',
    };
    res.render('error', templateVars);
    return;
  }
});

app.delete('/urls/:id/delete', (req, res) => { // DELETE URLs -- used in urls_index.ejs
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  if (userID === urlDatabase[shortURL].userID) { 
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      error: 'Sorry, you do not have permission to delete this URL',
    };
    res.render('error', templateVars);
    return;
  }
});