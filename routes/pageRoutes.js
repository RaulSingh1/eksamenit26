// Henter Express, slik at vi kan lage routes.
const express = require("express");
// Lager en egen router for vanlige sider.
const router = express.Router();

// Viser forsiden.
router.get("/", (req, res) => {
    // res.render("index") viser views/index.ejs i nettleseren.
    res.render("index");
});

// Viser FAQ/support-siden.
// Denne siden kan også vises før brukeren logger inn.
router.get("/support", (req, res) => {
    res.render("support");
});

// Gjør routes tilgjengelig for app.js.
// app.js importerer denne filen og kobler routene til serveren.
module.exports = router;
