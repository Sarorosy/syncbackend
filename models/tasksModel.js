const db = require("../db");

const createTask = (task, callback) => {
    const sql = `INSERT INTO tbl_tasks (title, description, assigned_to, followers, status, priority, due_date, due_time, created_by, image_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; 
                 
    db.query(sql, [
        task.title,
        task.description,
        task.assigned_to,
        task.followers,
        task.status,
        task.priority,
        task.due_date,
        task.due_time,
        task.created_by,
        task.image_url || null
    ], (err, result) => {
        if (err) {
            return callback(err, null);
        }

        // Get the inserted task's ID
        const taskId = result.insertId;

        // Insert a default comment into tbl_comments
        const commentSql = "INSERT INTO tbl_comments (task_id, user_id, comment, islog, created_at) VALUES (?, ?, ?, ?, NOW())";
        db.query(commentSql, [taskId, task.created_by, "Created task", 1], (commentErr) => {
            if (commentErr) {
                console.error("Error saving comment:", commentErr);
            }
            callback(null, result); // Return the original task creation result
        });
    });
};



const getAllTasks = (callback) => {
    db.query(
        `SELECT 
            t.*, 
            u.id AS assigned_user_id, 
            u.name AS assigned_user_name, 
            u.email AS assigned_user_email, 
            u.profile_pic AS assigned_user_profile
        FROM tbl_tasks t
        LEFT JOIN tbl_users u ON t.assigned_to = u.id`,
        (err, tasks) => {
            if (err) return callback(err, null);

            // Process followers to retrieve user details
            const tasksWithFollowers = tasks.map(task => {
                if (!task.followers) {
                    return { ...task, followers: [] };
                }

                const followerIds = task.followers.split(",").map(id => parseInt(id, 10));
                return new Promise((resolve, reject) => {
                    db.query(
                        `SELECT id, name, email, profile_pic FROM tbl_users WHERE id IN (?)`,
                        [followerIds],
                        (err, followers) => {
                            if (err) reject(err);
                            resolve({ ...task, followers });
                        }
                    );
                });
            });

            // Resolve all promises
            Promise.all(tasksWithFollowers)
                .then(results => callback(null, results))
                .catch(err => callback(err, null));
        }
    );
};



// Get a task by ID
const getTaskById = (id, callback) => {
    db.query("SELECT * FROM tbl_tasks WHERE id = ?", [id], callback);
};

// Update a task
const updateTask = (id, task, callback) => {
    const sql = `UPDATE tbl_tasks SET title=?, description=?, assigned_to=?, followers=?, status=?, priority=?, due_date=?, due_time=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`;
    db.query(sql, [
        task.title,
        task.description,
        task.assigned_to,
        task.followers,
        task.status,
        task.priority,
        task.due_date,
        task.due_time,
        id
    ], callback);
};

// Delete a task
const deleteTask = (id, callback) => {
    db.query("DELETE FROM tbl_tasks WHERE id = ?", [id], callback);
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
};
