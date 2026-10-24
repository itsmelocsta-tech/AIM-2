import { describe, expect, it } from 'vitest';
import { VERIFIED_DFW_SEARCH_SUGGESTIONS as serverSuggestions } from '../server/aimOsService';
import { VERIFIED_DFW_SEARCH_SUGGESTIONS as clientSuggestions } from '../src/services/jobScannerService';
import { normalizeJobSearchSuggestions } from '../src/services/jobSearchSuggestions';

describe('career suggestion API boundary', () => {
  it('preserves every current server suggestion and its clickable destination', () => {
    const normalized = normalizeJobSearchSuggestions(serverSuggestions);
    expect(normalized).toHaveLength(serverSuggestions.length);
    expect(normalized.map(s => s.url)).toEqual(serverSuggestions.map(s => s.directSearchUrl));
    for (const [index, suggestion] of normalized.entries()) {
      expect(suggestion.title).toBe(serverSuggestions[index].title);
      expect(suggestion.organization).toBe(serverSuggestions[index].employerCategory);
      expect(suggestion.category).toBe(serverSuggestions[index].type === 'employer_portal' ? 'official_employer' : 'job_board_query');
      expect(suggestion.notes).toContain(serverSuggestions[index].whyRecommended);
      expect(suggestion.vehiclePolicyNote).toBe(serverSuggestions[index].vehicleNote);
    }
  });

  it('preserves the existing client suggestion fields and links', () => {
    const normalized = normalizeJobSearchSuggestions(clientSuggestions);
    expect(normalized).toHaveLength(clientSuggestions.length);
    for (const [index, suggestion] of normalized.entries()) {
      expect(suggestion).toMatchObject(clientSuggestions[index]);
    }
  });

  it('rejects non-renderable entries and unsafe links without throwing', () => {
    for (const value of [null, undefined, {}, 'bad']) expect(normalizeJobSearchSuggestions(value)).toEqual([]);
    expect(normalizeJobSearchSuggestions([
      null, 4, [], { title: 'Missing link' },
      { title: {}, directSearchUrl: 'https://example.org/careers' },
      ...['javascript:alert(1)', 'data:text/html,unsafe', '/relative', 'https://user:password@example.org'].map(url => ({ title: 'Unsafe', url })),
    ])).toEqual([]);
    const [suggestion] = normalizeJobSearchSuggestions([{
      title: 'Career portal', directSearchUrl: 'https://example.org/careers',
      organization: {}, category: {}, location: {}, notes: {}, vehiclePolicyNote: {}, searchQuery: {},
    }]);
    expect(suggestion).toMatchObject({
      id: 'https://example.org/careers', title: 'Career portal', organization: 'Career portal',
      category: 'career_resource', location: '', notes: '', vehiclePolicyNote: '', searchQuery: '',
    });
  });
});
