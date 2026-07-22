import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import './App.css'

export default function App() {
  return (
    <BrowserRouter basename="/webapp">
      <AppLayout />
    </BrowserRouter>
  )
}
