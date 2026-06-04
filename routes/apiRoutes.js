// Henter Express for å lage API-routes.
// API-routes sender data som JSON i stedet for å vise EJS-sider.
const express = require("express");
// bcrypt brukes når admin oppretter brukere via API.
const bcrypt = require("bcryptjs");

// Henter modeller og API-tilgangskontroll.
// Modellene brukes for å lese og skrive data i MongoDB.
const User = require("../models/User");
const Issue = require("../models/Issue");
const AuthLog = require("../models/AuthLog");
const { requireApiLogin, requireApiRole } = require("../middleware/auth");

// Lager en egen router for API.
const router = express.Router();
// Elever kan maks lage 5 saker.
const MAX_ISSUES_PER_STUDENT = 5;

// API: henter saker som JSON.
// req er requesten fra brukeren, og res er svaret serveren sender tilbake.
// Elev får bare egne saker, lærer og admin får alle.
router.get("/issues", requireApiLogin, async (req, res) => {
    // Hvis brukeren er elev, lages et filter som bare finner elevens egne saker.
    // Hvis brukeren ikke er elev, brukes tomt filter, og da hentes alle saker.
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    // find henter saker fra MongoDB.
    // populate henter brukernavn og rolle fra brukeren som opprettet saken.
    const issues = await Issue.find(filter).populate("createdBy", "username role");
    // res.json sender data tilbake som JSON.
    res.json(issues);
});

// API: henter en bestemt sak.
router.get("/issues/:id", requireApiLogin, async (req, res) => {
    // req.params.id er id-en som ligger i URL-en.
    // Eksempel: /api/issues/123 gir req.params.id = 123.
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    // Hvis saken ikke finnes, sendes 404 tilbake.
    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    // Sjekker om innlogget bruker eier saken.
    const ownsIssue = issue.createdBy._id.toString() === req.session.user.id;
    // Lærer og admin har lov til å se alle saker.
    const canSeeAll = ["lærer", "admin"].includes(req.session.user.role);

    // Elev kan bare hente egne saker.
    if (!ownsIssue && !canSeeAll) {
        return res.status(403).json({ message: "Du har ikke tilgang til denne saken." });
    }

    res.json(issue);
});

// API: oppretter en ny sak.
router.post("/issues", requireApiLogin, requireApiRole(["elev", "admin"]), async (req, res) => {
    // Sjekker at nødvendige felter er sendt inn.
    // req.body inneholder data som kommer fra skjema eller API-kall.
    if (!req.body.title || !req.body.description || !req.body.category) {
        return res.status(400).json({ message: "Alle feltene må fylles ut." });
    }

    // Sjekker maksgrensen for elever.
    if (req.session.user.role === "elev") {
        // countDocuments teller hvor mange saker eleven allerede har laget.
        const issueCount = await Issue.countDocuments({
            createdBy: req.session.user.id
        });

        if (issueCount >= MAX_ISSUES_PER_STUDENT) {
            return res.status(403).json({ message: "Du kan maks opprette 5 saker." });
        }
    }

    // Lager saken i MongoDB.
    // createdBy settes til brukeren som er logget inn.
    const issue = await Issue.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        createdBy: req.session.user.id
    });

    // 201 betyr at noe nytt ble opprettet.
    res.status(201).json(issue);
});

// API: oppdaterer status på en sak.
router.post("/issues/:id/status", requireApiLogin, async (req, res) => {
    // Finner saken som skal oppdateres.
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    // Sjekker om brukeren eier saken, eller om brukeren er lærer/admin.
    const ownsIssue = issue.createdBy.toString() === req.session.user.id;
    const canChangeAll = ["lærer", "admin"].includes(req.session.user.role);

    // Elev kan bare endre egen sak.
    if (!ownsIssue && !canChangeAll) {
        return res.status(403).json({ message: "Du har ikke tilgang til å endre denne saken." });
    }

    // Oppdaterer status i databasen.
    // { new: true } gjør at vi får tilbake den oppdaterte saken.
    const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    }, { new: true });

    res.json(updatedIssue);
});

// API: lærer og admin kan skrive lærersvar.
router.post("/issues/:id/teacher-response", requireApiLogin, requireApiRole(["lærer", "admin"]), async (req, res) => {
    // Oppdaterer teacherResponse-feltet på saken.
    const issue = await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    }, { new: true });

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    res.json(issue);
});

// API: elev kan svare på løsningen læreren har foreslått.
router.post("/issues/:id/student-response", requireApiLogin, requireApiRole(["elev"]), async (req, res) => {
    // Finner saken som eleven prøver å svare på.
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    // Sjekker at saken tilhører eleven som er logget inn.
    const ownsIssue = issue.createdBy.toString() === req.session.user.id;

    if (!ownsIssue) {
        return res.status(403).json({ message: "Du kan bare svare på dine egne saker." });
    }

    // Eleven kan først svare når lærer har skrevet et forslag.
    if (!issue.teacherResponse) {
        return res.status(400).json({
            message: "Du kan svare når lærer har skrevet en foreslått løsning."
        });
    }

    // Oppdaterer studentResponse-feltet på saken.
    const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, {
        studentResponse: req.body.studentResponse
    }, { new: true });

    res.json(updatedIssue);
});

// API: admin kan hente brukere uten passord.
router.get("/users", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    // select("username role") gjør at passord ikke sendes ut i API-svaret.
    const users = await User.find().select("username role").sort({ username: 1 });

    res.json(users);
});

// API: admin kan opprette brukere.
router.post("/users", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    // Henter data fra API-kallet.
    const { username, password, role } = req.body;
    // Admin kan opprette alle rollene.
    const allowedRoles = ["elev", "lærer", "admin"];
    // Sjekker om brukernavnet finnes fra før.
    const existingUser = await User.findOne({ username });

    // Sjekker at data er gyldig før brukeren lagres.
    if (!username || !password || !allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Ugyldig brukerdata." });
    }

    if (existingUser) {
        return res.status(400).json({ message: "Brukeren finnes allerede." });
    }

    // Passord hashes før lagring.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lager brukeren i MongoDB.
    const user = await User.create({
        username,
        password: hashedPassword,
        role
    });

    // Sender tilbake brukerdata uten passord.
    res.status(201).json({
        id: user._id,
        username: user.username,
        role: user.role
    });
});

// API: admin kan hente auth logs.
router.get("/authlogs", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    // Henter de 50 nyeste innloggingsloggene.
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(50);

    res.json(authLogs);
});

// API: admin kan hente kritiske hendelser.
// Her brukes failed login og åpne saker som viktige hendelser.
router.get("/critical-events", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    // Henter de siste mislykkede innloggingene.
    const failedLogins = await AuthLog.find({
        action: "failed login"
    }).sort({ timestamp: -1 }).limit(20);

    // Henter åpne saker, fordi de fortsatt trenger oppfølging.
    const openIssues = await Issue.find({
        status: "åpen"
    }).populate("createdBy", "username role").sort({ createdAt: -1 }).limit(20);

    res.json({
        failedLogins,
        openIssues
    });
});

// Gjør API-routes tilgjengelig for app.js.
module.exports = router;
