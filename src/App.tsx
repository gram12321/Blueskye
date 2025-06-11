import { useState, useEffect } from 'react'
import { getGameState, updateGameState } from './lib/gamemechanics/gameState'
import TopBar from './components/layout/TopBar'
import { LoginView } from './components/views/LoginView'
import { CompanyView } from './components/views/CompanyView'
import { PlaceholderView } from './components/views/PlaceholderView'
import { uiEmojis } from './components/ui/resources/emojiMap'

function App() {
  const [view, setView] = useState('Login')
  const [isInitializing, setIsInitializing] = useState(true)
  
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
  
  const gameState = getGameState()
  
  const handleLogout = () => {
    // Reset game state
    updateGameState({
      player: null,
      week: 1,
      season: 'Spring',
      year: 2024,
      politicalPower: 0,
      population: [],
      populationLimit: 100
    })
    setView('Login')
  }
  
  const renderView = () => {
    if (isInitializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="text-6xl mb-4">{uiEmojis.aircraft}</div>
            <p className="text-lg">Loading Blueskye Airways...</p>
          </div>
        </div>
      )
    }
    
    if (view === 'Login') {
      return <LoginView setView={setView} />
    }
    
    if (!gameState.player) {
      setView('Login')
      return null
    }
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar 
          view={view} 
          setView={setView} 
          onLogout={handleLogout}
        />
        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 mx-auto w-full max-w-5xl">
          {view === 'Company' && <CompanyView />}
          {view === 'Finance' && <PlaceholderView title="Financial Management" icon={uiEmojis.finance} description="Track income, expenses, and financial performance." />}
          {view === 'Tradepedia' && <PlaceholderView title="Aviation Encyclopedia" icon={uiEmojis.book} description="Learn about aircraft, routes, and aviation industry." />}
          {view === 'Profile' && <PlaceholderView title="Company Profile" icon={uiEmojis.person} description="View and edit your company profile and settings." />}
          {view === 'Settings' && <PlaceholderView title="Game Settings" icon={uiEmojis.settings} description="Configure game preferences and display options." />}
          {view === 'AdminDashboard' && <PlaceholderView title="Admin Dashboard" icon="🛡️" description="Administrative tools and game management." />}
          {view === 'Achievements' && <PlaceholderView title="Achievements" icon={uiEmojis.trophy} description="Track your progress and unlock achievements." />}
          {view === 'Highscore' && <PlaceholderView title="Leaderboards" icon={uiEmojis.trophy} description="Compare your performance with other airlines." />}
        </main>
      </div>
    )
  }

  return renderView()
}

export default App 