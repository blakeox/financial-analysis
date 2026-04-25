import { afterAll, beforeEach, vi } from 'vitest';

const defaultRouteAgentRequest = vi.hoisted(() => vi.fn(async () => null));

// Keep the Node Vitest lane from importing the Cloudflare-only agents runtime
// unless a specific test overrides this mock with its own expectations.
vi.mock('agents', () => ({
  routeAgentRequest: defaultRouteAgentRequest,
}));

vi.mock('../agents/FinancialAnalysisAgent', () => ({
  FinancialAnalysisAgent: class FinancialAnalysisAgent {},
}));

const fixedNow = new Date('2024-01-01T00:00:00.000Z').getTime();
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  nowSpy?.mockRestore();
  nowSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
});

afterAll(() => {
  nowSpy?.mockRestore();
});
