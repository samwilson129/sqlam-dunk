import fs from 'node:fs/promises'
import { case001Challenges } from '../lib/case-001-data.ts'
await fs.mkdir(new URL('../audit/', import.meta.url), { recursive: true })
await fs.writeFile(new URL('../audit/challenge-solutions.json', import.meta.url), JSON.stringify(case001Challenges.map(({ id, title, prompt, hint, structureHint, expectedOutput, solution, allowedThroughGame }) => ({ id, title, prompt, hint, structureHint, expectedOutput, solution, allowedThroughGame })), null, 2))
console.log(`Exported ${case001Challenges.length} challenge solutions`)
