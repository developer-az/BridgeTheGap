import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

// Get current user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by public ID
router.get('/by-public-id/:publicId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, university_name, major, location_city, location_state, bio, public_id')
      .eq('public_id', req.params.publicId.toUpperCase())
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'User not found with that ID' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching user by public ID:', error);
    res.status(404).json({ error: 'User not found with that ID' });
  }
});

// Update user profile
router.post('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { university_name, major, location_city, location_state, bio } = req.body;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: req.user!.id,
        email: req.user!.email,
        university_name,
        major,
        location_city,
        location_state,
        bio,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { university } = req.query;

    let query = supabase
      .from('users')
      .select('id, email, university_name, major, location_city, location_state')
      .neq('id', req.user!.id);

    if (university) {
      query = query.ilike('university_name', `%${university}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific user
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, university_name, major, location_city, location_state, bio')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
