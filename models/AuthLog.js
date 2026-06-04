// Henter mongoose, som brukes for å lage MongoDB-modeller.
const mongoose = require("mongoose");

// AuthLog-schema beskriver hvordan innloggingslogger lagres.
const authLogSchema = new mongoose.Schema({
    // username er brukeren som hendelsen gjelder.
    username: {
        // type: String betyr at brukernavn lagres som tekst.
        type: String,
        // required: true betyr at loggen må ha brukernavn.
        required: true,
        // trim: true fjerner mellomrom før og etter brukernavnet.
        trim: true
    },
    // action er hva som skjedde.
    action: {
        // type: String betyr at handlingen lagres som tekst.
        type: String,
        // enum betyr at bare disse handlingene er lov.
        enum: ["login", "logout", "failed login"],
        // required: true betyr at loggen må ha en handling.
        required: true
    },
    // timestamp lagrer tidspunktet for hendelsen.
    timestamp: {
        // type: Date betyr at feltet lagrer dato og tid.
        type: Date,
        // default: Date.now betyr at tidspunktet settes automatisk.
        default: Date.now
    }
});

// Eksporterer AuthLog-modellen, slik at andre filer kan bruke den.
module.exports = mongoose.model("AuthLog", authLogSchema);
