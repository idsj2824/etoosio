import type { Combination } from "./types";

export function compareCombinations(a: Combination, b: Combination): number {
  if (a.type === "INVALID" || b.type === "INVALID") {
    return 0;
  }

  const aIsFive = a.tiles.length === 5;
  const bIsFive = b.tiles.length === 5;

  if (aIsFive && bIsFive) {
    return compareStrengthArrays(a.strength, b.strength);
  }

  if (!aIsFive && !bIsFive) {
    if (a.type !== b.type) return 0;
    return compareStrengthArrays(a.strength, b.strength);
  }

  return 0;
}

function compareStrengthArrays(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function compareStrengthArraysPublic(a: number[], b: number[]): number {
  return compareStrengthArrays(a, b);
}
