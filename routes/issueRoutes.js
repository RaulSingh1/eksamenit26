const express = require("express");

const Issue = require("../models/Issue");
const { requireLogin, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/issues", requireLogin, async (req, res) => {
    const filter = req.session.user.role === "elev"
        ? { createdBy: req.session.user.id }
        : {};

    const issues = await Issue.find(filter)
        .populate("createdBy", "username role")
        .sort({ createdAt: -1 });

    res.render("issues", {
        issues
    });
});

router.get("/issues/new", requireLogin, requireRole(["elev", "admin"]), (req, res) => {
    res.render("new_issue", {
        error: ""
    });
});

router.post("/issues", requireLogin, requireRole(["elev", "admin"]), async (req, res) => {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
        return res.render("new_issue", {
            error: "Alle feltene må fylles ut."
        });
    }

    await Issue.create({
        title,
        description,
        category,
        createdBy: req.session.user.id
    });

    res.redirect("/issues");
});

router.get("/issues/:id", requireLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username role");

    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    const ownsIssue = issue.createdBy._id.toString() === req.session.user.id;
    const canSeeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canSeeAll) {
        return res.status(403).render("error", {
            message: "Du har ikke tilgang til denne saken."
        });
    }

    res.render("issue_detail", {
        issue
    });
});

router.post("/issues/:id/status", requireLogin, async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    const allowedStatuses = ["åpen", "under arbeid", "løst"];

    if (!issue) {
        return res.status(404).render("error", {
            message: "Saken finnes ikke."
        });
    }

    if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).render("error", {
            message: "Ugyldig status."
        });
    }

    const ownsIssue = issue.createdBy.toString() === req.session.user.id;
    const canChangeAll = ["lærer", "admin"].includes(req.session.user.role);

    if (!ownsIssue && !canChangeAll) {
        return res.status(403).render("error", {
            message: "Du har ikke tilgang til å endre denne saken."
        });
    }

    await Issue.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    });

    res.redirect(`/issues/${req.params.id}`);
});

router.post("/issues/:id/teacher-response", requireLogin, requireRole(["lærer", "admin"]), async (req, res) => {
    await Issue.findByIdAndUpdate(req.params.id, {
        teacherResponse: req.body.teacherResponse
    });

    res.redirect(`/issues/${req.params.id}`);
});

module.exports = router;
