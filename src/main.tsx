import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

console.log('main.tsx executing...')

// Disable browser's automatic scroll restoration across history entries for SPA
try {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
} catch (_) {}

// Plain vanilla React rendering
try {
  const root = document.getElementById('root')
  console.log('Root element found:', root)
  
  if (root) {
    ReactDOM.createRoot(root).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    console.log('React rendered successfully')
  } else {
    console.error('Root element not found')
  }
} catch (err) {
  console.error('React render error:', err)
  document.body.innerHTML = `<div style="color:red">Error: ${err.message}</div>`
}
