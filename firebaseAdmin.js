const admin = require("firebase-admin");
const serviceAccount = require("./dove0101-cb193bcdfa66.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
