import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProviderDetails from './pages/ProviderDetails';
import About from './pages/About';
import Privacy from './pages/Privacy';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load user preferences from localStorage
        const savedUser = localStorage.getItem('healthcare_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Load search history
        const savedHistory = localStorage.getItem('search_history');
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory));
        }

        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const updateSearchHistory = (searchData) => {
    const newHistory = [searchData, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('healthcare_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('healthcare_user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Header user={user} onUserUpdate={updateUser} />
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home 
                    user={user} 
                    searchHistory={searchHistory}
                    onSearch={updateSearchHistory}
                  />
                } 
              />
              <Route 
                path="/search" 
                element={
                  <SearchResults 
                    user={user}
                    onSearch={updateSearchHistory}
                  />
                } 
              />
              <Route 
                path="/provider/:npi" 
                element={<ProviderDetails user={user} />} 
              />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </main>

          <Footer />
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;