// ================================================================
// MODULE IMPORTS AND GLOBAL VARIABLE DECLARATIONS
// ================================================================

/* eslint-env node, mocha */

require("dotenv").config();

const cookieSession = require("cookie-session");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(cookieSession({
	name: "session",
	keys: [process.env.SECRETKEY],
	maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}));

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
		//password: "purple-monkey-dishwasher",
		hashedPassword: "$2a$10$ENCqP/./iTE.YYzLVBJj3u.3LExUzmQvT16/ABCQnL5MtyoW66..m"
	},
	"user2RandomID": {
		id: "user2RandomID",
		email: "user2@example.com",
		// password: "funky-monkey"
		hashedPassword : "$2a$10$hxoSGGN/CRtsC7XzkGD0PuVb.0EPztPMdHTG/TRA9sH0ThNWlMqm2"
	},
	"user3RandomID": {
		id: "user3RandomID",
		email: "user3@example.com",
		// password: "purple-rain"
		hashedPassword: "$2a$10$VRcN2rFb0saMpalEvUyive0ZewMLGQot1i1KOuW9ERl60ojRRR5Om"
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
	for (let user in users) {
		if (users[user].email === email) {
			return true;
		}
	} return false;
}

function checkPassword(password) {
	for (let user in users) {
		if (bcrypt.compareSync(password, users[user].hashedPassword)) {
			return true;
		}
	} return false;
}

function findUser(email, password) {
	for (let user in users) {
		if ((users[user].email === email) && (bcrypt.compareSync(password, (users[user].hashedPassword)))) {
			return user;
		}
	} return false;
}

function generateUserRandomID(email, password) {
	let user = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 13; i++)
		user += possible.charAt(Math.floor(Math.random() * possible.length));
	users[user] = {
		id: user,
		email: email,
		hashedPassword: bcrypt.hashSync(password, 10)
	};
	return user;
}

function getUserURLs(id) {
	let urls = {};
	for (let shortURL in urlDatabase) {
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

app.get("/", (req, res) => {
	let templateVars = {
		urls: getUserURLs(req.session.user_id),
		user: users[req.session.user_id]
	};
	res.render("urls_index", templateVars);
});

// displays login page
app.get("/login", (req, res) => {
	res.render("login");
});

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
		req.session.user_id = user;
		res.redirect("/urls");
	}
});

// user logs out and cookie is cleared
app.post("/logout", (req, res) => {
	req.session.user_id = null;
	res.redirect("/login");
});

// displays registration page
app.get("/register", (req, res) => {
	res.render("register");
});

// posts new user credentials
app.post("/register", (req, res) => {
	if (req.body.email == "" || req.body.password == "") {
		res.status(400).send("The email and/or password you entered is blank. Please go back and try again.");
	} else if (checkEmail(req.body.email)) {
		res.status(400).send("The email you entered is already registered. Please go back and try again.");
	} else {
		let user = generateUserRandomID(req.body.email, req.body.password);
		req.session.user_id = user;
		res.redirect("/urls");
	}
});

// displays url index for a specific user
app.get("/urls", (req, res) => {
	if (!req.session.user_id) {
		res.redirect("/login");
	} else {
		let templateVars = {
			urls: getUserURLs(req.session.user_id),
			user: users[req.session.user_id]
		};
		res.render("urls_index", templateVars);
	}
});

// displays new url page for a specific user
app.get("/urls/new", (req, res) => {
	if (!req.session.user_id) {
		res.redirect("/login");
	} else {
		let templateVars = {
			user: users[req.session.user_id]
		};
		res.render("urls_new", templateVars);
	}
});

// displays short URL details for a specific user
app.get("/urls/:id", (req, res) => {
	if (!req.session.user_id) {
		res.redirect("/login");
	} else {
		let templateVars = {
			shortURL: req.params.id,
			longURL: urlDatabase[req.params.id].longURL,
			user: users[req.session.user_id]
		};
		res.render("urls_show", templateVars);
	}
});

// new short URL and corresponding userID is added to urlDatabase
app.post("/urls", (req, res) => {
	let shortURL = generateRandomShortURL();
	urlDatabase[shortURL] = {
		longURL: req.body.longURL,
		userID: req.session.user_id
	};
	res.redirect("/urls");
	// res.redirect(`/urls/${shortURL}`);
});

// deletes shortURL/longURL pair
app.delete("/urls/:id", (req, res) => {
	if (req.session.user_id === urlDatabase[req.params.id].userID) {
		delete urlDatabase[req.params.id];
		res.redirect("/urls");
	} else {
		res.status(403).send("You can't delete this.");
	}
});

// posts updated long URL
app.patch("/urls/:id", (req, res) => {
	urlDatabase[req.params.id].longURL = req.body.newLongURL;
	urlDatabase[req.params.id].userID = req.session.user_id;
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
