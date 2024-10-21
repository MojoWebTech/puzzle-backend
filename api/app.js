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
const { processAndSaveCategories, updateImageGender } = require('./data/utils');


require('dotenv').config()

const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '../public')));
const corsOptions = {
  origin: [
    "http://localhost:3000", 
    "https://localhost:3000", 
    "https://apps-787876049864708.apps.fbsbx.com",
    "https://instamojopuzzle-d3bzgtaud7g2eufz.westindia-01.azurewebsites.net" 
  ],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(body_parser.json()); 

const URI = process.env.MONGODB_URI;
  mongoose.connect(URI || '', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async() => {
    console.log('Connected to MongoDB');
    // Seed db
    // processAndSaveCategories(); 
    // updateImageGender(); 
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

  app.get("/", (req, res) => res.send("Hello there!"));
  app.use('/webhook', webhookRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/swap', swapRoutes);
  app.use('/', formRoutes);



const PORT = process.env.PORT || 8080; // azure port

app.listen(PORT, () => console.log("Server ready on port ",PORT));
