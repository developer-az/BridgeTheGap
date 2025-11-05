import axios from 'axios';

const AMADEUS_API_URL = 'https://test.api.amadeus.com';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Get Amadeus API access token
async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  try {
    const response = await axios.post(
      `${AMADEUS_API_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

    return accessToken!;
  } catch (error: any) {
    console.error('Error getting Amadeus token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Amadeus API');
  }
}

// Search for flight offers
export async function searchFlights(
  origin: string,
  destination: string,
  date: string,
  returnDate?: string
): Promise<any[]> {
  try {
    const token = await getAccessToken();

    const params: any = {
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: 1,
      max: 10,
    };

    if (returnDate) {
      params.returnDate = returnDate;
    }

    const response = await axios.get(
      `${AMADEUS_API_URL}/v2/shopping/flight-offers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    );

    // Transform Amadeus response to our format
    return response.data.data.map((offer: any) => ({
      id: offer.id,
      price: {
        total: offer.price.total,
        currency: offer.price.currency,
      },
      itineraries: offer.itineraries.map((itinerary: any) => ({
        duration: itinerary.duration,
        segments: itinerary.segments.map((segment: any) => ({
          departure: {
            airport: segment.departure.iataCode,
            time: segment.departure.at,
          },
          arrival: {
            airport: segment.arrival.iataCode,
            time: segment.arrival.at,
          },
          carrier: segment.carrierCode,
          flightNumber: segment.number,
          duration: segment.duration,
        })),
      })),
      type: 'flight',
    }));
  } catch (error: any) {
    console.error('Flight search error:', error.response?.data || error.message);
    
    // Return mock data if API is not configured
    if (error.message.includes('not configured')) {
      console.warn('⚠️  Using mock flight data - Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to enable real flights');
      return getMockFlights(origin, destination, date);
    }
    
    throw new Error('Failed to search flights');
  }
}

// Mock flight data for demo purposes
function getMockFlights(origin: string, destination: string, date: string): any[] {
  return [
    {
      id: 'mock-flight-1',
      price: {
        total: '150.00',
        currency: 'USD',
      },
      itineraries: [
        {
          duration: 'PT2H30M',
          segments: [
            {
              departure: {
                airport: origin.substring(0, 3).toUpperCase(),
                time: `${date}T08:00:00`,
              },
              arrival: {
                airport: destination.substring(0, 3).toUpperCase(),
                time: `${date}T10:30:00`,
              },
              carrier: 'AA',
              flightNumber: '1234',
              duration: 'PT2H30M',
            },
          ],
        },
      ],
      type: 'flight',
    },
    {
      id: 'mock-flight-2',
      price: {
        total: '175.00',
        currency: 'USD',
      },
      itineraries: [
        {
          duration: 'PT3H15M',
          segments: [
            {
              departure: {
                airport: origin.substring(0, 3).toUpperCase(),
                time: `${date}T14:00:00`,
              },
              arrival: {
                airport: destination.substring(0, 3).toUpperCase(),
                time: `${date}T17:15:00`,
              },
              carrier: 'DL',
              flightNumber: '5678',
              duration: 'PT3H15M',
            },
          ],
        },
      ],
      type: 'flight',
    },
  ];
}



