import { AppState } from './lib/types'

declare global {
  interface Window {
    desktopApp?: {
      platform: string
      isDesktop: boolean
      getAppState: () => Promise<AppState | null>
      setAppState: (state: AppState) => Promise<{ ok: boolean; updatedAt: string }>
      backupDatabase: () => Promise<string>
      getDatabaseInfo: () => Promise<{ dbPath: string; dataDir: string; backupDir: string; hasState: boolean }>
    }
  }
}

export {}
