import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { axe } from 'jest-axe';
import { Button } from './button';

test('Button should not have basic accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
