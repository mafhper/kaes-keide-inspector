import { describe, expect, it } from 'vitest';
import { detectTechnologies } from './stackEngine';

function basePageData() {
  return {
    url: 'https://example.com',
    html: '<html><body></body></html>',
    headers: {} as Record<string, string[]>,
    scripts: [] as string[],
    meta: {} as Record<string, string[]>,
    cookies: {} as Record<string, string>,
    js: {} as Record<string, unknown>,
    dom: {} as Record<string, Element[]>,
  };
}

describe('stackEngine DOM precision', () => {
  it('does not detect Headless UI when button exists without matching id pattern', () => {
    const button = document.createElement('button');
    button.id = 'submit';

    const result = detectTechnologies({
      ...basePageData(),
      dom: {
        button: [button],
      },
    });

    expect(result.some((tech) => tech.name === 'Headless UI')).toBe(false);
  });

  it('detects Headless UI when selector and attribute constraint match', () => {
    const button = document.createElement('button');
    button.id = 'headlessui-menu-button-1';

    const result = detectTechnologies({
      ...basePageData(),
      dom: {
        button: [button],
      },
    });

    expect(result.some((tech) => tech.name === 'Headless UI')).toBe(true);
  });

  it('does not detect Qwik from selector existence only', () => {
    const div = document.createElement('div');

    const result = detectTechnologies({
      ...basePageData(),
      dom: {
        '*': [div],
      },
    });

    expect(result.some((tech) => tech.name === 'Qwik')).toBe(false);
  });
});
