// Pakker som trengs for å lage serveren.
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
require("dotenv").config();

// Henter routes fra egne filer, så app.js ikke blir for lang.
const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const adminRoutes = require("./routes/adminRoutes");
const apiRoutes = require("./routes/apiRoutes");

// Lager Express-appen og henter innstillinger fra .env.
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://10.12.13.216:27017/eksamenit26";
const SESSION_SECRET = process.env.SESSION_SECRET || "eksamen-hemmelighet";

// Setter opp EJS, public-mappen, skjema-data og JSON.
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session gjør at serveren husker hvem som er logget inn.
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
app.use(pageRoutes);
app.use(authRoutes);
app.use(issueRoutes);
app.use(adminRoutes);
app.use("/api", apiRoutes);

// Starter serveren.
app.listen(PORT, () => {
    console.log(`Server kjører på http://localhost:${PORT}`);
});
