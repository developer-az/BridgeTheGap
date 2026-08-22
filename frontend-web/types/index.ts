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
  day_of_week: number;
  start_time: string;
  end_time: string;
  title?: string;
  type: 'class' | 'work' | 'other';
  created_at?: string;
}

export type TravelSource = 'live' | 'estimate';

export interface TravelPlan {
  id: string;
  user_id: string;
  partner_id?: string | null;
  origin: string;
  destination: string;
  travel_date: string;
  return_date?: string;
  preferred_method?: 'flight' | 'train' | 'bus' | 'any';
  saved_routes?: unknown;
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
  source: TravelSource;
  bookUrl?: string;
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
  source: TravelSource;
  bookUrl?: string;
}

export type TravelOffer = FlightOffer | GroundTransport;

export interface PlaceLocation {
  label: string;
  query: string;
  placeId?: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  nights: number;
  checkIn: string;
  checkOut: string;
  price: {
    total: string;
    perNight: string;
    currency: string;
  };
  type: 'hotel';
  source: TravelSource;
  bookUrl?: string;
}

export type CoupleDateKind =
  | 'anniversary'
  | 'birthday'
  | 'first-met'
  | 'visit'
  | 'occasion'
  | 'custom';

export interface CoupleDate {
  id: string;
  user1_id: string;
  user2_id?: string | null;
  title: string;
  date: string;
  end_date?: string | null;
  kind: CoupleDateKind;
  notes?: string | null;
  recurring_yearly?: boolean;
  created_by?: string | null;
  created_at?: string;
  source?: 'custom' | 'visit' | 'invitation' | 'occasion';
}

export interface TravelSearchResults {
  flights: FlightOffer[] | { error: string };
  trains: GroundTransport[] | { error: string };
  buses: GroundTransport[] | { error: string };
  hotels: HotelOffer[] | { error: string };
  resolved?: {
    origin?: PlaceLocation;
    destination?: PlaceLocation;
  };
}

export type OccasionCollection = 'seasonal' | 'small-nights' | 'long-weekends';

export interface OccasionIdea {
  title: string;
  detail: string;
  effort: 'small' | 'full';
}

export interface Occasion {
  slug: string;
  title: string;
  collection: OccasionCollection;
  month: number;
  day: number;
  leadDays: number;
  kicker: string;
  prompt: string;
  letterGreeting: string;
  letterBody: string;
  ideas: OccasionIdea[];
}

export type InvitationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'later';

export interface Invitation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  occasion_slug: string;
  proposed_date: string;
  body: string;
  status: InvitationStatus;
  opened_at?: string | null;
  created_at: string;
  occasion?: Occasion;
  from_user?: User;
  to_user?: User;
}

export type VisitStatus = 'proposed' | 'accepted' | 'booked';

export interface Visit {
  id: string;
  user1_id: string;
  user2_id: string;
  start_date: string;
  end_date?: string | null;
  traveler_id?: string | null;
  travel_plan_id?: string | null;
  status: VisitStatus;
  note?: string | null;
  created_at: string;
  traveler?: User | null;
  partner?: User;
}

export interface FreeWindow {
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  minutes: number;
}

export interface MutualAvailability {
  mySchedule: ScheduleEntry[];
  partnerSchedule: ScheduleEntry[];
  windows: FreeWindow[];
}
