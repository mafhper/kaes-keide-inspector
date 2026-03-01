import { describe, expect, it } from 'vitest';
import { isSafeDownloadUrl } from './download';

describe('download security', () => {
  it('accepts safe protocols', () => {
    expect(isSafeDownloadUrl('https://example.com/image.png')).toBe(true);
    expect(isSafeDownloadUrl('http://example.com/image.png')).toBe(true);
    expect(isSafeDownloadUrl('blob:https://example.com/123')).toBe(true);
    expect(isSafeDownloadUrl('data:image/png;base64,abc')).toBe(true);
  });

  it('rejects active/unsafe protocols', () => {
    expect(isSafeDownloadUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeDownloadUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeDownloadUrl('file:///etc/passwd')).toBe(false);
  });
});
