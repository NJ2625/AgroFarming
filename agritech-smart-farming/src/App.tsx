/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Sun, 
  Cloud, 
  CloudRain, 
  ChevronDown, 
  Battery, 
  Wifi, 
  Signal, 
  Search, 
  Send, 
  Home, 
  MessageSquare, 
  Store, 
  User, 
  Bot,
  AlertTriangle, 
  FileText, 
  IndianRupee, 
  Lightbulb, 
  Leaf, 
  Bug, 
  Droplets 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { WeatherData, CropRecommendation, ChatMessage } from './types';
import { getFarmingAdvice, getCropRecommendations } from './lib/gemini';

export default function App() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [crops, setCrops] = useState<CropRecommendation[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [soilType, setSoilType] = useState('Sandy Loam');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'advice' | 'market' | 'profile'>('home');
  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          fetchWeather(latitude, longitude);
          setIsLocationModalOpen(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Could not detect location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (weather) {
      fetchCrops();
    }
  }, [weather, soilType]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchWeather = async (lat?: number, lon?: number, city?: string) => {
    try {
      const params: any = {};
      if (lat && lon) {
        params.lat = lat;
        params.lon = lon;
      } else {
        params.city = city || 'Barmer';
      }
      const response = await axios.get('/api/weather', { params });
      setWeather(response.data);
    } catch (error) {
      console.error("Weather fetch error:", error);
    }
  };

  const handleManualCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCity.trim()) {
      fetchWeather(undefined, undefined, manualCity);
      setIsLocationModalOpen(false);
      setManualCity('');
    }
  };

  const fetchCrops = async () => {
    if (!weather) return;
    const recommendedCrops = await getCropRecommendations(
      weather.city,
      weather.condition,
      soilType
    );
    setCrops(recommendedCrops);
  };

  const handleSendMessage = async (text?: string) => {
    const message = text || chatInput;
    if (!message.trim()) return;

    setActiveTab('advice');
    const newUserMessage: ChatMessage = { role: 'user', text: message };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);

    const advice = await getFarmingAdvice(message, chatHistory);
    const newModelMessage: ChatMessage = { role: 'model', text: advice || "I'm sorry, I couldn't process that." };
    setChatHistory(prev => [...prev, newModelMessage]);
    setIsChatLoading(false);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="text-yellow-400" />;
      case 'cloudy':
      case 'clouds':
        return <Cloud className="text-blue-400" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="text-blue-600" />;
      default:
        return <Sun className="text-yellow-400" />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-agri-bg min-h-screen pb-20 font-sans">
      {/* Status Bar Mock */}
      <div className="flex justify-center items-center px-4 py-1 text-xs text-white agri-header-gradient">
        <div className="font-medium">15:42</div>
      </div>

      {/* Header */}
      <header className="agri-header-gradient px-4 py-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-full">
            <Leaf className="text-agri-primary" size={18} />
          </div>
          <h1 className="text-lg font-bold">AgriTech <span className="font-normal">Smart Farming</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded-lg text-xs">
          <MapPin size={14} />
          <span>GPS</span>
        </div>
      </header>

      {/* Location & Weather Bar */}
      <div 
        onClick={() => setIsLocationModalOpen(true)}
        className="bg-white px-4 py-2 flex justify-between items-center shadow-sm border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-agri-dark font-medium">
          <MapPin size={16} className="text-orange-500" />
          <div className="flex flex-col">
            <span className="leading-tight">{weather?.city || 'Barmer'}, Rajasthan</span>
            <span className={`text-[8px] font-bold uppercase tracking-widest ${weather?.isLive ? 'text-green-500' : 'text-orange-400'}`}>
              {weather?.isLive ? '● Live Data' : '● Demo Mode'}
            </span>
          </div>
          <ChevronDown size={16} />
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          {getWeatherIcon(weather?.condition || 'Sunny')}
          <span className="font-bold text-lg">{weather?.temp || 32}°</span>
          <span className="text-sm">{weather?.condition || 'Sunny'}</span>
          <ChevronDown size={14} />
        </div>
      </div>

      <main className="p-4 space-y-4">
        {activeTab === 'home' && (
          <>
            {/* Farm Location & Weather Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Farm Location Card */}
              <div className="agri-card">
                <div className="p-3 border-b border-gray-100 bg-orange-50/30">
                  <h2 className="text-sm font-bold text-gray-700">Your Farm Location</h2>
                </div>
                <div className="relative h-40 bg-gray-200">
                  {/* Mock Map */}
                  <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/400/200')] bg-cover opacity-60"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <MapPin size={32} className="text-red-500 fill-red-500/20" />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow-sm text-[10px] font-bold whitespace-nowrap">
                        {weather?.city || 'Barmer'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Soil: <span className="font-bold text-gray-700">{soilType}</span></p>
                    <p className="text-[10px] text-agri-primary font-medium">Region Data Analyzed</p>
                  </div>
                  <div className="bg-agri-light p-1.5 rounded-lg">
                    <Leaf size={16} className="text-agri-primary" />
                  </div>
                </div>
              </div>

              {/* Weather Forecast Card */}
              <div className="agri-card">
                <div className="p-3 border-b border-gray-100 bg-blue-50/30">
                  <h2 className="text-sm font-bold text-gray-700">Weather Forecast</h2>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Today: <span className="text-xl font-bold text-gray-800">{weather?.temp || 32}°C</span></p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {getWeatherIcon(weather?.condition || 'Sunny')}
                        {weather?.condition || 'Sunny'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Humidity: {weather?.humidity || 35}%</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {weather?.forecast.map((f, i) => (
                      <div key={i} className="text-center p-2 bg-gray-50 rounded-xl">
                        <p className="text-[10px] text-gray-500 mb-1">{f.day}</p>
                        <div className="flex justify-center mb-1">
                          {getWeatherIcon(f.condition)}
                        </div>
                        <p className="text-xs font-bold">{f.temp}°</p>
                        <p className="text-[8px] text-gray-400 capitalize">{f.condition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Crop Recommendations */}
            <section>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-[1px] flex-1 bg-gray-200"></div>
                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Crop Recommendations</h2>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>
              
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                {crops.length > 0 ? crops.map((crop, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="agri-card min-w-[140px] flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <div className="p-2">
                      <h3 className="text-xs font-bold text-gray-800 mb-1">{crop.name}</h3>
                      <div className="h-20 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/${crop.name}/200/150`} 
                          alt={crop.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="bg-orange-50 text-[8px] text-orange-700 font-bold py-1 px-2 rounded-full text-center">
                        Best for Your Farm
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="w-full text-center py-4 text-gray-400 text-xs">Loading recommendations...</div>
                )}
              </div>
              
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">Yield Potential: <span className="text-agri-dark font-bold">High</span></p>
              </div>
            </section>

            {/* AI Chatbot & Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chatbot Card */}
              <div className="agri-card">
                <div className="p-3 border-b border-gray-100 bg-green-50/30">
                  <h2 className="text-sm font-bold text-gray-700">Ask the Chatbot</h2>
                </div>
                <div className="p-3">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <Bot size={20} />
                      </div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-xs text-gray-700 relative">
                      How can I help you?
                      <div className="absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-t-gray-100 border-l-[8px] border-l-transparent"></div>
                    </div>
                  </div>

                  <div className="relative mb-3">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about farming..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-agri-primary"
                    />
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={isChatLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-agri-primary"
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSendMessage("Best Crop")}
                      className="flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-orange-200"
                    >
                      <Leaf size={12} />
                      Best Crop
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Pest Control")}
                      className="flex items-center gap-1 bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                    >
                      <Bug size={12} />
                      Pest Control
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Fertilizers")}
                      className="flex items-center gap-1 bg-agri-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                    >
                      <Droplets size={12} />
                      Fertilizers
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Access Grid */}
              <div className="agri-card">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-gray-700">Quick Access</h2>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsAlertsModalOpen(true)}
                    className="btn-quick-access bg-[#E65100] hover:opacity-90 transition-opacity"
                  >
                    <AlertTriangle size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">Weather Alerts</span>
                  </button>
                  <button 
                    onClick={() => setIsSoilModalOpen(true)}
                    className="btn-quick-access bg-[#5D4037] hover:opacity-90 transition-opacity"
                  >
                    <FileText size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">Soil Report</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('market')}
                    className="btn-quick-access bg-[#2E7D32] hover:opacity-90 transition-opacity"
                  >
                    <IndianRupee size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">Market Rates</span>
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Give me some daily farming tips")}
                    className="btn-quick-access bg-[#F57C00] hover:opacity-90 transition-opacity"
                  >
                    <Lightbulb size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">Farming Tips</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'advice' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-green-50/30">
              <Bot size={20} className="text-agri-primary" />
              <h2 className="text-sm font-bold text-gray-700">Expert Farming Advice</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="bg-agri-light p-4 rounded-full mb-4">
                    <Bot size={40} className="text-agri-primary" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">How can I help you today?</h3>
                  <p className="text-xs text-gray-500 mb-6">Ask me about crops, pests, soil, or weather conditions.</p>
                  <div className="grid grid-cols-1 gap-2 w-full">
                    <button onClick={() => handleSendMessage("What are the best crops for sandy soil?")} className="text-xs text-left p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                      "What are the best crops for sandy soil?"
                    </button>
                    <button onClick={() => handleSendMessage("How to control locusts in my farm?")} className="text-xs text-left p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                      "How to control locusts in my farm?"
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-agri-primary text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-500 italic">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-sm focus:outline-none"
              />
              <button 
                onClick={() => handleSendMessage()}
                className="bg-agri-primary text-white p-2 rounded-xl"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-4">
            <div className="agri-card p-4 bg-green-600 text-white">
              <h2 className="font-bold mb-1">Today's Market Trends</h2>
              <p className="text-xs opacity-90">Prices in Barmer Mandi are up by 5% today.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: 'Wheat', price: '₹2,450', unit: 'per Quintal', trend: 'up' },
                { name: 'Millet (Bajra)', price: '₹1,900', unit: 'per Quintal', trend: 'down' },
                { name: 'Mustard', price: '₹5,600', unit: 'per Quintal', trend: 'up' },
                { name: 'Cumin', price: '₹28,000', unit: 'per Quintal', trend: 'up' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setIsComingSoonModalOpen(true)}
                  className="agri-card p-4 flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-agri-light p-2 rounded-lg">
                      <Leaf size={20} className="text-agri-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-[10px] text-gray-500">{item.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{item.price}</p>
                    <p className={`text-[10px] font-bold ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {item.trend === 'up' ? '↑ 2.4%' : '↓ 1.1%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-6">
              <div className="w-24 h-24 bg-agri-light rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-sm">
                <User size={48} className="text-agri-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Nitin Jangir</h2>
              <p className="text-sm text-gray-500">Barmer, Rajasthan</p>
            </div>
            
            <div className="agri-card divide-y divide-gray-100">
              <button 
                onClick={() => setIsComingSoonModalOpen(true)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">My Farm Details</span>
                </div>
                <ChevronDown className="-rotate-90 text-gray-300" size={18} />
              </button>
              <button 
                onClick={() => setIsComingSoonModalOpen(true)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IndianRupee size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Transaction History</span>
                </div>
                <ChevronDown className="-rotate-90 text-gray-300" size={18} />
              </button>
              <button 
                onClick={() => setIsComingSoonModalOpen(true)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bot size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">AI Assistant Settings</span>
                </div>
                <ChevronDown className="-rotate-90 text-gray-300" size={18} />
              </button>
            </div>
            
            <button 
              onClick={() => setIsComingSoonModalOpen(true)}
              className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl border border-red-100"
            >
              Logout
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-agri-primary' : 'text-gray-400'}`}
        >
          <Home size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('advice')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'advice' ? 'text-agri-primary' : 'text-gray-400'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold">Advice</span>
        </button>
        <button 
          onClick={() => setActiveTab('market')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'market' ? 'text-agri-primary' : 'text-gray-400'}`}
        >
          <Store size={20} />
          <span className="text-[10px] font-bold">Market</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-agri-primary' : 'text-gray-400'}`}
        >
          <User size={20} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

      {/* Location Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 max-w-md mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Change Location</h2>
                <button onClick={() => setIsLocationModalOpen(false)} className="text-gray-400">
                  <ChevronDown size={24} />
                </button>
              </div>

              <button 
                onClick={detectLocation}
                className="w-full flex items-center justify-center gap-2 bg-agri-primary text-white py-3 rounded-xl font-bold shadow-sm hover:bg-agri-dark transition-colors"
              >
                <MapPin size={20} />
                Detect My Location
              </button>

              <div className="relative flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">OR ENTER MANUALLY</span>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>

              <form onSubmit={handleManualCitySubmit} className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    placeholder="Enter city name (e.g. Jaipur)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-agri-primary"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Set Location
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soil Report Modal */}
      <AnimatePresence>
        {isSoilModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 max-w-md mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Soil Report</h2>
                <button onClick={() => setIsSoilModalOpen(false)} className="text-gray-400">
                  <ChevronDown size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-agri-light p-4 rounded-2xl">
                  <p className="text-xs text-gray-500 mb-1">Current Soil Type</p>
                  <p className="text-lg font-bold text-agri-dark">{soilType}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Nitrogen</p>
                    <p className="text-sm font-bold text-gray-700">Medium</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Phosphorus</p>
                    <p className="text-sm font-bold text-gray-700">High</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Potassium</p>
                    <p className="text-sm font-bold text-gray-700">Low</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">pH Level</p>
                    <p className="text-sm font-bold text-gray-700">7.2 (Neutral)</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-600 mb-2">Change Soil Type</p>
                  <div className="flex flex-wrap gap-2">
                    {['Sandy Loam', 'Clay', 'Silt', 'Peat', 'Chalky'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => {
                          setSoilType(type);
                          setIsSoilModalOpen(false);
                        }}
                        className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                          soilType === type 
                            ? 'bg-agri-primary text-white border-agri-primary' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-agri-primary'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather Alerts Modal */}
      <AnimatePresence>
        {isAlertsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 max-w-md mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Weather Alerts</h2>
                <button onClick={() => setIsAlertsModalOpen(false)} className="text-gray-400">
                  <ChevronDown size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3">
                  <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
                  <div>
                    <p className="text-sm font-bold text-orange-800">Heat Wave Warning</p>
                    <p className="text-xs text-orange-700 mt-1">Temperatures expected to rise above 42°C in the next 48 hours. Ensure proper irrigation.</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                  <CloudRain className="text-blue-500 flex-shrink-0" size={24} />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Light Rain Expected</p>
                    <p className="text-xs text-blue-700 mt-1">Scattered rainfall predicted for Thursday evening. Good for recently sown crops.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsAlertsModalOpen(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Detail Modal */}
      <AnimatePresence>
        {selectedCrop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 max-w-md mx-auto"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="relative h-48">
                <img 
                  src={`https://picsum.photos/seed/${selectedCrop.name}/400/300`} 
                  alt={selectedCrop.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedCrop(null)}
                  className="absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white p-2 rounded-full"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedCrop.name}</h2>
                    <p className="text-sm text-agri-primary font-medium">Recommended for {weather?.city}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                    High Yield
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
                    <p className="text-sm font-bold text-gray-700">90-120 Days</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Water Need</p>
                    <p className="text-sm font-bold text-gray-700">Moderate</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800">Why this crop?</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Based on the current {weather?.condition.toLowerCase()} weather and {soilType.toLowerCase()} soil in {weather?.city}, {selectedCrop.name} is highly likely to thrive. It requires minimal additional irrigation if the predicted rain arrives.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    handleSendMessage(`Tell me more about growing ${selectedCrop.name}`);
                    setSelectedCrop(null);
                    setActiveTab('advice');
                  }}
                  className="w-full bg-agri-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-agri-primary/20 active:scale-95 transition-transform"
                >
                  Get Growing Guide
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {isComingSoonModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 max-w-md mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full p-8 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Bot size={32} className="text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Coming Soon!</h2>
              <p className="text-sm text-gray-500">We're working hard to bring this feature to you. Stay tuned for updates!</p>
              <button 
                onClick={() => setIsComingSoonModalOpen(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {chatHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto"
          >
            <header className="agri-header-gradient p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={() => setChatHistory([])} className="p-1">
                  <ChevronDown className="rotate-90" />
                </button>
                <Bot size={20} />
                <h2 className="font-bold">AgriTech AI Assistant</h2>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-agri-primary text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-500 italic">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-sm focus:outline-none"
              />
              <button 
                onClick={() => handleSendMessage()}
                className="bg-agri-primary text-white p-2 rounded-xl"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
