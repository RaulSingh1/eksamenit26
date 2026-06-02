const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Issue = require("./models/Issue");
const AuthLog = require("./models/AuthLog");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eksamenit26";
const SESSION_SECRET = process.env.SESSION_SECRET || "eksamen-hemmelighet";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Koblet til MongoDB");
    })
    .catch((error) => {
        console.log("Kunne ikke koble til MongoDB:", error.message);
});

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            return res.status(403).render("error", {
                message: "Du har ikke tilgang til denne siden."
            });
        }

        next();
    };
}

async function saveAuthLog(username, action) {
    await AuthLog.create({
        username,
        action
    });
}

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register", {
        error: ""
    });
});

app.post("/register", async (req, res) => {
    const { username, password, role } = req.body;
    const existingUser = await User.findOne({ username });

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

app.get("/login", (req, res) => {
    res.render("login", {
        error: ""
    });
});

app.post("/login", async (req, res) => {
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

app.post("/logout", requireLogin, async (req, res) => {
    const username = req.session.user.username;

    req.session.destroy(async () => {
        await saveAuthLog(username, "logout");
        res.redirect("/login");
    });
});

app.get("/issues", requireLogin, async (req, res) => {
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    const issues = await Issue.find(filter)
        .populate("createdBy", "username role")
        .sort({ createdAt: -1 });

    res.render("issues", {
        issues
    });
});

app.get("/issues/new", requireLogin, requireRole(["elev", "admin"]), (req, res) => {
    res.render("new_issue", {
        error: ""
    });
});

app.post("/issues", requireLogin, requireRole(["elev", "admin"]), async (req, res) => {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
        return res.render("new_issue", {
            error: "Alle feltene må fylles ut."
        });
    }

    await Issue.create({
        title,
        description,
        category,
        createdBy: req.session.user.id
    });

    res.redirect("/issues");
});

app.get("/issues/:id", requireLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    const ownsIssue = issue.createdBy._id.toString() === req.session.user.id;
    const canSeeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canSeeAll) {
        return res.status(403).render("error", {
            message: "Du har ikke tilgang til denne saken."
        });
    }

    res.render("issue_detail", {
        issue
    });
});

app.post("/issues/:id/status", requireLogin, requireRole(["lærer", "admin"]), async (req, res) => {
    await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    });

    res.redirect(`/issues/${req.params.id}`);
});

app.post("/issues/:id/teacher-response", requireLogin, requireRole(["lærer", "admin"]), async (req, res) => {
    await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    });

    res.redirect(`/issues/${req.params.id}`);
});

app.get("/admin", requireLogin, requireRole(["admin"]), async (req, res) => {
    const users = await User.find().sort({ username: 1 });
    const issues = await Issue.find().populate("createdBy", "username role").sort({ createdAt: -1 });
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(30);

    res.render("admin", {
        users,
        issues,
        authLogs
    });
});

app.get("/api/issues", requireLogin, async (req, res) => {
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    const issues = await Issue.find(filter).populate("createdBy", "username role");
    res.json(issues);
});

app.get("/api/issues/:id", requireLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    res.json(issue);
});

app.post("/api/issues", requireLogin, requireRole(["elev", "admin"]), async (req, res) => {
    const issue = await Issue.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        createdBy: req.session.user.id
    });

    res.status(201).json(issue);
});

app.post("/api/issues/:id/status", requireLogin, requireRole(["lærer", "admin"]), async (req, res) => {
    const issue = await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    }, { new: true });

    res.json(issue);
});

app.listen(PORT, () => {
    console.log(`Server kjører på http://localhost:${PORT}`);
});
