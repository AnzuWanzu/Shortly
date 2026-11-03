import { createSlug } from './slug';

describe('createSlug', () => {
  it('creates an eight-character URL-safe slug', () => {
    expect(createSlug()).toMatch(/^[A-Za-z0-9_-]{8}$/);
  });

  it('creates a different slug each time', () => {
    expect(createSlug()).not.toBe(createSlug());
  });
});
