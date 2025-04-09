import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Graph from './components/Graph';
import ProductDetail from './components/ProductDetail';
import './index.css';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="container-fluid">
          <div className="row">
            {/* Sidebar */}
            <div className="col-md-3 col-lg-2 bg-dark text-white min-vh-100">
              <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="col-md-9 col-lg-10 p-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/graph" element={<Graph />} />
                <Route path="/:id" element={<ProductDetail />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;