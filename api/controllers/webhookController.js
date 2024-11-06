const fetch = require('node-fetch');
const Notification = require('../models/Notification');
const { FB_GRAPH_URL } = require('../config/fb');
require('dotenv').config();


const sendMessage = async (sender_psid, player_id, type, image_url) => {
  try {
    const notification = await Notification.findOne({ type });
    if (!notification) {
      console.error(`No notification found for type: ${type}`);
      return;
    }

    const request_body = {
      recipient: {
        id: sender_psid
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: notification.title || "Default Title",
                subtitle: notification.subtitle || "Default Subtitle",
                image_url: notification.image_url === "default" ? image_url : notification.image_url,
                buttons: [
                  {
                    type: "game_play",
                    title: "Play",
                    payload: "{}",
                    game_metadata: {
                      player_id: player_id
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    };

    console.log("Sending message to Facebook...");
    const response = await fetch(`${FB_GRAPH_URL}/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_body),
    });

    if (!response.ok) {
      console.error("Error response from Facebook:", response.status, await response.text());
    } else {
      console.log("Message sent successfully");
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
};


const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
  }
  console.log("Verification failed: Forbidden");
  res.sendStatus(403);
};


const handleWebhookEvent = async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    console.log("Received webhook event");

    for (const entry of body.entry) {
      const event = entry.messaging[0];
      if (event.game_play) {
        const senderId = event.sender.id;
        const playerId = event.game_play.player_id;
        const payload = event.game_play.payload;

        if (payload) {
          const { playerWon, image_url } = JSON.parse(payload);
          const messageType = playerWon ? 'success' : 'failure';

          await sendMessage(senderId, playerId, messageType, image_url);
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
};



module.exports = { verifyWebhook, handleWebhookEvent };
