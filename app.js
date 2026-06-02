// Henter inn pakkene vi trenger til serveren.
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

// Henter MongoDB-modellene.
const User = require("./models/User");
const Issue = require("./models/Issue");
const AuthLog = require("./models/AuthLog");

// Lager Express-appen og leser inn verdier fra .env.
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eksamenit26";
const SESSION_SECRET = process.env.SESSION_SECRET || "eksamen-hemmelighet";

// Setter opp EJS, public-mappen og skjema-data.
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Brukes for å huske hvem som er logget inn.
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Gjør innlogget bruker tilgjengelig i alle EJS-sider.
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Kobler serveren til MongoDB.
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Koblet til MongoDB");
    })
    .catch((error) => {
        console.log("Kunne ikke koble til MongoDB:", error.message);
});

// Stopper brukere som ikke er logget inn.
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();
}

// Sjekker at brukeren har riktig rolle.
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

// Samme som requireLogin, men for API. API skal svare med JSON.
function requireApiLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Du må være logget inn."
        });
    }

    next();
}

// Samme som requireRole, men for API.
function requireApiRole(roles) {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            return res.status(403).json({
                message: "Du har ikke tilgang."
            });
        }

        next();
    };
}

// Lagrer login, logout og failed login i databasen.
async function saveAuthLog(username, action) {
    await AuthLog.create({
        username,
        action
    });
}

// Forside.
app.get("/", (req, res) => {
    res.render("index");
});

// Registrering.
app.get("/register", (req, res) => {
    res.render("register", {
        error: ""
    });
});

app.post("/register", async (req, res) => {
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

// Innlogging.
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

// Utlogging.
app.post("/logout", requireLogin, async (req, res) => {
    const username = req.session.user.username;

    req.session.destroy(async () => {
        await saveAuthLog(username, "logout");
        res.redirect("/login");
    });
});

// Viser saker. Elever ser egne saker, lærer/admin ser alle.
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

// Opprette ny sak.
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

// Viser en bestemt sak.
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

// Lærer/admin kan endre alle saker. Elev kan endre egne saker.
app.post("/issues/:id/status", requireLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    const allowedStatuses = ["åpen", "under arbeid", "løst"];

    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).render("error", {
            message: "Ugyldig status."
        });
    }

    const ownsIssue = issue.createdBy.toString() === req.session.user.id;
    const canChangeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canChangeAll) {
        return res.status(403).render("error", {
            message: "Du har ikke tilgang til å endre denne saken."
        });
    }

    await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    });

    res.redirect(`/issues/${req.params.id}`);
});

// Lærer og admin kan skrive svar på saken.
app.post("/issues/:id/teacher-response", requireLogin, requireRole(["lærer", "admin"]), async (req, res) => {
    await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    });

    res.redirect(`/issues/${req.params.id}`);
});

// Adminside med brukere, saker og logger.
app.get("/admin", requireLogin, requireRole(["admin"]), async (req, res) => {
    const users = await User.find().sort({ username: 1 });
    const issues = await Issue.find().populate("createdBy", "username role").sort({ createdAt: -1 });
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(30);

    res.render("admin", {
        users,
        issues,
        authLogs,
        message: req.query.message || ""
    });
});

// Admin kan opprette brukere.
app.post("/admin/users", requireLogin, requireRole(["admin"]), async (req, res) => {
    const { username, password, role } = req.body;
    const allowedRoles = ["elev", "lærer", "admin"];
    const existingUser = await User.findOne({ username });

    if (!username || !password || !allowedRoles.includes(role)) {
        return res.redirect("/admin?message=Ugyldig brukerdata");
    }

    if (existingUser) {
        return res.redirect("/admin?message=Brukeren finnes allerede");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        username,
        password: hashedPassword,
        role
    });

    res.redirect("/admin?message=Bruker opprettet");
});

