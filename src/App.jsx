import { useState } from 'react'
import { getLocalUser, logout } from './api'
import LoginPage   from './pages/LoginPage'
import SubmitPage  from './pages/SubmitPage'
import PresentPage from './pages/PresentPage'
import StaffPage   from './pages/StaffPage'

export default function App() {
  const [user, setUser] = useState(() => getLocalUser())
  const [view, setView] = useState('submit')

  function handleLogin(u) { setUser(u) }

  async function handleLogout() {
    await logout()
    setUser(null)
    setView('submit')
  }

  if (!user) return <LoginPage onLogin={handleLogin} />

  if (view === 'present') return <PresentPage onSwitch={() => setView('submit')} onLogout={handleLogout} />
  if (view === 'staff')   return <StaffPage   onSwitch={dest => setView(dest === 'nghiem-thu' ? 'present' : 'submit')} onLogout={handleLogout} user={user} />
  return <SubmitPage onSwitch={dest => setView(dest === 'present' || dest === 'nghiem-thu' ? 'present' : dest === 'staff' ? 'staff' : 'submit')} onLogout={handleLogout} />
}