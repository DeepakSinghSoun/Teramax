
import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

import Portal from './components/Portal.jsx'
import Admin from './components/Admin.jsx'

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  // Open Portal first when the website is visited
  if (path === '/' || path === '/portal') {
    return <Portal />
  }

  // Admin dashboard
  if (path === '/admin') {
    return <Admin />
  }

  // Unknown page
  return (
    <main className="not-found">
      <h1>404 - Page Not Found</h1>
      <a href="/portal">Go to Portal</a>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
