const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const saveAuthLog = require("../utils/authLog");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/register", (req, res) => {
    res.render("register", {
        error: ""
    });
});

router.post("/register", async (req, res) => {
    const { username, password, role } = req.body;
    const allowedRoles = ["elev", "lærer"];
    const existingUser = await User.findOne({ username });

    if (!allowedRoles.includes(role)) {
        return res.render("register", {
            error: "Du kan bare registrere elev eller lærer her."
        });
    }

    if (existingUser) {
        return res.render("register", {
            error: "Brukernavnet er allerede tatt."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        username,
        password: hashedPassword,
        role
    });

    res.redirect("/login");
});

router.get("/login", (req, res) => {
    res.render("login", {
        error: ""
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        await saveAuthLog(username, "failed login");
        return res.render("login", {
            error: "Feil brukernavn eller passord."
        });
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect) {
        await saveAuthLog(username, "failed login");
        return res.render("login", {
            error: "Feil brukernavn eller passord."
        });
    }

    req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role
    };

    await saveAuthLog(username, "login");
    res.redirect("/issues");
});

router.post("/logout", requireLogin, async (req, res) => {
    const username = req.session.user.username;

    req.session.destroy(async () => {
        await saveAuthLog(username, "logout");
        res.redirect("/login");
    });
});

module.exports = router;
