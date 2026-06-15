import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import EditPage from './pages/EditPage'
import ViewPage from './pages/ViewPage'
import AutoCreate from './pages/AutoCreate'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<AutoCreate />} />
        <Route path="/edit/:editId"  element={<EditPage />} />
        <Route path="/view/:viewId"  element={<ViewPage />} />
      </Routes>
    </BrowserRouter>
  )
}
