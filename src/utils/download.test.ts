import { describe, expect, it } from 'vitest';
import { ensureFileExtension, inferImageExtension, isSafeDownloadUrl } from './download';

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

describe('download naming', () => {
  it('infers extension from URL path', () => {
    expect(inferImageExtension('https://example.com/assets/icon.svg?v=1', 'png')).toBe('svg');
  });

  it('infers extension from data URL mime type', () => {
    expect(inferImageExtension('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E', 'png')).toBe('svg');
  });

  it('falls back when extension cannot be inferred', () => {
    expect(inferImageExtension('https://example.com/asset?id=123', 'webp')).toBe('webp');
  });

  it('adds extension only when filename does not have one', () => {
    expect(ensureFileExtension('icon', 'svg')).toBe('icon.svg');
    expect(ensureFileExtension('photo.png', 'svg')).toBe('photo.png');
  });
});
