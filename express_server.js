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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user1RandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user1RandomID"
  },
  "Ge2LM8": {
    longURL: "http://www.google.ca",
    userID: "user2RandomID"
  },
  "YtV3s1": {
    longURL: "http://www.economist.com",
    userID: "user3RandomID"
  },
  "Hg4d2W": {
    longURL: "http://www.vox.com",
    userID: "user2RandomID"
  },
  "K9V4cD": {
    longURL: "http://www.thedailybeast.ca",
    userID: "user1RandomID"
  }
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
      return user;
    }
  } return "";
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

function userURLs(id) {
  let urls = {};
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

// ================================================================
// ROUTE HANDLING
// ================================================================

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// displays login page
app.get("/login", (req, res) => {
  res.render("login");
})

// posts user credentials to login page
app.post("/login", (req, res) => {
  if (req.body.email == "" || req.body.password == "") {
    res.status(400).send("The email and/or password you entered is blank. Please go back and try again.");
  } else if (checkEmail(req.body.email) == false) {
    res.status(403).send("The email you entered is not registered. Please go back and try again.");
  } else if ((checkEmail(req.body.email) == true) && (checkPassword(req.body.password) == false)) {
    res.status(403).send("The password you have entered is incorrect. Please go back and try again.");
  } else {
    let user = findUser(req.body.email, req.body.password);
    res.cookie("user_id", user);
    res.redirect("/urls");
  };
});

// user logs out and cookie is cleared
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// displays registration page
app.get("/register", (req, res) => {
  res.render("register");
});

// posts new user credentials
app.post("/register", (req, res) => {
  if (req.body.email == "" || req.body.password == "") {
    res.status(400).send("The email and/or password you submitted is blank. Please go back and try again.");
  } else if (checkEmail(req.body.email)) {
    res.status(400).send("The email you entered is already registered. Please go back and try again.");
  } else {
    let user = generateUserRandomID(req.body.email, req.body.password);
    res.cookie("user_id", user);
    res.redirect("/urls");
  };
});

// displays url index for a specific user
app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = {
      urls: userURLs(req.cookies.user_id),
      user: users[req.cookies.user_id]
    };
    res.render("urls_index", templateVars);
  };
});

// displays new url page for a specific user
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_new", templateVars);
  };
});

// displays short URL details for a specific user
app.get("/urls/:id", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.cookies.user_id]
    };
    res.render("urls_show", templateVars);
  };
});

// new short URL and corresponding userID is added to urlDatabase
app.post("/urls", (req, res) => {
  let shortURL = generateRandomShortURL();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  }
  res.redirect(`/urls/${shortURL}`);
});

//"Posts" deletion of short URL and long URL
app.post("/urls/:id/delete", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).send("You can't delete this.");
  }
});

// posts updated long URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.newLongURL;
  urlDatabase[req.params.id].userID = req.cookies.user_id;
  res.redirect("/urls");
});

// redirection to long URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
