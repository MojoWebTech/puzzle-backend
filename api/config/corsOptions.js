const { INSTANT_GAME_URL, AZURE_BACKEND_URL } = require("./utils");

const corsOptions = {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      INSTANT_GAME_URL,
      AZURE_BACKEND_URL
    ],
  };
  
  module.exports = corsOptions;
  