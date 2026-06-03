const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Issue = require("../models/Issue");
const AuthLog = require("../models/AuthLog");
const { requireLogin, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/admin", requireLogin, requireRole(["admin"]), async (req, res) => {
    const users = await User.find().sort({ username: 1 });
    const issues = await Issue.find().populate("createdBy", "username role").sort({ createdAt: -1 });
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(30);

    res.render("admin", {
        users,
        issues,
        authLogs,
        message: req.query.message || ""
    });
});

router.post("/admin/users", requireLogin, requireRole(["admin"]), async (req, res) => {
    const { username, password, role } = req.body;
    const allowedRoles = ["elev", "lærer", "admin"];
    const existingUser = await User.findOne({ username });

    if (!username || !password || !allowedRoles.includes(role)) {
        return res.redirect("/admin?message=Ugyldig brukerdata");
    }

    if (existingUser) {
        return res.redirect("/admin?message=Brukeren finnes allerede");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        username,
        password: hashedPassword,
        role
    });

    res.redirect("/admin?message=Bruker opprettet");
});

router.post("/admin/users/:id/role", requireLogin, requireRole(["admin"]), async (req, res) => {
    const allowedRoles = ["elev", "lærer", "admin"];

    if (!allowedRoles.includes(req.body.role)) {
        return res.redirect("/admin?message=Ugyldig rolle");
    }

    if (req.params.id === req.session.user.id) {
        return res.redirect("/admin?message=Du kan ikke endre din egen rolle");
    }

    await User.findByIdAndUpdate(req.params.id, {
        role: req.body.role
    });

    res.redirect("/admin?message=Rolle oppdatert");
});

router.post("/admin/users/:id/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    if (req.params.id === req.session.user.id) {
        return res.redirect("/admin?message=Du kan ikke slette din egen bruker");
    }

    await Issue.deleteMany({
        createdBy: req.params.id
    });

    await User.findByIdAndDelete(req.params.id);

    res.redirect("/admin?message=Bruker slettet");
});

router.post("/admin/issues/:id/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    await Issue.findByIdAndDelete(req.params.id);

    res.redirect("/admin?message=Sak slettet");
});

router.post("/admin/logs/delete", requireLogin, requireRole(["admin"]), async (req, res) => {
    await AuthLog.deleteMany({});

    res.redirect("/admin?message=Logger slettet");
});

module.exports = router;
