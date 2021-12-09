const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser")
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
    users: users
  };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    users: users
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
    users: users 
  };
  res.render("urls_shows", templateVars);
});

app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString(6)
  console.log(req.body.longURL);  // Log the POST request body to the console
  res.redirect(301, `/urls/${tinyURL}`);         // Respond with 'Ok' (we will replace this)
  urlDatabase[tinyURL] = req.body.longURL
  console.log(urlDatabase)
  
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = req.body.longURL
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
})

app.post("/u/:shortURL", (req, res) => {
  urlDatabase[req.params['shortURL']] = req.body['longURL']
  console.log(urlDatabase)
  res.redirect(301, `/urls/${req.params['shortURL']}`)
});

app.post("/login", (req, res) => {
  res.cookie(`username`, req.body[`username`])
  res.redirect(301, `/urls`)
});

app.post("/logout", (req, res) => {
  res.clearCookie('username')
  res.redirect(301, `/urls`)
});

app.get("/register", (req, res) => {
  
  const userID = req.cookies['userID']

  const templateVars = {
    username: req.cookies["username"],
    user: users[userID]
  };
  res.render("register", templateVars);
});

app.get('/users.json', (req, res) => { //CHECK YOUR DATABASE
  res.json(users);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (req.body.email === "") {
    res.status(403).send("Email can't be empty!");
    return;
  }

  for (let userID in users){
    const user = users[userID];

    if (user.email === req.body.email) {
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
