const express = require('express');
const cors = require('cors');
require('dotenv').config();

const searchRoute = require('./routes/search');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/search', searchRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));