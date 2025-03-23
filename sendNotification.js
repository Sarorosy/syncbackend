const admin = require("./firebaseAdmin");

/**
 * Sends a push notification via Firebase Cloud Messaging (FCM).
 * 
 * @param {string} token - The FCM token of the recipient device.
 * @param {string} title - The notification title.
 * @param {string} description - The notification body.
 * @param {Object} [data={}] - Additional custom data (optional).
 * @returns {Promise<Object>} - Firebase response or error message.
 */
const sendNotification = async (token, title, description, data = {}) => {
    try {
        const message = {
            token: token,
            notification: {
                title: title,
                body: description,
            },
            data: data, // Optional custom data
        };

        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
        return { success: true, response };
    } catch (error) {
        console.error("Error sending notification:", error);
        return { success: false, error: error.message };
    }
};

module.exports = sendNotification;
