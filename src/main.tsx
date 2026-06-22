import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { Layout } from './components/Layout'
import { TodayPage } from './pages/TodayPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { ProgramPage } from './pages/ProgramPage'
import { ProgressPage } from './pages/ProgressPage'
import { BodyPage } from './pages/BodyPage'
import { SettingsPage } from './pages/SettingsPage'

// HashRouter is used so that deep links (and page refreshes) work on static
// hosts like GitHub Pages without any server configuration.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/workout/:id" element={<WorkoutPage />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/body" element={<BodyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
