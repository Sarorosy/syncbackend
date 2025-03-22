const multer = require("multer");
const path = require("path");

// Set storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/commetuploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

module.exports = upload;
