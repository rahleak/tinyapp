const express = require("express");
const bcrypt = require('bcryptjs');
const getUserByEmail = require('./helpers')
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const cookieSession = require('cookie-session');

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//OUR DATABASE
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },

  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  },
  "9pm4rK": {
    longURL: "http://example.edu",
    userID: "user2RandomID"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//CHECK YOUR DATABASE

app.get('/users.json', (req, res) => {
  res.json(users);
});

//GET ROUTES

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const userURLs = urlsForUser(userID)
  const templateVars = {
    urls: userURLs,
    user: users[userID],
  };

  console.log(urlDatabase);

  if (!users[userID]) {
    res.redirect('/login');
    return;
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.userID
  const templateVars = {
    user: users[userID],
    email: req.cookies.email,
  };

  if (!users[userID]) {
    res.redirect('/login');
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  console.log(urlDatabase);
  console.log(req.params.shortURL);
  const userID = req.session.userID;
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    email: req.cookies.email,
    user: users[userID] 
  };

  if (!users[userID]) {
    res.redirect('/login');
  }

  res.render("urls_shows", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.session.userID;
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    email: req.cookies.email,
    user: users[userID] 
  };

  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.session.userID
  const templateVars = {
    user: users[userID],
    userID: req.session.userID,
    email: req.cookies.email
  };

if (users[userID]) {
  res.redirect('/urls');
  return;
} 
  res.render("register", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

//POST ROUTES

app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString(6)
  console.log(req.body.longURL);
  res.redirect(`/urls/${tinyURL}`);         
  urlDatabase[tinyURL] = {
    userID: req.session.userID,
    longURL: req.body.longURL
  }
  console.log(urlDatabase);
});

app.post("/urls/:shortURL", (req, res)  => {
  urlDatabase[req.params.shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  }
  res.redirect("/urls");
})


app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.userID;
  const userObject = users[userID];

  if (!userObject) {
    return res.status(403).send("You need to have an account to perform this action.");
  }
  if (userObject["id"] === userID) {
    delete urlDatabase[req.params.shortURL];
  } else {
    return res.send("User not authorized to make changes");
  }
  console.log(users[userID])
  res.redirect("/urls");
});

app.post("/u/:shortURL", (req, res) => {
  urlDatabase[req.params['shortURL']] = req.body['longURL']
  console.log(urlDatabase);
  res.redirect(`/urls/${req.params['shortURL']}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (password === "") {
    res.status(403).send("Password can't be empty!")
  }

  const user = getUserByEmail(email, users);

  console.log('test', user)
  if (!user || !bcrypt.compareSync(password, user['password'])) {
    res.status(403).send("Email or password is incorrect!")
    return
  }
  if (user && bcrypt.compareSync(password, user['password'])) {
    req.session.userID = user['id'];
    res.redirect("/urls" ) 
    return
  }
  res.redirect(`/urls`); 
});

app.post("/logout", (req, res) => {
  res.clearCookie('email');
  req.session.userID = null;
  res.redirect(`/urls`); 
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "") {
    res.status(403).send("Email can't be empty!");
    return;
  }

  for (let userID in users){
    const user = users[userID];

    if (user.email === email) {
      res.status(403).send('Sorry, that email already exists!');
      return;
    }
  }

  userID = generateRandomString(8);
  newUser = {
    id: userID, 
    email: email, 
    password: hashedPassword
  };

  users[userID] = newUser;

  req.session.userID = userID;
  res.redirect('/urls');
  console.log(users[userID]);
});

//FUNCTIONS THAT HELP
function generateRandomString(length) {

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function urlsForUser(userID) {
  let userURLS = {};

  for  (let url in urlDatabase) {
    if (urlDatabase[url]['userID'] === userID) {
      userURLS[url] = urlDatabase[url]
    }
  }
  return userURLS;
}
