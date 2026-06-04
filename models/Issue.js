// Henter mongoose, som brukes for å lage MongoDB-modeller.
const mongoose = require("mongoose");

// Issue-schema beskriver hvordan en sak skal lagres i databasen.
const issueSchema = new mongoose.Schema({
    // Tittel er en kort overskrift på saken.
    title: {
        // type: String betyr at feltet skal være tekst.
        type: String,
        // required: true betyr at feltet må fylles ut.
        required: true,
        // trim: true fjerner mellomrom før og etter teksten.
        trim: true
    },
    // Beskrivelse forklarer problemet eller utfordringen.
    description: {
        // type: String betyr at beskrivelsen lagres som tekst.
        type: String,
        // required: true betyr at saken må ha en beskrivelse.
        required: true
    },
    // Kategori brukes for å gruppere saker.
    category: {
        // type: String betyr at kategori er tekst.
        type: String,
        // required: true betyr at brukeren må skrive en kategori.
        required: true
    },
    // Status viser hvor langt saken har kommet.
    status: {
        // type: String betyr at status lagres som tekst.
        type: String,
        // enum betyr at bare disse verdiene er lov.
        enum: ["åpen", "under arbeid", "løst"],
        // default: "åpen" betyr at nye saker starter som åpne.
        default: "åpen"
    },
    // createdBy kobler saken til brukeren som opprettet den.
    createdBy: {
        // ObjectId betyr at feltet lagrer id-en til et dokument i MongoDB.
        type: mongoose.Schema.Types.ObjectId,
        // ref: "User" betyr at id-en peker til en bruker i User-modellen.
        ref: "User",
        // required: true betyr at saken må ha en eier.
        required: true
    },
    // teacherResponse lagrer svaret fra lærer.
    teacherResponse: {
        // type: String betyr at lærersvaret lagres som tekst.
        type: String,
        // default: "" betyr at feltet starter som en tom tekst.
        default: ""
    },
    // createdAt lagrer når saken ble opprettet.
    createdAt: {
        // type: Date betyr at feltet lagrer dato og tid.
        type: Date,
        // default: Date.now betyr at datoen settes automatisk når saken lages.
        default: Date.now
    }
});

// Eksporterer Issue-modellen, slik at andre filer kan bruke den.
module.exports = mongoose.model("Issue", issueSchema);
