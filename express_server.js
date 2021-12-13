const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser")
app.use(cookieParser());

app.set("view engine", "ejs");

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
}

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(users);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userID = req.cookies['userID']
  const userURLs = urlsForUser(userID)
  const templateVars = {
    urls: userURLs,
    user: users[req.cookies['userID']],

    
  };

  console.log(urlDatabase);

  if (!users[userID]) {
    res.redirect('/login');
    return;
  }

  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const userID = req.cookies['userID']
  
  const templateVars = {
    user: users[req.cookies['userID']],
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
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    email: req.cookies.email,
    user: users[req.cookies['userID']] 
  };

  if (!users[req.cookies.userID]) {
    res.redirect('/login')
  }

  res.render("urls_shows", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    email: req.cookies.email,
    user: users[req.cookies['userID']] 
  };

  res.render("login", templateVars)
});

app.get("/register", (req, res) => {
  
  const userID = req.cookies['userID']

  const templateVars = {
    user: users[req.cookies['userID']],
    userID: req.cookies[userID],
    email: req.cookies.email
  };

if (users[userID]) {
  res.redirect('/urls');
  return;
} 

  res.render("register", templateVars);
});

app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString(6)
  console.log(req.body.longURL);  // Log the POST request body to the console
  res.redirect(`/urls/${tinyURL}`);         // 301 WAS  HERE! Respond with 'Ok' (we will replace this)
  urlDatabase[tinyURL] = {
    userID: req.cookies["userID"],
    longURL: req.body.longURL
  }
  console.log(urlDatabase)
  
});

app.post("/urls/:shortURL", (req, res)  => {
urlDatabase[req.params.shortURL] = {
  longURL: req.body.longURL,
  userID: req.cookies["userID"]
}
  res.redirect("/urls");
})

app.get("/u/:shortURL", (req, res) => {
  
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
const userID = req.cookies.userID
const userObject = users[userID]

  if (!userObject) {
    return res.status(403).send("You need to have an account to perform this action.");
  }
  if (userObject["id"] === userID) {
    delete urlDatabase[req.params.shortURL]
  } else {
    return res.send("User not authorized to make changes");
  }
  console.log(users[req.cookies.userID]["id"])
  res.redirect("/urls")
})

app.post("/u/:shortURL", (req, res) => {
  urlDatabase[req.params['shortURL']] = req.body['longURL']
  console.log(urlDatabase)
  res.redirect(`/urls/${req.params['shortURL']}`) //301 was  here
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (password === "") {
    res.status(403).send("Password can't be empty!")
  }

  for (let userID in users){
    const user = users[userID];

    if (user.email === email && user.password === password) {
      res.cookie('email', email)
      res.cookie('userID', userID)
      res.redirect("/urls" ) //301 WAS HERE
    }
  }

  for (let userID in users){
    const user = users[userID];
    if (user.email !== email || user.password !== password){
      res.status(403).send("Email or password is incorrect!")
    }
  }
  res.redirect(`/urls`) // 301 WAS HERE
});

app.post("/logout", (req, res) => {
  res.clearCookie('email')
  res.clearCookie('userID')
  res.redirect(`/urls`) // 301 WAS HERE
});

app.get('/users.json', (req, res) => { //CHECK YOUR DATABASE
  res.json(users);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

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
    password: password
  };

  users[userID] = newUser;

  res.cookie('userID', userID)
  res.cookie('email', email)
  res.redirect('/urls')
  console.log(users[userID])
});

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

  let userURLS = {}

  for  (let url in urlDatabase) {
    if (urlDatabase[url]['userID'] === userID) {
      userURLS[url] = urlDatabase[url]
    }
  }
  return userURLS;
}