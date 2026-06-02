const mongoose = require("mongoose");

const authLogSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    action: {
        type: String,
        enum: ["login", "logout", "failed login"],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("AuthLog", authLogSchema);
