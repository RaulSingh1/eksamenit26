// Henter Express, slik at vi kan lage routes.
const express = require("express");
// Henter middleware som sjekker innlogging og rolle.
const { requireLogin, requireRole } = require("../middleware/auth");

// Lager en egen router for vanlige sider.
const router = express.Router();

// Viser forsiden.
router.get("/", (req, res) => {
    // res.render("index") viser views/index.ejs i nettleseren.
    res.render("index");
});

// Viser FAQ/support-siden.
// Bare elev og lærer får tilgang til denne siden.
router.get("/support", requireLogin, requireRole(["elev", "lærer"]), (req, res) => {
    // Før siden vises, sjekker requireLogin og requireRole tilgang.
    // Hvis brukeren har tilgang, vises support.ejs.
    res.render("support");
});

// Gjør routes tilgjengelig for app.js.
// app.js importerer denne filen og kobler routene til serveren.
module.exports = router;
