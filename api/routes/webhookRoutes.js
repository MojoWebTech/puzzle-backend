const express = require('express');
const router = express.Router();
require('dotenv').config()
const Notification = require('../models/Notification');  // Import the Notification model



const sendMessage = async (sender_psid, player_id, type, image_url) => {
  try {
    const notification = await Notification.findOne({ type });
    if (!notification) {
      console.error(`No notification found for type: ${type}`);
      return;
    }

    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [
              {
                "title": notification.title || "Default Title",
                "subtitle": notification.subtitle || "Default Subtitle",
                "image_url": image_url || notification.image_url, 
                "buttons": [
                  {
                    "type": "game_play",
                    "title": "Play",
                    "payload": "{}",
                    "game_metadata": {
                      "player_id": player_id
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    };

    console.log("Before post");
    const response = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_body),
    });

    console.log(response);
    console.log("After post");
  } catch (error) {
    console.error('Error sending message:', error);
  }
};


router.get('/', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      }
    }

    console.log("Forbidden")
    res.sendStatus(403);      
  }); 

router.post('/', async(req, res) => {  

    let body = req.body;
    
    console.log("Received webhook")
    console.log(body);
  
    if (body.object === 'page') {
      body.entry.forEach(async (entry)=>{
        let event = entry.messaging[0];
        if (event.game_play) 
        {
          var senderId = event.sender.id; 
          var playerId = event.game_play.player_id;
          var payload = event.game_play.payload;
  
          if(payload)
          {
            var playerWon = JSON.parse(payload).playerWon;
            var image_url = JSON.parse(payload).image_url;

            if (playerWon) 
            {
              await sendMessage(
                senderId, 
                playerId,
                'success',
                image_url
              );
            } 
            else 
            {
              await sendMessage(
                senderId, 
                playerId,
                'failure',
                image_url
              );
            }
          }
        }
      });
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  });

module.exports = router;