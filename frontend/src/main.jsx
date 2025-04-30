import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import UIProvider from './context/UIContext'
import DeviceProvider from './context/DeviceContext'
import ImageProvider from './context/ImageContext'
import EvidenceProvider from './context/EvidenceContext'

if (window.location.pathname === '/') {
  window.location.pathname = '/login'
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <DeviceProvider>
        <UIProvider>
          <ImageProvider>
            <EvidenceProvider>
              <App />
            </EvidenceProvider>
          </ImageProvider>
        </UIProvider>
      </DeviceProvider>
    </AuthProvider>
  </BrowserRouter>
)