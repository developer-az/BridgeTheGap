import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Search for ground transport (train/bus) using Google Directions API
export async function searchGroundTransport(
  origin: string,
  destination: string,
  date: string,
  mode: 'train' | 'bus'
): Promise<any[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn(`⚠️  Using mock ${mode} data - Add GOOGLE_MAPS_API_KEY to enable real transit data`);
    return getMockGroundTransport(origin, destination, date, mode);
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin,
          destination,
          mode: 'transit',
          transit_mode: mode === 'train' ? 'rail' : 'bus',
          departure_time: new Date(date).getTime() / 1000,
          alternatives: true,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data.status !== 'OK') {
      console.warn(`Google Directions API returned ${response.data.status}, using mock data`);
      return getMockGroundTransport(origin, destination, date, mode);
    }

    // Transform Google response to our format
    return response.data.routes.map((route: any, index: number) => {
      const leg = route.legs[0];
      const transitSteps = leg.steps.filter((step: any) => step.travel_mode === 'TRANSIT');

      return {
        id: `${mode}-${index}`,
        duration: leg.duration.text,
        durationMinutes: leg.duration.value / 60,
        distance: leg.distance.text,
        departure: leg.departure_time?.text || 'Flexible',
        arrival: leg.arrival_time?.text || 'Flexible',
        transitDetails: transitSteps.map((step: any) => ({
          line: step.transit_details.line.name,
          vehicle: step.transit_details.line.vehicle.type,
          departure: {
            stop: step.transit_details.departure_stop.name,
            time: step.transit_details.departure_time?.text || '',
          },
          arrival: {
            stop: step.transit_details.arrival_stop.name,
            time: step.transit_details.arrival_time?.text || '',
          },
          numStops: step.transit_details.num_stops,
        })),
        price: {
          total: calculateEstimatedPrice(leg.distance.value, mode),
          currency: 'USD',
        },
        type: mode,
      };
    });
  } catch (error: any) {
    console.error(`${mode} search error:`, error.response?.data || error.message);
    return getMockGroundTransport(origin, destination, date, mode);
  }
}

// Calculate estimated price based on distance
function calculateEstimatedPrice(distanceMeters: number, mode: 'train' | 'bus'): string {
  const distanceMiles = distanceMeters / 1609.34;
  const pricePerMile = mode === 'train' ? 0.25 : 0.15;
  const basePrice = mode === 'train' ? 10 : 5;
  const total = basePrice + (distanceMiles * pricePerMile);
  return total.toFixed(2);
}

// Mock ground transport data for demo purposes
function getMockGroundTransport(
  origin: string,
  destination: string,
  date: string,
  mode: 'train' | 'bus'
): any[] {
  const isTrain = mode === 'train';
  
  return [
    {
      id: `mock-${mode}-1`,
      duration: isTrain ? '3 hours 15 mins' : '4 hours 30 mins',
      durationMinutes: isTrain ? 195 : 270,
      distance: '250 miles',
      departure: '08:00 AM',
      arrival: isTrain ? '11:15 AM' : '12:30 PM',
      transitDetails: [
        {
          line: isTrain ? 'Northeast Regional' : 'Greyhound Express',
          vehicle: isTrain ? 'HEAVY_RAIL' : 'BUS',
          departure: {
            stop: `${origin} Station`,
            time: '08:00 AM',
          },
          arrival: {
            stop: `${destination} Station`,
            time: isTrain ? '11:15 AM' : '12:30 PM',
          },
          numStops: isTrain ? 5 : 8,
        },
      ],
      price: {
        total: isTrain ? '65.00' : '45.00',
        currency: 'USD',
      },
      type: mode,
    },
    {
      id: `mock-${mode}-2`,
      duration: isTrain ? '4 hours' : '5 hours',
      durationMinutes: isTrain ? 240 : 300,
      distance: '250 miles',
      departure: '02:30 PM',
      arrival: isTrain ? '06:30 PM' : '07:30 PM',
      transitDetails: [
        {
          line: isTrain ? 'Acela Express' : 'Megabus',
          vehicle: isTrain ? 'HIGH_SPEED_TRAIN' : 'BUS',
          departure: {
            stop: `${origin} Central`,
            time: '02:30 PM',
          },
          arrival: {
            stop: `${destination} Terminal`,
            time: isTrain ? '06:30 PM' : '07:30 PM',
          },
          numStops: isTrain ? 3 : 6,
        },
      ],
      price: {
        total: isTrain ? '85.00' : '35.00',
        currency: 'USD',
      },
      type: mode,
    },
  ];
}



