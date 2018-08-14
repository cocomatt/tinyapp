// ================================================================
// MODULE IMPORTS AND GLOBAL VARIABLE DECLARATIONS
// ================================================================


require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const PORT = process.env.PORT || 8080;

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user1RandomID": {
    id: "user1RandomID",
    email: "user1@example.com",
    password: "purple-monkey-dishwasher"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "funky-monkey"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: "purple-rain"
  }
};

// ================================================================
// FUNCTION DECLARATIONS
// ================================================================

function generateRandomShortURL() {
  let randomShortURL = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++)
    randomShortURL += possible.charAt(Math.floor(Math.random() * possible.length));
  return randomShortURL;
}

function checkEmail(email) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  } return false;
}

function checkPassword(password) {
  for (user in users) {
    if (users[user].password === password) {
      return true;
    }
  } return false;
}

function findUser(email, password) {
  for (user in users) {
    if ((users[user].email === email) && (users[user].password === password)) {
      console.log("findUser user: ", user);
      return user;
    }
  }
  return "";
}

function generateUserRandomID(email, password) {
  let newUserRandomID = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 13; i++)
  newUserRandomID += possible.charAt(Math.floor(Math.random() * possible.length));
  users[newUserRandomID] = {
    id: newUserRandomID,
    email: email,
    password: password
  };
  return newUserRandomID;
}

// ================================================================
// ROUTE HANDLING
// ================================================================

app.get("/login", (req, res) => {
  res.render("login");
})

app.post("/login", (req, res) => {
  console.log("req.body.email: ", req.body.email);
  console.log("checkEmail(req.body.email): ", checkEmail(req.body.email));
  console.log("checkPassword(req.body.password): ", checkPassword(req.body.password));
  console.log("findUser(req.body.email, req.body.password): ", findUser(req.body.email, req.body.password));
  if (req.body.email == "" || req.body.password == "") {
    res.status(400).send("The email and/or password you entered is blank. Please go back and try again.");
  } else if (checkEmail(req.body.email) == false) {
    res.status(403).send("The email you entered is not registered. Please go back and try again.");
  } else if ((checkEmail(req.body.email) == true) && (checkPassword(req.body.password) == false)) {
    res.status(403).send("The password you have entered is incorrect. Please go back and try again.");
  } else {
  let user = findUser(req.body.email, req.body.password);
  res.cookie("user_id", user);
  console.log("updated users object: ", users);
  console.log("user: ", user);
  console.log("user object: ", users[user]);
  console.log("user email: ", users[user].email)
  res.redirect("/urls");
  };
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  console.log("req.body.email: ", req.body.email);
  console.log("checkEmail(req.body.email): ", checkEmail(req.body.email));
  if (req.body.email == "" || req.body.password == "") {
    res.status(400).send("The email and/or password you submitted is blank. Please go back and try again.");
  } else if (checkEmail(req.body.email)) {
    res.status(400).send("The email you entered is already registered. Please go back and try again.");
  } else {
  let user = generateUserRandomID(req.body.email, req.body.password);
  res.cookie("user_id", user);
  console.log("updated users object: ", users);
  console.log("user: ", user);
  console.log("new user object: ", users[user]);
  console.log("new user email: ", users[user].email)
  res.redirect("/");
  };
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  console.log("user:", templateVars.user);
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id]
  };
  console.log(templateVars.shortURL)
  console.log(templateVars.longURL);
  res.render("urls_show", templateVars);
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomShortURL();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//"Posts" deletion of short URL and long URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
