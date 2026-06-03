const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://10.12.13.216:27017/eksamenit26";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function seedAdmin() {
    await mongoose.connect(MONGODB_URI);

    const existingAdmin = await User.findOne({ username: ADMIN_USERNAME });

    if (existingAdmin) {
        console.log("Admin-brukeren finnes allerede.");
        await mongoose.disconnect();
        return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: "admin"
    });

    console.log("Admin-bruker er opprettet.");
    await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
    console.log("Kunne ikke opprette admin:", error.message);
    await mongoose.disconnect();
});
