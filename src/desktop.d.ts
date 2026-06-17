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
        schemaVersion: string
        normalizedAt: string
        normalizedCounts: {
          vegetables: number
          customers: number
          suppliers: number
          sales: number
          saleItems: number
          purchases: number
          purchaseItems: number
          payments: number
          expenses: number
          returns: number
          stockLogs: number
        }
      }>
      chooseBackupDir: () => Promise<string | null>
      setBackupDir: (dir: string) => Promise<string>
      resetBackupDir: () => Promise<string>
      printReceiptHtml: (html: string) => Promise<{ ok: boolean; error: string }>
    }
  }
}

export {}
