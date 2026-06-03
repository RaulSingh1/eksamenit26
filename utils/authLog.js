const AuthLog = require("../models/AuthLog");

async function saveAuthLog(username, action) {
    await AuthLog.create({
        username,
        action
    });
}

module.exports = saveAuthLog;
