// Pakker som trengs for å lage serveren.
// express lager webserveren.
const express = require("express");
// express-session brukes for å huske hvem som er logget inn.
const session = require("express-session");
// mongoose brukes for å koble Node.js til MongoDB.
const mongoose = require("mongoose");
// dotenv leser inn verdier fra .env-filen.
require("dotenv").config();

// Henter routes fra egne filer, så app.js ikke blir for lang.
const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const adminRoutes = require("./routes/adminRoutes");
const apiRoutes = require("./routes/apiRoutes");

// Lager Express-appen og henter innstillinger fra .env.
const app = express();
// process.env.PORT bruker port fra .env hvis den finnes.
const PORT = process.env.PORT || 3000;
// MONGODB_URI er adressen til MongoDB-serveren.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://10.12.13.216:27017/eksamenit26";
// SESSION_SECRET brukes for å beskytte session.
const SESSION_SECRET = process.env.SESSION_SECRET || "eksamen-hemmelighet";

// Setter opp EJS, public-mappen, skjema-data og JSON.
// view engine ejs betyr at serveren kan vise .ejs-filer.
app.set("view engine", "ejs");
// public-mappen brukes til CSS, bilder og frontend-JavaScript.
app.use(express.static("public"));
// express.urlencoded gjør at serveren kan lese data fra HTML-skjemaer.
app.use(express.urlencoded({ extended: true }));
// express.json gjør at serveren kan lese JSON fra API-kall.
app.use(express.json());

// Session gjør at serveren husker hvem som er logget inn.
app.use(session({
    // secret brukes til å signere session-cookie.
    secret: SESSION_SECRET,
    // resave: false gjør at session ikke lagres på nytt uten endringer.
    resave: false,
    // saveUninitialized: false betyr at tomme sessions ikke lagres.
    saveUninitialized: false
}));

// Gjør innlogget bruker tilgjengelig i alle EJS-sider.
app.use((req, res, next) => {
    // res.locals.user kan brukes direkte i EJS-filene.
    res.locals.user = req.session.user || null;
    // next går videre til neste middleware eller route.
    next();
});

// Kobler Node.js-serveren til MongoDB-serveren.
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Koblet til MongoDB");
    })
    .catch((error) => {
        console.log("Kunne ikke koble til MongoDB:", error.message);
    });

// Kobler routes inn i appen.
// Disse routene viser vanlige sider.
app.use(pageRoutes);
// Disse routene håndterer innlogging, registrering og utlogging.
app.use(authRoutes);
// Disse routene håndterer saker.
app.use(issueRoutes);
// Disse routene håndterer adminpanelet.
app.use(adminRoutes);
// /api betyr at alle API-routes starter med /api.
app.use("/api", apiRoutes);

// Starter serveren.
app.listen(PORT, () => {
    // Denne meldingen vises i terminalen når serveren kjører.
    console.log(`Server kjører på http://localhost:${PORT}`);
});
