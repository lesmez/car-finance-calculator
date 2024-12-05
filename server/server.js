const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const KBB_API_KEY = process.env.KBB_API_KEY;
const KBB_API_URL = 'https://api.kbb.com/v1';

app.post('/api/vehicle-value', async (req, res) => {
  try {
    const { year, make, model, mileage = 0, condition = 'excellent' } = req.body;

    const response = await axios.get(`${KBB_API_URL}/vehicle/values`, {
      headers: {
        'Authorization': `Bearer ${KBB_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        year,
        make,
        model,
        mileage,
        condition
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching KBB data:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle value' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
