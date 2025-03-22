const commentModel = require("../models/commentsModel");

const createComment = (req, res) => {
    const { task_id, comment, islog } = req.body;
    const user_id = req.user.id; // Extracted from token

    if (!task_id || !comment) {
        return res.status(400).json({ status: false, message: "Task ID and Comment are required" });
    }

    const newComment = { task_id, user_id, comment, islog: islog || 0 };

    commentModel.createComment(newComment, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Comment added successfully", commentId: result.insertId });
    });
};

// Get comments by task ID
const getCommentsByTaskId = (req, res) => {
    const { task_id } = req.params;

    commentModel.getCommentsByTaskId(task_id, (err, comments) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, comments });
    });
};

// Delete a comment
const deleteComment = (req, res) => {
    const { id } = req.params;

    commentModel.deleteComment(id, (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "Database error", error: err });
        res.json({ status: true, message: "Comment deleted successfully" });
    });
};

const uploadCommentImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: 0, message: "No image uploaded" });
    }
    res.json({
        success: 1, // This is required by EditorJS
        file: {
            url: `http://localhost:5000/uploads/commentuploads/${req.file.filename}`, // Correct format
        },
    });
};

module.exports = { createComment, getCommentsByTaskId, deleteComment, uploadCommentImage };
