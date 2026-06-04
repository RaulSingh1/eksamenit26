// bcrypt brukes for å hashe passordet til admin-brukeren.
const bcrypt = require("bcryptjs");
// mongoose brukes for å koble scriptet til MongoDB.
const mongoose = require("mongoose");
// dotenv gjør at scriptet kan lese verdier fra .env.
require("dotenv").config();

// Henter User-modellen, slik at scriptet kan lage en admin-bruker.
const User = require("../models/User");

// Leser innstillinger fra .env, eller bruker standardverdier hvis de mangler.
// process.env.MONGODB_URI prøver først å hente MongoDB-adressen fra .env.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://10.12.13.216:27017/eksamenit26";
// ADMIN_USERNAME er brukernavnet til admin-brukeren.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
// ADMIN_PASSWORD er passordet som skal hashes og lagres.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Denne funksjonen oppretter første admin-bruker i databasen.
async function seedAdmin() {
    // Kobler scriptet til MongoDB.
    // await gjør at koden venter til koblingen er ferdig.
    await mongoose.connect(MONGODB_URI);

    // Sjekker om admin-brukeren allerede finnes.
    // findOne leter etter én bruker med samme brukernavn.
    const existingAdmin = await User.findOne({ username: ADMIN_USERNAME });

    if (existingAdmin) {
        // Hvis admin finnes fra før, skal scriptet ikke lage en ny.
        console.log("Admin-brukeren finnes allerede.");
        await mongoose.disconnect();
        return;
    }

    // Hasher passordet før det lagres i databasen.
    // 10 er styrken på hashingen.
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Lager admin-brukeren med rollen admin.
    // User.create lagrer en ny bruker i MongoDB.
    await User.create({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: "admin"
    });

    console.log("Admin-bruker er opprettet.");
    // Kobler fra databasen når scriptet er ferdig.
    await mongoose.disconnect();
}

// Kjører funksjonen og viser feilmelding hvis noe går galt.
// catch kjører hvis seedAdmin feiler.
seedAdmin().catch(async (error) => {
    // error.message viser en kort forklaring på feilen.
    console.log("Kunne ikke opprette admin:", error.message);
    await mongoose.disconnect();
});
