const path = require('node:path');
const Notification = require('../models/Notification');
require('dotenv').config();

const serveForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/form.html'));
};

const updateNotification = async (req, res) => {
  try {
    const { type, title, subtitle, image_url_hidden, secret } = req.body;

    if (secret !== process.env.ADMIN_KEY) {
      return res.status(403).send('Invalid secret key.');
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (subtitle) updateData.subtitle = subtitle;
    if (image_url_hidden) updateData.image_url = image_url_hidden;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send('No fields to update.');
    }

    const notification = await Notification.findOneAndUpdate(
      { type },
      { $set: updateData },
      { new: true, upsert: true }
    );

    if (!notification) {
      return res.status(404).send('Notification not found.');
    }

    res.send('Notification updated successfully!');
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).send('An error occurred while updating the notification.');
  }
};


module.exports = { serveForm, updateNotification };
