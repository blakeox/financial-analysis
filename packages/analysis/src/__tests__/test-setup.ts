import { afterAll, beforeEach, vi } from 'vitest';

const originalRandom = Math.random;
const fixedNow = new Date('2024-01-01T00:00:00.000Z').getTime();
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

const createSeededRandom = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

beforeEach(() => {
  Math.random = createSeededRandom(0x12345678);
  nowSpy?.mockRestore();
  nowSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
});

afterAll(() => {
  nowSpy?.mockRestore();
  Math.random = originalRandom;
});
