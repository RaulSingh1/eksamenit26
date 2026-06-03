function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            return res.status(403).render("error", {
                message: "Du har ikke tilgang til denne siden."
            });
        }

        next();
    };
}

function requireApiLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Du må være logget inn."
        });
    }

    next();
}

function requireApiRole(roles) {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            return res.status(403).json({
                message: "Du har ikke tilgang."
            });
        }

        next();
    };
}

module.exports = {
    requireLogin,
    requireRole,
    requireApiLogin,
    requireApiRole
};
