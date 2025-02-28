const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/cyber_restricted", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User model schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("docs"));
app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true
  })
);

// Menubar HTML route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Create account route
app.get("/create-account", (req, res) => {
  res.sendFile(__dirname + "/create-account.html");
});

// Handle account creation
app.post("/create-account", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  res.redirect("/login");
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

// Handle login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = user;
    res.redirect("/dashboard");
  } else {
    res.send("Incorrect username or password.");
  }
});

// Dashboard (Special content)
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.send(`<h1>Welcome ${req.session.user.username}</h1><p>You unlocked special content!</p>`);
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
