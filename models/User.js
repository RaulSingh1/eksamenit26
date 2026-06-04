// Henter mongoose, som brukes for å lage MongoDB-modeller.
const mongoose = require("mongoose");

// User-schema beskriver hvordan en bruker skal lagres i databasen.
const userSchema = new mongoose.Schema({
    // Brukernavn må være unikt, slik at to brukere ikke har samme navn.
    username: {
        // type: String betyr at brukernavn skal være tekst.
        type: String,
        // required: true betyr at brukernavn må fylles ut.
        required: true,
        // unique: true betyr at samme brukernavn ikke kan brukes flere ganger.
        unique: true,
        // trim: true fjerner mellomrom før og etter brukernavnet.
        trim: true
    },
    // Passord lagres som hash, ikke vanlig tekst.
    password: {
        // type: String betyr at passord-hashen lagres som tekst.
        type: String,
        // required: true betyr at brukeren må ha passord.
        required: true
    },
    // Rollen bestemmer hva brukeren har tilgang til.
    role: {
        // type: String betyr at rollen lagres som tekst.
        type: String,
        // enum betyr at bare disse tre rollene er lov.
        enum: ["elev", "lærer", "admin"],
        // default: "elev" betyr at brukeren blir elev hvis ingen rolle velges.
        default: "elev"
    }
});

// Eksporterer User-modellen, slik at andre filer kan bruke den.
// "User" blir navnet på modellen som Mongoose bruker mot MongoDB.
module.exports = mongoose.model("User", userSchema);
