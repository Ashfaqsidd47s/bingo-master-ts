/* eslint-disable react-hooks/exhaustive-deps */
import { Navigate, Route, Routes } from 'react-router'
import './App.css'
import Home from './pages/Home'
import Game from './pages/Game'
import AiBattle from './pages/AiBattle'
import Modal from './components/modals/Modal'
import Searching from './pages/Searching'
import { useEffect } from 'react'
import useUserStore from './store/userstore'
import useGameStore from './store/gameStore'
import { useGameSocketStore } from './store/gameSocketStore'

function App() {

  const {user, verifyUser} = useUserStore();
  const { connect, addListener, removeListener } = useGameSocketStore();
  const {game} = useGameStore()

  useEffect(() => {
    verifyUser();
    connect();

    const handleMessageInSearching = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log(message)
    }

    addListener(handleMessageInSearching)
  
    return () => {
      removeListener(handleMessageInSearching)
    }
  }, [])

  
  

  return (
    <div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/aibattle' element={<AiBattle />} />
        <Route path='/search' element={user ? <Searching />:  <Navigate to="/" replace />} />
        <Route path='/game' element={game ? <Game /> : user ? <Navigate to="/search" replace /> : <Navigate to="/" replace />} />
      </Routes>
      <Modal />
    </div>
  )
}

export default App
