import fs from 'node:fs'
import path from 'node:path'

export default async function globalSetup() {
  const root = __dirname
  for (const dir of ['artifacts', 'artifacts/json', 'screenshots', 'traces', 'reports']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true })
  }
  if (process.env.KEEP_RESULTS === '1') return
  fs.writeFileSync(path.join(root, 'artifacts', 'results.ndjson'), '')
}
