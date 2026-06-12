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
        defaultBackupDir: string
        customBackupDir: string
        hasCustomBackupDir: boolean
        hasState: boolean
        hasBackupToday: boolean
        lastBackup: { name: string; path: string; mtimeMs: number } | null
      }>
      chooseBackupDir: () => Promise<string | null>
      setBackupDir: (dir: string) => Promise<string>
      resetBackupDir: () => Promise<string>
    }
  }
}

export {}
