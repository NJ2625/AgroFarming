import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/weather', async (req, res) => {
    const { lat, lon, city } = req.query;
    const apiKey = process.env.weather;

    const getMockData = (cityName?: string) => ({
      city: cityName || 'Barmer',
      temp: 32,
      condition: 'Sunny',
      humidity: 35,
      isLive: false,
      forecast: [
        { day: 'Tomorrow', temp: 30, condition: 'Rain' },
        { day: 'Cloudy', temp: 30, condition: 'Cloudy' },
        { day: 'Clear', temp: 31, condition: 'Clear' },
      ]
    });

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('MY_')) {
      return res.json(getMockData(city as string));
    }

    try {
      let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric`;
      if (lat && lon) {
        weatherUrl += `&lat=${lat}&lon=${lon}`;
      } else {
        weatherUrl += `&q=${city || 'Barmer'}`;
      }

      const response = await axios.get(weatherUrl);
      const data = response.data;

      res.json({
        city: data.name,
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        isLive: true,
        forecast: [
          { day: 'Tomorrow', temp: Math.round(data.main.temp - 2), condition: 'Rain' },
          { day: 'Cloudy', temp: Math.round(data.main.temp - 2), condition: 'Cloudy' },
          { day: 'Clear', temp: Math.round(data.main.temp - 1), condition: 'Clear' },
        ]
      });
    } catch (error: any) {
      // If API key is invalid (401) or other API errors, fallback to mock data
      // so the user can still see the UI working.
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.warn(`Weather API: ${error.response?.status === 401 ? 'Invalid API Key' : 'City not found'}. Falling back to mock data.`);
        return res.json(getMockData(city as string));
      }
      
      console.error('Weather API error:', error.message);
      res.status(500).json({ error: 'Failed to fetch weather' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
