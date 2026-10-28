import { getCollection, type CollectionEntry } from 'astro:content';
import sectionData from '../data/sections.json';

export type DocEntry = CollectionEntry<'docs'>;

export interface Section {
  id: string;
  title: string;
  blurb: string;
  count: number;
}

export const SECTIONS: Section[] = sectionData;

export const docPath = (entry: DocEntry) => `/${entry.id}/`;

export const sectionPath = (section: Section) => `/${section.id}/`;

let loaded: Promise<{ all: DocEntry[]; bySection: Map<string, DocEntry[]> }> | undefined;

/** Every page, and the pages of each section in sidebar order. Loaded once per build. */
export function loadDocs() {
  loaded ??= (async () => {
    const all = await getCollection('docs');
    const bySection = new Map<string, DocEntry[]>(SECTIONS.map((section) => [section.id, []]));
    for (const entry of all) bySection.get(entry.data.section)?.push(entry);
    for (const list of bySection.values()) list.sort((a, b) => a.data.order - b.data.order);
    all.sort((a, b) => a.id.localeCompare(b.id));
    return { all, bySection };
  })();
  return loaded;
}

/** Reading time in minutes, at 220 words a minute. */
export function readingMinutes(entry: DocEntry) {
  const words = (entry.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
