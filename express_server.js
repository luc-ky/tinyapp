const { generateRandomString, getUserByEmail, urlsForUser  } = require('./helpers.js');

const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const urlDatabase = {};
const users = {};

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
    user: users[userID]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: users[userID]
  };
  if (!userID) {
    res.redirect('/login');
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403).send("Please log in to edit or view your URL");
    return;
  }
  if (!Object.keys(urlsForUser(userID, urlDatabase)).includes(req.params.id)) {
    res.status(401).send("Sorry, you do not have permission to view or edit this URL");
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[userID]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(401).send("Sorry, you must be logged in to shorten URLs.");
    return;
  }
  const shortID = generateRandomString();
  urlDatabase[shortID] = {
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`/urls/${shortID}`);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Sorry, the requested URL does not exist");
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  if (!Object.keys(urlsForUser(userID, urlDatabase)).includes(shortURL)) {
    res.status(401).send("Sorry, you do not have permission to view or edit this URL");
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  if (!Object.keys(urlsForUser(userID, urlDatabase)).includes(shortURL)) {
    res.status(401).send("Sorry, you do not have permission to view or edit this URL");
    return;
  }
  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!getUserByEmail(email, users)) {
    res.status(403).send("Email cannot be found");
  } else {
    for (let userID in users) {
      if (email === users[`${userID}`]["email"] && bcrypt.compareSync(password, users[`${userID}`]["password"])) {
        req.session.user_id = userID;
        res.redirect('/urls');
      } else {
        res.status(403).send("Incorrect password");
      }
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  if (userID) {
    res.redirect('/urls');
    return;
  }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const bcrypt = require("bcryptjs");
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email) {
    res.status(400).send("Invalid email");
  } else if (!password) {
    res.status(400).send("Invalid password");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("Email address already exists");
  } else {
    const newUserID = generateRandomString();
    users[newUserID] = {
      id: newUserID,
      email: email,
      password: hashedPassword,
    };
    req.session.user_id = newUserID;
  }
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  if (userID) {
    res.redirect('/urls');
    return;
  }
  res.render("login", templateVars);
});