// Admin kan endre rolle på brukere.
app.post("/admin/users/:id/role", requireLogin, requireRole(["admin"]), async (req, res) => {
    const allowedRoles = ["elev", "lærer", "admin"];

    if (!allowedRoles.includes(req.body.role)) {
        return res.redirect("/admin?message=Ugyldig rolle");
    }

    if (req.params.id === req.session.user.id) {
        return res.redirect("/admin?message=Du kan ikke endre din egen rolle");
    }

    await User.findByIdAndUpdate(req.params.id, {
        role: req.body.role
    });

    res.redirect("/admin?message=Rolle oppdatert");
});

// Admin kan slette brukere og sakene deres.
app.post("/admin/users/:id/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    if (req.params.id === req.session.user.id) {
        return res.redirect("/admin?message=Du kan ikke slette din egen bruker");
    }

    await Issue.deleteMany({
        createdBy: req.params.id
    });

    await User.findByIdAndDelete(req.params.id);

    res.redirect("/admin?message=Bruker slettet");
});

// Admin kan slette en sak.
app.post("/admin/issues/:id/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    await Issue.findByIdAndDelete(req.params.id);

    res.redirect("/admin?message=Sak slettet");
});

// Admin kan slette autentiseringslogger.
app.post("/admin/logs/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    await AuthLog.deleteMany({});

    res.redirect("/admin?message=Logger slettet");
});

// API: henter saker som JSON.
app.get("/api/issues", requireApiLogin, async (req, res) => {
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    const issues = await Issue.find(filter).populate("createdBy", "username role");
    res.json(issues);
});

// API: henter en bestemt sak.
app.get("/api/issues/:id", requireApiLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    const ownsIssue = issue.createdBy._id.toString() === req.session.user.id;
    const canSeeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canSeeAll) {
        return res.status(403).json({ message: "Du har ikke tilgang til denne saken." });
    }

    res.json(issue);
});

// API: oppretter sak.
app.post("/api/issues", requireApiLogin, requireApiRole(["elev", "admin"]), async (req, res) => {
    if (!req.body.title || !req.body.description || !req.body.category) {
        return res.status(400).json({ message: "Alle feltene må fylles ut." });
    }

    const issue = await Issue.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        createdBy: req.session.user.id
    });

    res.status(201).json(issue);
});

// API: oppdaterer status. Elev kan endre egne saker.
app.post("/api/issues/:id/status", requireApiLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    const ownsIssue = issue.createdBy.toString() === req.session.user.id;
    const canChangeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canChangeAll) {
        return res.status(403).json({ message: "Du har ikke tilgang til å endre denne saken." });
    }

    const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    }, { new: true });

    res.json(updatedIssue);
});

// API: lærer/admin kan legge inn lærersvar.
app.post("/api/issues/:id/teacher-response", requireApiLogin, requireApiRole(["lærer", "admin"]), async (req, res) => {
    const issue = await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    }, { new: true });

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    res.json(issue);
});

// API: admin kan hente brukere uten passord.
app.get("/api/users", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const users = await User.find().select("username role").sort({ username: 1 });

    res.json(users);
});

// API: admin kan opprette bruker.
app.post("/api/users", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const { username, password, role } = req.body;
    const allowedRoles = ["elev", "lærer", "admin"];
    const existingUser = await User.findOne({ username });

    if (!username || !password || !allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Ugyldig brukerdata." });
    }

    if (existingUser) {
        return res.status(400).json({ message: "Brukeren finnes allerede." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        username,
        password: hashedPassword,
        role
    });

    res.status(201).json({
        id: user._id,
        username: user.username,
        role: user.role
    });
});

// API: admin kan hente autentiseringslogger.
app.get("/api/authlogs", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(50);

    res.json(authLogs);
});

// API: admin kan hente kritiske hendelser.
app.get("/api/critical-events", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const failedLogins = await AuthLog.find({
        action: "failed login"
    }).sort({ timestamp: -1 }).limit(20);

    const openIssues = await Issue.find({
        status: "åpen"
    }).populate("createdBy", "username role").sort({ createdAt: -1 }).limit(20);

    res.json({
        failedLogins,
        openIssues
    });
});

// Starter serveren.
app.listen(PORT, () => {
    console.log(`Server kjører på http://localhost:${PORT}`);
});
