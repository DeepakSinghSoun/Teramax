import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import Portal from './components/Portal.jsx'
import Admin from './components/Admin.jsx'

// Tiny path-based router: /portal = what hotspot clients see, /admin = master dashboard.
const isAdmin = window.location.pathname.startsWith('/admin')
createRoot(document.getElementById('root')).render(isAdmin ? <Admin /> : <Portal />)
