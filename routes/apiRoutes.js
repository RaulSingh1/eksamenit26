const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Issue = require("../models/Issue");
const AuthLog = require("../models/AuthLog");
const { requireApiLogin, requireApiRole } = require("../middleware/auth");

const router = express.Router();
const MAX_ISSUES_PER_STUDENT = 5;

router.get("/issues", requireApiLogin, async (req, res) => {
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    const issues = await Issue.find(filter).populate("createdBy", "username role");
    res.json(issues);
});

router.get("/issues/:id", requireApiLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    const ownsIssue = issue.createdBy._id.toString() === req.session.user.id;
    const canSeeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canSeeAll) {
        return res.status(403).json({ message: "Du har ikke tilgang til denne saken." });
    }

    res.json(issue);
});

router.post("/issues", requireApiLogin, requireApiRole(["elev", "admin"]), async (req, res) => {
    if (!req.body.title || !req.body.description || !req.body.category) {
        return res.status(400).json({ message: "Alle feltene må fylles ut." });
    }

    if (req.session.user.role === "elev") {
        const issueCount = await Issue.countDocuments({
            createdBy: req.session.user.id
        });

        if (issueCount >= MAX_ISSUES_PER_STUDENT) {
            return res.status(403).json({ message: "Du kan maks opprette 5 saker." });
        }
    }

    const issue = await Issue.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        createdBy: req.session.user.id
    });

    res.status(201).json(issue);
});

router.post("/issues/:id/status", requireApiLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    const ownsIssue = issue.createdBy.toString() === req.session.user.id;
    const canChangeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canChangeAll) {
        return res.status(403).json({ message: "Du har ikke tilgang til å endre denne saken." });
    }

    const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    }, { new: true });

    res.json(updatedIssue);
});

router.post("/issues/:id/teacher-response", requireApiLogin, requireApiRole(["lærer", "admin"]), async (req, res) => {
    const issue = await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    }, { new: true });

    if (!issue) {
        return res.status(404).json({ message: "Saken finnes ikke." });
    }

    res.json(issue);
});

router.get("/users", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const users = await User.find().select("username role").sort({ username: 1 });

    res.json(users);
});

router.post("/users", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const { username, password, role } = req.body;
    const allowedRoles = ["elev", "lærer", "admin"];
    const existingUser = await User.findOne({ username });

    if (!username || !password || !allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Ugyldig brukerdata." });
    }

    if (existingUser) {
        return res.status(400).json({ message: "Brukeren finnes allerede." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        username,
        password: hashedPassword,
        role
    });

    res.status(201).json({
        id: user._id,
        username: user.username,
        role: user.role
    });
});

router.get("/authlogs", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const authLogs = await AuthLog.find().sort({ timestamp: -1 }).limit(50);

    res.json(authLogs);
});

router.get("/critical-events", requireApiLogin, requireApiRole(["admin"]), async (req, res) => {
    const failedLogins = await AuthLog.find({
        action: "failed login"
    }).sort({ timestamp: -1 }).limit(20);

    const openIssues = await Issue.find({
        status: "åpen"
    }).populate("createdBy", "username role").sort({ createdAt: -1 }).limit(20);

    res.json({
        failedLogins,
        openIssues
    });
});

module.exports = router;
