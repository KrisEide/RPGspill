const UINT32_RANGE = 4_294_967_296;

export type RandomResult = {
  value: number;
  nextSeed: number;
};

export function nextRandom(seed: number): RandomResult {
  const nextSeed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;

  return {
    value: nextSeed / UINT32_RANGE,
    nextSeed,
  };
}
