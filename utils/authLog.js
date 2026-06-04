// Henter AuthLog-modellen, slik at vi kan lagre logger i MongoDB.
const AuthLog = require("../models/AuthLog");

// Denne funksjonen lagrer innlogging, utlogging og failed login.
// username er brukeren det gjelder.
// action er hva som skjedde, for eksempel login, logout eller failed login.
async function saveAuthLog(username, action) {
    // AuthLog.create lager et nytt dokument i AuthLog-collectionen.
    await AuthLog.create({
        // username lagrer hvem hendelsen gjelder.
        username,
        // action lagrer hva som skjedde.
        action
    });
}

// Gjør funksjonen tilgjengelig for andre filer, for eksempel authRoutes.js.
// Da kan authRoutes.js bruke saveAuthLog når noen logger inn eller ut.
module.exports = saveAuthLog;
