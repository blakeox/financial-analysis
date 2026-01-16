import '@testing-library/jest-dom';
import { afterAll, beforeEach, expect, vi } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend({ toHaveNoViolations });

const fixedNow = new Date('2024-01-01T00:00:00.000Z').getTime();
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
	nowSpy?.mockRestore();
	nowSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
});

afterAll(() => {
	nowSpy?.mockRestore();
});
