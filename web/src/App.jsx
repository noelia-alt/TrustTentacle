import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import DecisionHelper from './pages/DecisionHelper'
import PhishingSimulator from './pages/PhishingSimulator'
import ThreatMap from './pages/ThreatMap'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      <main style={{ flexGrow: 1 }}>
        {currentPage === 'home' && <Home />}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'helper' && <DecisionHelper />}
        {currentPage === 'simulator' && <PhishingSimulator />}
        {currentPage === 'map' && <ThreatMap />}
      </main>
      {currentPage !== 'simulator' && <Footer />}
    </div>
  )
}

export default App
