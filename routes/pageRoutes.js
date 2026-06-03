const express = require("express");
const { requireLogin, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/support", requireLogin, requireRole(["elev", "lærer"]), (req, res) => {
    res.render("support");
});

module.exports = router;
