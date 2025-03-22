const db = require("../db");

const createComment = (comment, callback) => {
    const sql = `INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())`;
    db.query(sql, [comment.task_id, comment.user_id, comment.comment, comment.islog], callback);
};

// Get all comments for a task
const getCommentsByTaskId = (task_id, callback) => {
    const sql = `
        SELECT c.*, u.name AS user_name, u.profile_pic 
        FROM tbl_comments c 
        JOIN tbl_users u ON c.user_id = u.id 
        WHERE c.task_id = ?
        ORDER BY c.created_at ASC
    `;
    db.query(sql, [task_id], callback);
};

// Delete a comment
const deleteComment = (id, callback) => {
    db.query("DELETE FROM tbl_comments WHERE id = ?", [id], callback);
};

module.exports = { createComment, getCommentsByTaskId, deleteComment };
