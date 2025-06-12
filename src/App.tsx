import { useState, useEffect } from 'react'
import { getGameState, updateGameState } from './lib/gamemechanics/gameState'
import { TopBar } from './components/layout/TopBar' 
import { LoginView } from './components/views/LoginView'
import { CompanyView } from './components/views/CompanyView'
import { FinanceView } from './components/views/FinanceView'
import { PlaceholderView } from './components/views/PlaceholderView'
import { ProfileView } from './components/views/ProfileView'
import { SettingsView } from './components/views/SettingsView'
import { AdminDashboardView } from './components/views/AdminDashboardView'
import { FleetView } from './components/views/FleetView'
import { RouteView } from './components/views/RouteView'
import { GeographyView } from './components/views/GeographyView'
import { PassengerDemandView } from './components/views/PassengerDemandView'
import { uiEmojis } from './components/ui/resources/emojiMap'
import { useDisplayUpdate } from './lib/gamemechanics/displayManager'
import { Toaster } from './components/ui/ShadCN/Toaster'

export type View = 'Login' | 'Company' | 'Finance' | 'Tradepedia' | 'Profile' | 'Settings' | 'Admin' | 'Fleet' | 'Routes' | 'Geography' | 'Passengers'

function App() {
  const [view, setView] = useState<View>('Login')
  const [isInitializing, setIsInitializing] = useState(true)
  const [skipAutoLogin, setSkipAutoLogin] = useState(false)
  
  const gameState = getGameState()

  const handleLogout = () => {
    // Reset game state
    updateGameState({
      player: null,
      day: 1,
      week: 1,
      month: 1,
      year: 2024,
    })
    setSkipAutoLogin(true) // Prevent auto-login after logout
    setView('Login')
  }

  const handleManualLogin = () => {
    setSkipAutoLogin(false) // Re-enable auto-login for future visits
  }
  
  // Subscribe to display updates
  useDisplayUpdate()
  
  // Check if user is logged in
  const isLoggedIn = gameState.player !== null
  
  // Auto-redirect to login if not logged in (except for certain views)
  useEffect(() => {
    if (!isLoggedIn && view !== 'Login' && view !== 'Profile') {
      setView('Login')
    }
  }, [isLoggedIn, view])
  
  useEffect(() => {
    async function init() {
      try {
        // For now, we'll just initialize the game state
        // In the future, this could load from localStorage
        const gameState = getGameState()
        if (gameState.player) {
          setView('Company')
        }
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [])
  
  const renderView = () => {
    if (isInitializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="text-6xl mb-4">{uiEmojis.company}</div>
            <p className="text-lg">Loading Blueskye Airways...</p>
          </div>
        </div>
      )
    }
    
    if (view === 'Login') {
      return <LoginView setView={setView} skipAutoLogin={skipAutoLogin} onManualLogin={handleManualLogin} />
    }
    
    if (!gameState.player) {
      setView('Login')
      return null
    }
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar 
          currentView={view} 
          setView={setView}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 mx-auto w-full max-w-5xl">
          {view === 'Company' && <CompanyView />}
          {view === 'Finance' && <FinanceView />}
          {view === 'Tradepedia' && <PlaceholderView title="Aviation Encyclopedia" icon={uiEmojis.book} description="Learn about aircraft, routes, and aviation industry." />}
          {view === 'Profile' && <ProfileView setView={setView} />}
          {view === 'Settings' && <SettingsView setView={setView} />}
          {view === 'Admin' && <AdminDashboardView setView={setView} />}
          {view === 'Fleet' && <FleetView />}
          {view === 'Routes' && <RouteView />}
          {view === 'Geography' && <GeographyView />}
          {view === 'Passengers' && <PassengerDemandView />}
        </main>
      </div>
    )
  }

  return (
    <>
      {renderView()}
      <Toaster />
    </>
  )
}

export { App } 