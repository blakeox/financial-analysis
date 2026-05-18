import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { ScrollableRegion } from './ScrollableRegion';

describe('ScrollableRegion accessibility', () => {
  it('has no axe violations for a scrollable table', async () => {
    const { container } = render(
      <ScrollableRegion label="Sample schedule table">
        <table>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Payment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>$100</td>
            </tr>
          </tbody>
        </table>
      </ScrollableRegion>
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
