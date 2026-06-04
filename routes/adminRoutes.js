// Henter Express for å lage admin-routes.
const express = require("express");
// bcrypt brukes for å hashe passord når admin lager brukere.
const bcrypt = require("bcryptjs");

// Henter modeller og tilgangskontroll.
const User = require("../models/User");
const Issue = require("../models/Issue");
const AuthLog = require("../models/AuthLog");
const { requireLogin, requireRole } = require("../middleware/auth");

// Lager en egen router for adminfunksjoner.
const router = express.Router();

// Viser adminpanelet.
// requireLogin sjekker at brukeren er logget inn.
// requireRole(["admin"]) sjekker at bare admin får tilgang.
router.get("/admin", requireLogin, requireRole(["admin"]), async (req, res) => {
    // Henter alle brukere, saker og de nyeste loggene fra MongoDB.
    // sort({ username: 1 }) sorterer brukere alfabetisk.
    const users = await User.find().sort({ username: 1 });
    // populate henter brukernavn og rolle til brukeren som laget saken.
    const issues = await Issue.find().populate("createdBy", "username role").sort({ createdAt: -1 });
    // limit(30) viser bare de 30 nyeste loggene.
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(30);

    // Sender dataene til admin.ejs, slik at de kan vises på siden.
    res.render("admin", {
        users,
        issues,
        authLogs,
        // req.query.message henter melding fra URL-en, for eksempel etter sletting.
        message: req.query.message || ""
    });
});

// Admin kan opprette nye brukere.
router.post("/admin/users", requireLogin, requireRole(["admin"]), async (req, res) => {
    // Henter data fra skjemaet.
    const { username, password, role } = req.body;
    // Admin kan opprette elev, lærer og admin.
    const allowedRoles = ["elev", "lærer", "admin"];
    // Sjekker om brukernavnet allerede finnes.
    const existingUser = await User.findOne({ username });

    // Stopper hvis felter mangler eller rollen ikke er lovlig.
    if (!username || !password || !allowedRoles.includes(role)) {
        // redirect sender admin tilbake til admin-siden med en melding.
        return res.redirect("/admin?message=Ugyldig brukerdata");
    }

    // Stopper hvis brukeren finnes fra før.
    if (existingUser) {
        return res.redirect("/admin?message=Brukeren finnes allerede");
    }

    // Hasher passordet før lagring.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lager brukeren i MongoDB.
    await User.create({
        username,
        password: hashedPassword,
        role
    });

    res.redirect("/admin?message=Bruker opprettet");
});

// Admin kan endre rolle på brukere.
router.post("/admin/users/:id/role", requireLogin, requireRole(["admin"]), async (req, res) => {
    // req.params.id er id-en til brukeren som skal endres.
    const allowedRoles = ["elev", "lærer", "admin"];

    // Stopper hvis rollen ikke finnes i systemet.
    if (!allowedRoles.includes(req.body.role)) {
        return res.redirect("/admin?message=Ugyldig rolle");
    }

    // Admin får ikke endre sin egen rolle, så man ikke mister admin-tilgang.
    if (req.params.id === req.session.user.id) {
        return res.redirect("/admin?message=Du kan ikke endre din egen rolle");
    }

    // Oppdaterer rollen i databasen.
    // findByIdAndUpdate finner brukeren med id og endrer rollen.
    await User.findByIdAndUpdate(req.params.id, {
        role: req.body.role
    });

    res.redirect("/admin?message=Rolle oppdatert");
});

// Admin kan slette en bruker.
router.post("/admin/users/:id/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    // Admin får ikke slette sin egen bruker.
    if (req.params.id === req.session.user.id) {
        return res.redirect("/admin?message=Du kan ikke slette din egen bruker");
    }

    // Sletter sakene som tilhører brukeren.
    // deleteMany sletter alle saker der createdBy er denne brukeren.
    await Issue.deleteMany({
        createdBy: req.params.id
    });

    // Sletter selve brukeren.
    // findByIdAndDelete sletter ett dokument basert på id.
    await User.findByIdAndDelete(req.params.id);

    res.redirect("/admin?message=Bruker slettet");
});

// Admin kan slette en bestemt sak.
router.post("/admin/issues/:id/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    // Sletter saken med id-en fra URL-en.
    await Issue.findByIdAndDelete(req.params.id);

    res.redirect("/admin?message=Sak slettet");
});

// Admin kan slette alle auth logs.
router.post("/admin/logs/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    // deleteMany({}) med tomt filter sletter alle loggene.
    await AuthLog.deleteMany({});

    res.redirect("/admin?message=Logger slettet");
});

// Gjør admin-routes tilgjengelig for app.js.
module.exports = router;
