/**
 * Google Flights URL Generator
 * 
 * Generates clickable Google Flights search URLs based on user input
 */

/**
 * Convert city/airport name to airport code if possible
 * For now, we'll use the input as-is and let Google handle the conversion
 */
function normalizeLocation(location: string): string {
  // Remove common suffixes and clean up
  return location.trim()
    .replace(/,.*$/, '') // Remove state/country after comma
    .trim();
}

/**
 * Format date for Google Flights (YYYY-MM-DD)
 */
function formatDate(date: string): string {
  if (!date) return '';
  // Ensure date is in YYYY-MM-DD format
  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // Return as-is if invalid
  return d.toISOString().split('T')[0];
}

/**
 * Generate Google Flights search URL
 * 
 * @param origin - Origin city or airport code (e.g., "Boston" or "BOS")
 * @param destination - Destination city or airport code (e.g., "College Park" or "DCA")
 * @param date - Departure date (YYYY-MM-DD format)
 * @param returnDate - Optional return date (YYYY-MM-DD format)
 * @returns Google Flights search URL
 */
export function generateGoogleFlightsUrl(
  origin: string,
  destination: string,
  date: string,
  returnDate?: string
): string {
  if (!origin || !destination || !date) {
    return '';
  }

  const normalizedOrigin = normalizeLocation(origin);
  const normalizedDestination = normalizeLocation(destination);
  const formattedDate = formatDate(date);
  const formattedReturnDate = returnDate ? formatDate(returnDate) : '';

  // Build the search query
  let query = `Flights from ${normalizedOrigin} to ${normalizedDestination}`;
  
  if (formattedReturnDate) {
    query += ` from ${formattedDate} to ${formattedReturnDate}`;
  } else {
    query += ` on ${formattedDate}`;
  }

  // Encode the query
  const encodedQuery = encodeURIComponent(query);

  // Generate Google Flights URL
  // Using the simpler format that Google Flights supports
  const baseUrl = 'https://www.google.com/travel/flights';
  const params = new URLSearchParams({
    q: query,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a simple Google Flights URL with just origin, destination, and date
 * This format is more reliable and works better with Google's search
 */
export function generateSimpleGoogleFlightsUrl(
  origin: string,
  destination: string,
  date: string,
  returnDate?: string
): string {
  if (!origin || !destination || !date) {
    return '';
  }

  const normalizedOrigin = normalizeLocation(origin);
  const normalizedDestination = normalizeLocation(destination);
  const formattedDate = formatDate(date);
  const formattedReturnDate = returnDate ? formatDate(returnDate) : '';

  // Build search query - Google Flights will parse this
  let searchQuery = `Flights from ${normalizedOrigin} to ${normalizedDestination} on ${formattedDate}`;
  
  if (formattedReturnDate) {
    searchQuery = `Flights from ${normalizedOrigin} to ${normalizedDestination} from ${formattedDate} to ${formattedReturnDate}`;
  }

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(searchQuery)}`;
}



