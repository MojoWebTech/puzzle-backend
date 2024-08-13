const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route to display the form
router.get('/form', async (req, res) => {
    try {
      res.send(`
        <html>
          <head>
            <title>Update Notification</title>
          </head>
          <body>
            <h1>Update Notification</h1>
            <form action="/submit-form" method="POST">
              <label for="type">Notification to Update:</label>
              <select id="type" name="type" required>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select><br><br>
  
              <label for="title">Title:</label>
              <input type="text" id="title" name="title"><br><br>
  
              <label for="subtitle">Subtitle:</label>
              <input type="text" id="subtitle" name="subtitle"><br><br>
  
              <label for="image_url">Image URL:</label>
              <input type="url" id="image_url" name="image_url"><br><br>
  
              <label for="secret">Secret:</label>
              <input type="password" id="secret" name="secret" required><br><br>
  
              <input type="submit" value="Update Notification">
            </form>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).send('An error occurred while fetching notifications.');
    }
  });

// Route to handle form submission
router.post('/submit-form', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { type, title, subtitle, image_url, secret } = req.body;

    if (secret !== process.env.ADMIN_KEY) {
      return res.status(403).send('Invalid secret key.');
    }

    let updateData = {};
    if (title) updateData.title = title;
    if (subtitle) updateData.subtitle = subtitle;
    if (image_url) updateData.image_url = image_url;

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
});

module.exports = router;
