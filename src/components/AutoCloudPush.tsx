import { useEffect, useRef } from 'react'
import { AppState } from '../lib/types'
import { pushStateToCloud, refreshCloudSession } from '../lib/cloudSync'

export default function AutoCloudPush({ s, patch }: { s: AppState, patch: any }) {
  const runningRef = useRef(false)
  useEffect(() => {
    const run = async () => {
      const cfg = s.settings
      if (!cfg.autoCloudPushEnabled || !cfg.cloudSyncEnabled || !cfg.cloudShopId || !cfg.cloudAccessToken || !navigator.onLine) return
      const minutes = Math.max(1, Number(cfg.autoCloudPushMinutes || 10))
      const last = cfg.lastAutoCloudPushAt ? new Date(cfg.lastAutoCloudPushAt).getTime() : 0
      if (Date.now() - last < minutes * 60 * 1000) return
      if (runningRef.current) return
      runningRef.current = true
      try {
        const freshCfg = await refreshCloudSession(cfg)
        const message = await pushStateToCloud(s, freshCfg)
        const at = new Date().toISOString()
        patch((old: AppState) => ({ ...old, settings: { ...old.settings, ...freshCfg, lastAutoCloudPushAt: at, lastCloudPushAt: at, lastCloudSyncStatus: 'auto_push_success', lastCloudSyncMessage: message } }))
      } catch (error) {
        const message = `Auto push failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        patch((old: AppState) => ({ ...old, settings: { ...old.settings, lastCloudSyncStatus: 'auto_push_failed', lastCloudSyncMessage: message } }))
      } finally {
        runningRef.current = false
      }
    }
    const timer = window.setInterval(run, 60 * 1000)
    run()
    return () => window.clearInterval(timer)
  }, [s, patch])
  return null
}
