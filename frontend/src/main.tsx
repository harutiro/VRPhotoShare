import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MantineProvider, AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import './index.css'
import '@mantine/core/styles.css'
import { PhotoListPage } from './pages/PhotoListPage.tsx'
import { UploadPage } from './pages/UploadPage.tsx'
import { Header } from './components/Header.tsx'

function App() {
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
          <Routes>
            <Route path="/" element={<PhotoListPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider>
    <App />
  </MantineProvider>,
)
