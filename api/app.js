const cors = require('cors');
const request = require('request');
const express = require('express');
const  body_parser = require('body-parser');
const { Blob } = require('buffer'); 
const axios = require('axios');
const categoryRoutes = require('./routes/categoryRoutes');
const mongoose = require('mongoose');

const { processAndSaveCategories } = require('./data/utils');


// To use https (self signed)
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
}
require('dotenv').config()



const path = require('path');

const app = express();


app.use(express.static(path.join(__dirname, '../public')));
const corsOptions = {
  origin: ["https://localhost:3000", "https://apps-787876049864708.apps.fbsbx.com"],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
  credentials: true,
  optionsSuccessStatus: 204 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(body_parser.json()); 


const sendMessage = async(sender_psid, player_id, message, title, image_url) => {

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
  };
  console.log("Before post");
  const response = await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request_body),
  });

  console.log(response);
  // await axios.post(`https://graph.facebook.com/v16.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, request_body, {
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   timeout: 5000
  // })
  // .then(response => {
  //   console.log('Message sent!', response);
  // })
  // .catch(error => {
  //   console.error('Unable to send message:', error);
  // });
  console.log("After post");
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async() => {
    console.log('Connected to MongoDB');
    
    // Seed db
    // processAndSaveCategories();  
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

  app.get("/", (req, res) => res.send("Express on Vercel"));

  // Accepts POST requests at /webhook endpoint
  app.post('/webhook', async(req, res) => {  
    console.log("Hiii")
    // Parse the request body from the POST
    let body = req.body;
    
    console.log("Received webhook")
    console.log(body);
  
    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
  
      body.entry.forEach(async (entry)=>{
        let event = entry.messaging[0];
        // console.log("hii ",event);
        if (event.game_play) 
        {
          var senderId = event.sender.id; // Messenger sender id
          var playerId = event.game_play.player_id; // Instant Games player id
          var payload = event.game_play.payload;
  
          if(payload)
          {
            // console.log(payload);
            var playerWon = JSON.parse(payload).playerWon;
            var image_url = JSON.parse(payload).image_url;
            // console.log(playerWon);
            if (playerWon) 
            {
              await sendMessage(
                senderId, 
                playerId,
                'Congratulations on your victory!', 
                'Play Again',
                image_url
              );
            } 
            else 
            {
              await sendMessage(
                senderId, 
                playerId,
                'Better luck next time!', 
                'Rematch!',
                image_url
              );
              // console.log("....")
            }
  
            // console.log("Sent message")
  
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
  
    // console.log(mode,token,challenge);
    // console.log(VERIFY_TOKEN);
      
    // Check if a token and mode were sent
    if (mode && token) {
    
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Respond with 200 OK and challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      }
    }

    console.log("Forbidden")
    res.sendStatus(403);      

  }); 

  app.use('/api/categories', categoryRoutes);


const PORT = process.env.PORT || 5000;

// var server = https.createServer(options, app);
app.listen(PORT, () => console.log("Server ready on port ",PORT));
