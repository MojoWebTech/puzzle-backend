const cors = require('cors');
const request = require('request');
const express = require('express');
const  body_parser = require('body-parser');
const { Blob } = require('buffer'); 
const axios = require('axios');
const categoryRoutes = require('./routes/categoryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const formRoutes = require('./routes/form');
const swapRoutes = require('./routes/swapRoutes');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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


  mongoose.connect(process.env.MONGODB_URI)
  .then(async() => {
    console.log('Connected to MongoDB');
    // Seed db
    // processAndSaveCategories();  
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

  app.get("/", (req, res) => res.send("Hello there!"));
  app.use('/webhook', webhookRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/swap', swapRoutes);
  app.use('/', formRoutes);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server ready on port ",PORT));
