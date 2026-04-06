import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { env } from '../config/env';

export interface Article {
  title: string;
  content: string;
  byline: string;
  siteName: string;
}

export async function fetchAndParseArticle(url: string): Promise<Article> {
  const res = await fetch(`${env.apis['cross-origin'].baseUrl}/?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Failed to fetch page (${res.status})`);

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Set base so relative URLs resolve correctly
  const base = doc.createElement('base');
  base.href = url;
  doc.head.prepend(base);

  const parsed = new Readability(doc).parse();
  if (!parsed) throw new Error('Could not extract article. Try a different URL.');

  return {
    title: parsed.title || '',
    content: DOMPurify.sanitize(parsed.content || ''),
    byline: parsed.byline || '',
    siteName: parsed.siteName || '',
  };
}
