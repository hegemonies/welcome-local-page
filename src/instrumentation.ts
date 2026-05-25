export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { initDatabase } = await import('./db/init')
  try {
    await initDatabase()
  } catch (err) {
    console.error('[wlp] database init failed:', err)
  }
}
