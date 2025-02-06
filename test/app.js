const express = require("express");
const app = express();
const port = 3000;
const { addUser, authenticateUser } = require("./database/services");
const bodyParser = require("body-parser");
const validator = require("validator");
const session = require("express-session");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        resave: false, // don't save session if unmodified
        saveUninitialized: false, // don't create session until something stored
        secret: "shhhh, very secret",
    })
);

app.use(bodyParser.json());

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/sign-up", (req, res) => {
    res.render("sign-up");
});

app.post("/sign-up", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Tests the incomming password with parameters set below
    const strongPassword = validator.isStrongPassword(password, {
        minLength: 3,
        minLowercase: 0,
        minUppercase: 0,
        minNumbers: 0,
        minSymbols: 0,
    });

    // If not strong password
    if (!strongPassword) {
        console.log(validator.isStrongPassword(password));
        return res.redirect("/sign-up");
    }

    const emailChecker = await addUser(email, password);
    // If addUser returns false
    if (!emailChecker) {
        console.log("Email is already in use");
        return res.redirect("/sign-up");
    }

    return res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const auth = await authenticateUser(email, password);

    // Checks is the function authenticateUser returned true or false, if true we are directed to dashboard. If not we go back to login
    if (auth) {
        req.session.email = auth.email;
        req.session.address = auth.address;
        return res.redirect("/dashboard");
    }
    return res.redirect("/login");
});

function isAuthenticated(req, res, next) {
    if (req.session.email) {
        next();
    } else {
        req.session.error = "Access denied!";
        res.redirect("/login");
    }
}

app.get("/dashboard", isAuthenticated, (req, res) => {
    res.render("dashboard", {
        email: req.session.email,
        address: req.session.address,
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
