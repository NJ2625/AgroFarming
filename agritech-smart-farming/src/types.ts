export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  isLive?: boolean;
  forecast: {
    day: string;
    temp: number;
    condition: string;
  }[];
}

export interface CropRecommendation {
  name: string;
  description: string;
  image: string;
  yieldPotential: 'High' | 'Medium' | 'Low';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
