import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MantineProvider, AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Notifications } from '@mantine/notifications'
import './index.css'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { Header } from './components/Header.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { CreateAlbumPage } from './pages/CreateAlbumPage.tsx'
import { AlbumViewPage } from './pages/AlbumViewPage.tsx'
import { UploadPage } from './pages/UploadPage.tsx'

export function App() {
  const [opened, { toggle }] = useDisclosure()

  return (
    <BrowserRouter>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Header opened={opened} toggle={toggle} />
        </AppShell.Header>

        <AppShell.Main>
          <Notifications />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-album" element={<CreateAlbumPage />} />
            <Route path="/album/:custom_id" element={<AlbumViewPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/album/:custom_id/upload" element={<UploadPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider>
    <App />
  </MantineProvider>
)
