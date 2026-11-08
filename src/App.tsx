import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import ResourceLibrary from '@/pages/ResourceLibrary'
import MaterialDetail from '@/pages/MaterialDetail'
import CardDetail from '@/pages/CardDetail'
import LessonLibrary from '@/pages/LessonLibrary'
import LessonDetail from '@/pages/LessonDetail'
import Apply from '@/pages/Apply'
import CurriculumMap from '@/pages/CurriculumMap'
import AgentStudio from '@/pages/AgentStudio'
import Workspace from '@/pages/Workspace'
import SettingsPage from '@/pages/SettingsPage'
import NotFound from '@/pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** 旧链 /folk?region=闽东 → /resources?region=闽东，查询参数原样带过去 */
function LegacyLibraryRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/resources', search }} replace />
}

/** 旧链 /folk/:id → /resources/material/:id（民俗条目已并入教学素材） */
function LegacyFolkRedirect() {
  const { id } = useParams()
  return <Navigate to={`/resources/material/${id ?? ''}`} replace />
}

/** 旧链 /resources/folk/:id → /resources/material/:id */
function LegacyMaterialRedirect() {
  const { id } = useParams()
  return <Navigate to={`/resources/material/${id ?? ''}`} replace />
}

export default function App() {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/curriculum" element={<CurriculumMap />} />
        <Route path="/resources" element={<ResourceLibrary />} />
        <Route path="/resources/material/:id" element={<MaterialDetail />} />
        <Route path="/resources/folk/:id" element={<LegacyMaterialRedirect />} />
        <Route path="/resources/card/:id" element={<CardDetail />} />

        <Route path="/lessons" element={<LessonLibrary />} />
        <Route path="/lessons/:id" element={<LessonDetail />} />

        <Route path="/apply" element={<Apply />} />
        <Route path="/agent" element={<AgentStudio />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* ── 旧链兼容 ── */}
        {/* 学科总览已改为「教学应用」：学科从主轴降为落点 */}
        <Route path="/subjects" element={<Navigate to="/apply" replace />} />
        {/* 教学素材库已并入资源库，成为其中一类资源 */}
        <Route path="/materials" element={<Navigate to="/resources?kind=material" replace />} />
        <Route path="/folk" element={<LegacyLibraryRedirect />} />
        <Route path="/folk/:id" element={<LegacyFolkRedirect />} />
        <Route path="/community" element={<Navigate to="/" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}
