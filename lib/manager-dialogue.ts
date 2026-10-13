import type { CaseChallenge } from './case-001-data'

export type ManagerDialogue = { message: string; deliverable: string; concepts: string }

const manager = 'Jordan Ellis — Senior Analytics Manager'

const messages: Record<number, ManagerDialogue> = {
  1: { message: "Let's establish the chronology before we interpret the comeback. Pull the Finals games in order so our shared record starts with the facts.", deliverable: 'A verified seven-game chronology.', concepts: 'SELECT · WHERE · ORDER BY' },
  2: { message: "Now reconcile the scoreline. Aggregate both teams at game level and show me where the margins began to tighten.", deliverable: 'A game-level scoring and margin table.', concepts: 'CTE · GROUP BY · CASE' },
  3: { message: 'The team baseline is clear. Identify the players carrying the scoring load across the series, and keep the ranking reproducible.', deliverable: 'A series scoring leaderboard.', concepts: 'SUM · JOIN · ORDER BY' },
  4: { message: 'Stay with the deciding night. I want the complete Game 7 box score so we can compare the performances without leaning on the headline.', deliverable: 'A verified Game 7 performance table.', concepts: 'WHERE · JOIN · ORDER BY' },
  5: { message: 'You have the pieces. Reconstruct the running series record and show exactly how the deficit became a championship.', deliverable: 'A chronological cumulative-wins report.', concepts: 'CTE · WINDOW SUM · ORDER BY' },
  6: { message: 'Move from individual records to the team baseline. Give me the total Finals points for each side so later comparisons have a trusted denominator.', deliverable: 'A team-scoring summary.', concepts: 'SUM · GROUP BY · JOIN' },
  7: { message: 'Not every game carried the same pressure. Classify the finishes by margin so we can separate decisive wins from close contests.', deliverable: 'A seven-row game pattern brief.', concepts: 'CTE · CASE · GROUP BY' },
  8: { message: 'Totals can mislead when appearances differ. Compare player production with games played and per-game output, then flag the meaningful sample.', deliverable: 'A qualified player production table.', concepts: 'AVG · COUNT DISTINCT · HAVING' },
  9: { message: 'Bring the Act II work together. Produce the compact performance brief I can use in the manager review.', deliverable: 'A verified seven-game performance brief.', concepts: 'CTE · CONDITIONAL AGGREGATION · GROUP BY' },
  10: { message: 'Before we trust any conclusion, map the records. Keep each player-game row intact while connecting dates, names, and teams.', deliverable: 'A player-game relationship map.', concepts: 'INNER JOIN · KEYS · GRAIN' },
  11: { message: 'Run a join audit against the baseline. If the totals change, find the relationship that caused the fan-out before it reaches the report.', deliverable: 'A reconciled game-total audit.', concepts: 'JOIN · SUM · GROUP BY' },
  12: { message: 'The relationship map holds. Build the player analysis at the correct grain, then attach readable labels without duplicating anyone.', deliverable: 'A verified player and team analysis.', concepts: 'CTE · JOIN · AGGREGATION' },
  13: { message: 'You are ready for ranking work. Keep the player detail available while applying a transparent rule for ordering the leaderboard.', deliverable: 'A reproducible ranked performance table.', concepts: 'RANK · WINDOW FUNCTION · CTE' },
  14: { message: 'Compare each Cleveland score with the game before it. Report the change carefully; describe what moved, not a cause the data cannot prove.', deliverable: 'A game-to-game change report.', concepts: 'LAG · WINDOW FUNCTION · CTE' },
  15: { message: 'Assemble the final dossier from the verified pieces. I need one chronological report that makes the score, winner, margin, and running record defensible.', deliverable: 'The complete Finals reconstruction.', concepts: 'MULTIPLE CTES · WINDOW SUM · CASE' },
}

export function getManagerDialogue(challenge: CaseChallenge): ManagerDialogue {
  return messages[challenge.id] ?? { message: challenge.prompt, deliverable: 'A verified analytical result.', concepts: challenge.eyebrow }
}

export { manager }
