import responses from '@/data/concierge-responses.json';
import { getEdition } from './edition';
import type { ConciergeResponse, ConciergeSuggestion } from './types';

const responseList = (responses as { responses: ConciergeResponse[] }).responses;

function normalize(text: string): string {
  return text.toLowerCase();
}

export function pickConciergeResponse(text: string): ConciergeResponse {
  const value = normalize(text);
  const intent = value.includes('travel') || value.includes('commute')
    ? 'travel'
    : value.includes('light') || value.includes('gentle')
    ? 'light'
    : value.includes('heavy') || value.includes('dense')
    ? 'heavy'
    : 'next_book';

  const match = responseList.find((response) => response.intent === intent);
  return match ?? responseList[0];
}

export function resolveSuggestions(
  suggestions: ConciergeSuggestion[]
): ConciergeSuggestion[] {
  const edition = getEdition();
  return suggestions
    .map((suggestion) => {
      const book = edition.books.find((item) => item.id === suggestion.bookId);
      if (!book) return null;
      return {
        ...suggestion,
        bookId: book.id
      };
    })
    .filter(Boolean) as ConciergeSuggestion[];
}
