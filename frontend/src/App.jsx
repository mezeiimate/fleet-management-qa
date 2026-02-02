import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VehicleList from './pages/VehicleList'
import ServiceBoard from './pages/ServiceBoard'
import MyCar from './pages/MyCar'
import UserManagement from './pages/UserManagement'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    setCurrentPage('dashboard')
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'vehicles': return <VehicleList onBack={() => setCurrentPage('dashboard')} />
      case 'service': return <ServiceBoard onBack={() => setCurrentPage('dashboard')} />
      case 'my-car': return <MyCar onBack={() => setCurrentPage('dashboard')} userId={user.id} />
      case 'users': return <UserManagement onBack={() => setCurrentPage('dashboard')} />
      default: return (
        <Dashboard 
          userRole={user.role} 
          userName={user.name} 
          onLogout={handleLogout} 
          onNavigate={setCurrentPage} 
        />
      )
    }
  }

  return (
    <div>
      {!isLoggedIn ? <Login onLogin={handleLogin} /> : renderPage()}
    </div>
  )
}

export default App