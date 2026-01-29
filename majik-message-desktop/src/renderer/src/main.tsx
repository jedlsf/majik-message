import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ReduxProvider from './redux/ReduxProvider'
import ThemeProviderWrapper from './globals/ThemeProviderWrapper'
import { HashRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/functional/ErrorBoundary'
import ConnectionDetector from './components/functional/ConnectionDetector'
import { ShepherdProvider } from './lib/shepherd-js/ShepherdTourContext'
import { MajikMessageWrapper } from './components/majik-context-wrapper/MajikMessageWrapper'
import { Toaster } from 'sonner'
import { MajikahProvider } from './components/majikah-session-wrapper/MajikahSessionWrapper'

import './App.css'
import CrispIdentify from './lib/crisp/CrispIdentify'
import { NotificationsProvider } from './components/majikah-notification-wrapper/MajikahNotificationsProvider'
import LogRocketInit from './lib/log-rocket/LogRocketInit'

// const Router = import.meta.env.VITE_ELECTRON ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider>
      <ThemeProviderWrapper>
        <HashRouter>
          <ErrorBoundary>
            <ConnectionDetector>
              <ShepherdProvider>
                <MajikahProvider>
                  <MajikMessageWrapper>
                    <NotificationsProvider>
                      <LogRocketInit />
                      <App />
                      <Toaster
                        expand={true}
                        position="top-center"
                        toastOptions={{
                          classNames: {
                            toast: 'toast-main',
                            title: 'toast-title',
                            description: 'toast-description',
                            actionButton: 'toast-action-button',
                            cancelButton: 'toast-cancel-button',
                            closeButton: 'toast-close-button'
                          }
                        }}
                      />
                      <CrispIdentify />
                    </NotificationsProvider>
                  </MajikMessageWrapper>
                </MajikahProvider>
              </ShepherdProvider>
            </ConnectionDetector>
          </ErrorBoundary>
        </HashRouter>
      </ThemeProviderWrapper>
    </ReduxProvider>
  </StrictMode>
)
