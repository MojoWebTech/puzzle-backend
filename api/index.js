'use strict';

const cors = require('cors');
const request = require('request');
const express = require('express');
const  body_parser = require('body-parser');
const { Blob } = require('buffer'); 
const https = require('https');
// const fetch = require('node-fetch');
const axios = require('axios');


require('dotenv').config()


const  app = express();

app.use(cors());
app.use(express.json());
app.use(body_parser.json()); 

const sendMessage = (sender_psid, player_id, message, title, image_url) => {
  // Construct the message body
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
              "title": title,
              "subtitle": message,
              "image_url": image_url,
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
  }  

  // console.log(process.env.PAGE_ACCESS_TOKEN)
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    console.log("Hii");
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
  
}

app.get("/", (req, res) => res.send("Express on Vercel"));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;
  
  console.log("Received webhook")
  console.log(body);

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach((entry)=>{
      let event = entry.messaging[0];
      console.log("hii ",event);
      if (event.game_play) 
      {
        var senderId = event.sender.id; // Messenger sender id
        var playerId = event.game_play.player_id; // Instant Games player id
        var payload = event.game_play.payload;

        if(payload)
        {
          console.log(payload);
          var playerWon = JSON.parse(payload).playerWon;
          var image_url = JSON.parse(payload).image_url;
          console.log(playerWon);
          if (playerWon) 
          {
            sendMessage(
              senderId, 
              playerId,
              'Congratulations on your victory!', 
              'Play Again',
              image_url
            );
          } 
          else 
          {
            sendMessage(
              senderId, 
              playerId,
              'Better luck next time!', 
              'Rematch!',
              image_url
            );
            console.log("....")
          }

          console.log("Sent message")

        }
      }

      
    });
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

//   console.log(mode,token,challenge);
//   console.log(VERIFY_TOKEN);
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.log("Forbidden")
      res.sendStatus(403);      
    }
  }
});

// app.post('/convert-image', async(req, res) => {
//   const { imageUrl } = req.body;
//   console.log(imageUrl)

//   if (!imageUrl) {
//     return res.status(400).json({ error: 'Image URL is required' });
//   }

//   try {
//     // Parse the URL
//     const response = await fetch(imageUrl);
//     // const blob = await response.blob();

//     if (!response.ok) {
//       throw new Error('Failed to fetch image');
//     }

//         // Convert the response to a Buffer
//     const arrayBuffer = await response.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Set appropriate headers for sending the image
//     res.setHeader('Content-Type', response.headers.get('content-type'));
//     res.setHeader('Content-Disposition', 'inline; filename=image.jpg');

//     // Send the Buffer back to the client
//     res.send(buffer);

    
//       // console.log(blob);
//       // res.send(blob);

//   } catch (error) {
//     console.error('Error processing request:', error.message);
//     res.status(500).json({ error: 'Failed to process request' });
//   }
// });



app.listen(3000, () => console.log("Server ready on port 3000."));
