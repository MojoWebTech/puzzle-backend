const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('node:path');

const connectDB = require('./config/db');
const corsOptions = require('./config/corsOptions');

const categoryRoutes = require('./routes/categoryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const formRoutes = require('./routes/formRoutes');
const swapRoutes = require('./routes/swapRoutes');

const app = express();

connectDB();

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.send('Hello there!'));
app.use('/webhook', webhookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/swap', swapRoutes);
app.use('/', formRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server ready on port ${PORT}`));
