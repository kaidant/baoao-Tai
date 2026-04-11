import { useState } from 'react'
import SubmitPage from './pages/SubmitPage'
import PresentPage from './pages/PresentPage'

export default function App() {
  const [view, setView] = useState('submit') // 'submit' | 'present'
  return view === 'present'
    ? <PresentPage onSwitch={() => setView('submit')} />
    : <SubmitPage  onSwitch={() => setView('present')} />
}
