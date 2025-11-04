import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { searchFlights } from '../services/travel/amadeusService';
import { searchGroundTransport } from '../services/travel/googleService';

const router = Router();

// Search travel options
router.post('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { origin, destination, date, returnDate, modes } = req.body;

    const results: any = {
      flights: [],
      trains: [],
      buses: [],
    };

    // Search flights if requested
    if (modes.includes('flight')) {
      try {
        results.flights = await searchFlights(origin, destination, date, returnDate);
      } catch (error: any) {
        console.error('Flight search error:', error.message);
        results.flights = { error: error.message };
      }
    }

    // Search trains if requested
    if (modes.includes('train')) {
      try {
        results.trains = await searchGroundTransport(origin, destination, date, 'train');
      } catch (error: any) {
        console.error('Train search error:', error.message);
        results.trains = { error: error.message };
      }
    }

    // Search buses if requested
    if (modes.includes('bus')) {
      try {
        results.buses = await searchGroundTransport(origin, destination, date, 'bus');
      } catch (error: any) {
        console.error('Bus search error:', error.message);
        results.buses = { error: error.message };
      }
    }

    res.json(results);
  } catch (error: any) {
    console.error('Error searching travel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get saved travel plans
router.get('/plans', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching travel plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save a travel plan
router.post('/plans', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { origin, destination, travel_date, return_date, saved_routes } = req.body;

    const { data, error } = await supabase
      .from('travel_plans')
      .insert({
        user_id: req.user!.id,
        origin,
        destination,
        travel_date,
        return_date,
        saved_routes,
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error saving travel plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a travel plan
router.delete('/plans/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase
      .from('travel_plans')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting travel plan:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
