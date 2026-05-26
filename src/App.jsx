import { useState } from 'react'
import LunaraeBOE from './pages/LunaraeBOE.jsx'
import ZimraBOEViewer from './pages/ZimraBOEViewer_old.jsx'

export default function App() {
  const [page, setPage] = useState('lunara')

  if (page === 'zimra') return <ZimraBOEViewer />

  return <LunaraeBOE onNavigate={setPage} />
}