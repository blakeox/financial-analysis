import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import React from 'react';
import { ValidatedInput } from './ValidatedField';

describe('ValidatedField accessibility', () => {
  it('ValidatedInput has no axe violations', async () => {
    const { container } = render(
      <ValidatedInput
        label="Amount"
        value=""
        onValueChange={() => {}}
        validator={(value) => (value.trim() ? null : 'Amount is required')}
      />
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
