import { AppState } from './lib/types'

declare global {
  interface Window {
    desktopApp?: {
      platform: string
      isDesktop: boolean
      getAppState: () => Promise<AppState | null>
      setAppState: (state: AppState) => Promise<{ ok: boolean; updatedAt: string }>
      backupDatabase: () => Promise<string>
      ensureDailyBackup: () => Promise<{ created: boolean; reason: string; path: string | null; lastBackup: { name: string; path: string; mtimeMs: number } | null }>
      getDatabaseInfo: () => Promise<{
        dbPath: string
        dataDir: string
        backupDir: string
        hasState: boolean
        hasBackupToday: boolean
        lastBackup: { name: string; path: string; mtimeMs: number } | null
      }>
    }
  }
}

export {}
