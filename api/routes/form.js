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
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .container {
                width: 50%;
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                text-align: center;
                color: #333;
              }
              form {
                display: flex;
                flex-direction: column;
              }
              label {
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
              }
              input[type="text"],
              input[type="url"],
              input[type="password"],
              select {
                padding: 8px;
                margin-bottom: 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 16px;
              }
              input[type="radio"] {
                margin-right: 10px;
              }
              input[type="submit"] {
                background-color: #4CAF50;
                color: #fff;
                border: none;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              }
              input[type="submit"]:hover {
                background-color: #45a049;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Notification Payload</h1>
              <form action="/submit-form" method="POST" onsubmit="return handleSubmit()">
                <label for="type">Notification to Update:</label>
                <select id="type" name="type" required>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                </select>

                <label for="title">Title:</label>
                <input type="text" id="title" name="title">

                <label for="subtitle">Subtitle:</label>
                <input type="text" id="subtitle" name="subtitle">

                <label for="image_url">Image URL:</label>
                <input type="url" id="image_url" name="image_url">
                <label>
                  <input type="radio" name="image_option" value="default" id="use_default" onclick="toggleImageUrl(false)"> Use default image
                </label>
                <label>
                  <input type="radio" name="image_option" value="custom" id="use_custom" onclick="toggleImageUrl(true)" checked> Use custom image
                </label>

                <input type="hidden" id="hidden_image_url" name="image_url_hidden">

                <label for="secret">Secret:</label>
                <input type="password" id="secret" name="secret" required>

                <input type="submit" value="Update Notification">
              </form>
            </div>

            <script>
              function toggleImageUrl(enable) {
                const imageUrlInput = document.getElementById('image_url');
                const hiddenImageUrlInput = document.getElementById('hidden_image_url');
                if (enable) {
                  imageUrlInput.disabled = false;
                  hiddenImageUrlInput.value = imageUrlInput.value;
                } else {
                  imageUrlInput.disabled = true;
                  imageUrlInput.value = 'default';
                  hiddenImageUrlInput.value = 'default';
                }

              }

              function handleSubmit() {
                const defaultRadio = document.getElementById('use_default');
                const imageUrlInput = document.getElementById('image_url');
                const hiddenImageUrlInput = document.getElementById('hidden_image_url');

                if (defaultRadio.checked) {
                  hiddenImageUrlInput.value = 'default';
                } else {
                  hiddenImageUrlInput.value = imageUrlInput.value;
                }

                return true; // Allow the form to submit
              }

              // Initialize the form state
              document.addEventListener('DOMContentLoaded', () => {
                const defaultRadio = document.getElementById('use_default');
                const customRadio = document.getElementById('use_custom');
                const imageUrlInput = document.getElementById('image_url');

                if (defaultRadio.checked) {
                  toggleImageUrl(false);
                } else {
                  toggleImageUrl(true);
                }
              });
            </script>
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
    const { type, title, subtitle, image_url_hidden, secret } = req.body;

    if (secret !== process.env.ADMIN_KEY) {
      return res.status(403).send('Invalid secret key.');
    }

    let updateData = {};
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
});

module.exports = router;
