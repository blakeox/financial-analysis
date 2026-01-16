import { afterAll, beforeEach } from 'vitest';

const originalRandom = Math.random;

const createSeededRandom = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

beforeEach(() => {
  Math.random = createSeededRandom(0x12345678);
});

afterAll(() => {
  Math.random = originalRandom;
});
