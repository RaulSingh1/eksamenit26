const express = require("express");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/support", requireLogin, (req, res) => {
    res.render("support");
});

module.exports = router;
