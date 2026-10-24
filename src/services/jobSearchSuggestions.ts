import type { JobSearchSuggestion } from '../types';

export type RenderableJobSearchSuggestion = JobSearchSuggestion & {
  id: string;
  title: string;
  organization: string;
  category: string;
  url: string;
  location: string;
  notes: string;
  vehiclePolicyNote: string;
  searchQuery: string;
};

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

function careerUrl(value: unknown): string {
  const candidate = text(value);
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? candidate : '';
  } catch {
    return '';
  }
}

/** Accept both the server and older client contracts; return render-safe career resources. */
export function normalizeJobSearchSuggestions(value: unknown): RenderableJobSearchSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const suggestion = item as Record<string, unknown>;
    const url = careerUrl(suggestion.url) || careerUrl(suggestion.directSearchUrl);
    const title = text(suggestion.title);
    if (!url || !title) return [];
    return [{
      id: text(suggestion.id) || url,
      title,
      url,
      organization: text(suggestion.organization) || text(suggestion.employerCategory) || title,
      category: text(suggestion.category) || (suggestion.type === 'employer_portal'
        ? 'official_employer' : suggestion.type === 'job_search_engine' ? 'job_board_query' : 'career_resource'),
      location: text(suggestion.location),
      notes: text(suggestion.notes) || [text(suggestion.whyRecommended), text(suggestion.requirementsNote)].filter(Boolean).join(' '),
      vehiclePolicyNote: text(suggestion.vehiclePolicyNote) || text(suggestion.vehicleNote),
      searchQuery: text(suggestion.searchQuery),
    }];
  });
}
