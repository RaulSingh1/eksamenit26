// Henter Express, slik at vi kan lage routes for saker.
const express = require("express");

// Henter Issue-modellen og tilgangskontroll.
const Issue = require("../models/Issue");
const { requireLogin, requireRole } = require("../middleware/auth");

// Lager en egen router for saker.
const router = express.Router();
// Elever kan maks lage 5 saker.
const MAX_ISSUES_PER_STUDENT = 5;

// Viser saker.
// Elever ser bare egne saker, mens lærer og admin ser alle.
router.get("/issues", requireLogin, async (req, res) => {
    // req.session.user.role sjekker rollen til brukeren som er logget inn.
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    // Issue.find henter saker fra MongoDB.
    const issues = await Issue.find(filter)
        // populate henter brukernavn og rolle fra User-modellen.
        .populate("createdBy", "username role")
        // sort({ createdAt: -1 }) viser nyeste saker først.
        .sort({ createdAt: -1 });

    // res.render viser issues.ejs og sender med sakene.
    res.render("issues", {
        issues
    });
});

// Viser skjema for ny sak.
// Elev stoppes hvis eleven allerede har 5 saker.
router.get("/issues/new", requireLogin, requireRole(["elev", "admin"]), async (req, res) => {
    if (req.session.user.role === "elev") {
        // countDocuments teller hvor mange saker eleven allerede har.
        const issueCount = await Issue.countDocuments({
            createdBy: req.session.user.id
        });

        if (issueCount >= MAX_ISSUES_PER_STUDENT) {
            return res.status(403).render("error", {
                message: "Du kan maks opprette 5 saker."
            });
        }
    }

    // Viser skjemaet for å lage ny sak.
    res.render("new_issue", {
        error: ""
    });
});

// Lagrer en ny sak i databasen.
router.post("/issues", requireLogin, requireRole(["elev", "admin"]), async (req, res) => {
    // req.body henter data fra skjemaet.
    const { title, description, category } = req.body;

    // Sjekker maksgrensen før saken lagres.
    if (req.session.user.role === "elev") {
        const issueCount = await Issue.countDocuments({
            createdBy: req.session.user.id
        });

        if (issueCount >= MAX_ISSUES_PER_STUDENT) {
            return res.render("new_issue", {
                error: "Du kan maks opprette 5 saker."
            });
        }
    }

    // Sjekker at alle feltene er fylt ut.
    if (!title || !description || !category) {
        return res.render("new_issue", {
            error: "Alle feltene må fylles ut."
        });
    }

    // Issue.create lagrer saken i MongoDB.
    await Issue.create({
        title,
        description,
        category,
        createdBy: req.session.user.id
    });

    // Sender brukeren tilbake til saksoversikten.
    res.redirect("/issues");
});

// Viser en bestemt sak.
router.get("/issues/:id", requireLogin, async (req, res) => {
    // req.params.id henter id-en fra URL-en.
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    // Hvis saken ikke finnes, vises en 404-feil.
    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    const ownsIssue = issue.createdBy._id.toString() === req.session.user.id;
    const canSeeAll = ["lærer", "admin"].includes(req.session.user.role);

    // Elev kan bare åpne egne saker.
    if (!ownsIssue && !canSeeAll) {
        return res.status(403).render("error", {
            message: "Du har ikke tilgang til denne saken."
        });
    }

    // Viser detaljsiden for saken.
    res.render("issue_detail", {
        issue
    });
});

// Endrer status på en sak.
// Elev kan endre egen sak, mens lærer og admin kan endre alle saker.
router.post("/issues/:id/status", requireLogin, async (req, res) => {
    // Finner saken som skal få ny status.
    const issue = await Issue.findById(req.params.id);
    // allowedStatuses er listen med statuser som er lov i systemet.
    const allowedStatuses = ["åpen", "under arbeid", "løst"];

    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    // Stopper status som ikke finnes i systemet.
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

    // Sender brukeren tilbake til samme sak etter oppdatering.
    res.redirect(`/issues/${req.params.id}`);
});

// Lærer og admin kan skrive svar på en sak.
router.post("/issues/:id/teacher-response", requireLogin, requireRole(["lærer", "admin"]), async (req, res) => {
    // Oppdaterer teacherResponse-feltet med teksten fra skjemaet.
    await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    });

    res.redirect(`/issues/${req.params.id}`);
});

// Elev kan svare på løsningen læreren har foreslått.
router.post("/issues/:id/student-response", requireLogin, requireRole(["elev"]), async (req, res) => {
    // Finner saken som eleven prøver å svare på.
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    // Sjekker at saken tilhører eleven som er logget inn.
    const ownsIssue = issue.createdBy.toString() === req.session.user.id;

    if (!ownsIssue) {
        return res.status(403).render("error", {
            message: "Du kan bare svare på dine egne saker."
        });
    }

    // Eleven kan først svare når lærer har skrevet et forslag.
    if (!issue.teacherResponse) {
        return res.status(400).render("error", {
            message: "Du kan svare når lærer har skrevet en foreslått løsning."
        });
    }

    // Lagrer elevens svar i saken.
    await Issue.findByIdAndUpdate(req.params.id, {
        studentResponse: req.body.studentResponse
    });

    res.redirect(`/issues/${req.params.id}`);
});

// Gjør routes tilgjengelig for app.js.
module.exports = router;
