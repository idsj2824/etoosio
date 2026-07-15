import type { Player, RoundScore } from "./types";

export function calculateRoundScores(players: Player[]): RoundScore[] {
  const remaining = players.map((p) => ({
    playerId: p.id,
    remaining: p.hand.length,
  }));

  const scores: RoundScore[] = players.map((p) => ({
    playerId: p.id,
    roundPoints: 0,
    remainingTiles: p.hand.length,
  }));

  for (let i = 0; i < remaining.length; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      const a = remaining[i];
      const b = remaining[j];
      const diff = Math.abs(a.remaining - b.remaining);

      if (a.remaining < b.remaining) {
        const scoreA = scores.find((s) => s.playerId === a.playerId)!;
        const scoreB = scores.find((s) => s.playerId === b.playerId)!;
        scoreA.roundPoints += diff;
        scoreB.roundPoints -= diff;
      } else if (b.remaining < a.remaining) {
        const scoreA = scores.find((s) => s.playerId === a.playerId)!;
        const scoreB = scores.find((s) => s.playerId === b.playerId)!;
        scoreB.roundPoints += diff;
        scoreA.roundPoints -= diff;
      }
    }
  }

  return scores;
}

export function getTotalScoreSum(scores: RoundScore[]): number {
  return scores.reduce((sum, s) => sum + s.roundPoints, 0);
}

export function applyRoundScores(
  cumulativeScores: Record<string, number>,
  roundScores: RoundScore[]
): Record<string, number> {
  const updated = { ...cumulativeScores };
  for (const rs of roundScores) {
    updated[rs.playerId] = (updated[rs.playerId] ?? 0) + rs.roundPoints;
  }
  return updated;
}
