export interface User {
  id: string;
  email: string;
  name?: string;
  public_id?: string;
  university_name?: string;
  major?: string;
  location_city?: string;
  location_state?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Connection {
  id: string;
  partner: User;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
}

export interface ScheduleEntry {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM:SS format
  end_time: string;
  title?: string;
  type: 'class' | 'work' | 'other';
  created_at?: string;
}

export interface TravelPlan {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  travel_date: string;
  return_date?: string;
  preferred_method?: 'flight' | 'train' | 'bus' | 'any';
  saved_routes?: any;
  created_at?: string;
}

export interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        airport: string;
        time: string;
      };
      arrival: {
        airport: string;
        time: string;
      };
      carrier: string;
      flightNumber: string;
      duration: string;
    }>;
  }>;
  type: 'flight';
}

export interface GroundTransport {
  id: string;
  duration: string;
  durationMinutes: number;
  distance: string;
  departure: string;
  arrival: string;
  transitDetails: Array<{
    line: string;
    vehicle: string;
    departure: {
      stop: string;
      time: string;
    };
    arrival: {
      stop: string;
      time: string;
    };
    numStops: number;
  }>;
  price: {
    total: string;
    currency: string;
  };
  type: 'train' | 'bus';
}

export interface TravelSearchResults {
  flights: FlightOffer[] | { error: string };
  trains: GroundTransport[] | { error: string };
  buses: GroundTransport[] | { error: string };
}

