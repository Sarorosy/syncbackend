const db = require("../db");

// Create a new team
const createTeam = async (team, callback) => {
    const uniqueId = await generateUniqueId();
    const sql = `INSERT INTO tbl_teams (unique_id , team_name, team_description, members) VALUES (?, ?, ?, ?)`;
    db.query(sql, [uniqueId, team.team_name, team.description, JSON.stringify(team.members)], callback);
};

// Get all teams
const getAllTeams = (callback) => {
    const sql = `SELECT * FROM tbl_teams`;
    db.query(sql, callback);
};

// Get a team by ID
const getTeamById = (id, callback) => {
    const sql = `SELECT * FROM tbl_teams WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]); // Return single team object
    });
};

const getTeamByUniqueId = (id, callback) => {
    const sql = `
        SELECT t.*, 
               JSON_ARRAYAGG(
                   JSON_OBJECT(
                       'id', u.id,
                       'name', u.name,
                       'profile_pic', u.profile_pic,
                       'email', u.email
                   )
               ) AS members
        FROM tbl_teams t
        LEFT JOIN tbl_users u ON JSON_CONTAINS(t.members, CAST(u.id AS JSON))
        WHERE t.unique_id = ?
        GROUP BY t.id;
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]); // Return single team object
    });
};


// Update a team
const updateTeam = (id, team, callback) => {
    const sql = `UPDATE tbl_teams SET team_name = ?, team_description = ?, members = ? WHERE id = ?`;
    db.query(sql, [team.team_name, team.description, JSON.stringify(team.members), id], callback);
};
// Get present teams based on user ID
const getPresentTeams = (userId, callback) => {
    const sql = `SELECT * FROM tbl_teams WHERE JSON_CONTAINS(members, ?)`;
    db.query(sql, [JSON.stringify(userId)], callback);
};
// Delete a team
const deleteTeam = (id, callback) => {
    const sql = `DELETE FROM tbl_teams WHERE id = ?`;
    db.query(sql, [id], callback);
};

const generateUniqueId = async () => {
    return new Promise((resolve, reject) => {
        const generateRandomString = () => Math.random().toString(36).substring(2, 12).toUpperCase();

        const checkUniqueId = (uniqueId) => {
            db.query("SELECT COUNT(*) AS count FROM tbl_teams WHERE unique_id = ?", [uniqueId], (err, result) => {
                if (err) return reject(err);
                if (result[0].count === 0) return resolve(uniqueId); // Unique ID found
                else resolve(generateUniqueId()); // Retry
            });
        };

        checkUniqueId(generateRandomString());
    });
};
module.exports = { createTeam, getAllTeams, getTeamById, updateTeam,getPresentTeams,getTeamByUniqueId, deleteTeam };
