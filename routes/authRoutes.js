// Henter Express for å lage routes for innlogging og registrering.
const express = require("express");
// bcrypt brukes for å hashe og sjekke passord.
const bcrypt = require("bcryptjs");

// Henter User-modellen, auth log-funksjonen og innloggingssjekk.
const User = require("../models/User");
const saveAuthLog = require("../utils/authLog");
const { requireLogin } = require("../middleware/auth");

// Lager en egen router for auth-routes.
const router = express.Router();

// Viser registreringssiden.
router.get("/register", (req, res) => {
    // error: "" betyr at siden starter uten feilmelding.
    res.render("register", {
        error: ""
    });
});

// Registrerer ny bruker.
router.post("/register", async (req, res) => {
    // req.body inneholder data som er sendt inn fra registreringsskjemaet.
    const { username, password, role } = req.body;
    // Vanlige brukere kan bare registrere seg som elev eller lærer.
    const allowedRoles = ["elev", "lærer"];
    // findOne sjekker om brukernavnet finnes fra før i MongoDB.
    const existingUser = await User.findOne({ username });

    // includes sjekker om valgt rolle finnes i allowedRoles.
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

    // Passord hashes før brukeren lagres.
    // 10 er styrken på hashingen.
    const hashedPassword = await bcrypt.hash(password, 10);

    // User.create lagrer den nye brukeren i MongoDB.
    await User.create({
        username,
        password: hashedPassword,
        role
    });

    // Sender brukeren videre til innlogging etter registrering.
    res.redirect("/login");
});

// Viser innloggingssiden.
router.get("/login", (req, res) => {
    // error: "" gjør at siden ikke viser feil før brukeren har prøvd å logge inn.
    res.render("login", {
        error: ""
    });
});

// Logger inn bruker.
router.post("/login", async (req, res) => {
    // Henter brukernavn og passord fra innloggingsskjemaet.
    const { username, password } = req.body;
    // Finner brukeren i databasen basert på brukernavn.
    const user = await User.findOne({ username });

    // Logger failed login hvis brukeren ikke finnes.
    if (!user) {
        await saveAuthLog(username, "failed login");
        return res.render("login", {
            error: "Feil brukernavn eller passord."
        });
    }

    // Sammenligner passordet med hashen i databasen.
    // bcrypt.compare returnerer true hvis passordet stemmer.
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    // Logger failed login hvis passordet er feil.
    if (!passwordIsCorrect) {
        await saveAuthLog(username, "failed login");
        return res.render("login", {
            error: "Feil brukernavn eller passord."
        });
    }

    // Lagrer brukeren i session, slik at serveren husker innloggingen.
    // Denne session-dataen brukes senere til roller og tilgang.
    req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role
    };

    // Logger vellykket innlogging.
    await saveAuthLog(username, "login");
    res.redirect("/issues");
});

// Logger ut bruker.
router.post("/logout", requireLogin, async (req, res) => {
    // Lagrer brukernavnet før session slettes, slik at logout kan logges.
    const username = req.session.user.username;

    // Sletter session og logger logout.
    req.session.destroy(async () => {
        await saveAuthLog(username, "logout");
        res.redirect("/login");
    });
});

// Gjør routes tilgjengelig for app.js.
module.exports = router;
