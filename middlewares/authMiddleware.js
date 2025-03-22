const db = require("../db");

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ status: false, message: "Unauthorized, token missing" });
    }

    db.query("SELECT * FROM tbl_users WHERE token = ?", [token], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ status: false, message: "Invalid or expired token", token });
        }

        req.user = results[0]; // Attach user info to the request
        next();
    });
};

module.exports = authenticateUser;
