// requireLogin brukes på routes som krever at brukeren er logget inn.
function requireLogin(req, res, next) {
    // req.session.user finnes bare hvis brukeren har logget inn.
    if (!req.session.user) {
        // Hvis brukeren ikke er logget inn, sendes brukeren til login-siden.
        return res.redirect("/login");
    }

    // next() betyr at brukeren får gå videre til routen.
    next();
}

// requireRole brukes når bare bestemte roller skal få tilgang.
function requireRole(roles) {
    // roles er en liste, for eksempel ["admin"] eller ["elev", "lærer"].
    return (req, res, next) => {
        // Sjekker både at brukeren er logget inn og har en lovlig rolle.
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            // 403 betyr at brukeren er stoppet fordi den mangler tilgang.
            return res.status(403).render("error", {
                message: "Du har ikke tilgang til denne siden."
            });
        }

        // Hvis rollen stemmer, får brukeren gå videre.
        next();
    };
}

// Samme som requireLogin, men for API-routes.
function requireApiLogin(req, res, next) {
    if (!req.session.user) {
        // API-et sender JSON i stedet for å vise en EJS-side.
        return res.status(401).json({
            message: "Du må være logget inn."
        });
    }

    next();
}

// Samme som requireRole, men for API-routes.
function requireApiRole(roles) {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            // 403 betyr at brukeren er logget inn, men ikke har riktig rolle.
            return res.status(403).json({
                message: "Du har ikke tilgang."
            });
        }

        next();
    };
}

// Eksporterer funksjonene slik at routes kan bruke dem.
module.exports = {
    requireLogin,
    requireRole,
    requireApiLogin,
    requireApiRole
};
