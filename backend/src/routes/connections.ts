import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

// Get all connections for current user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get connections where user is either user1 or user2
    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        user1_id,
        user2_id,
        status,
        created_at
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) throw error;

    // Fetch partner details for each connection
    const connectionsWithPartners = await Promise.all(
      data.map(async (conn) => {
        const partnerId = conn.user1_id === userId ? conn.user2_id : conn.user1_id;
        
        const { data: partner } = await supabase
          .from('users')
          .select('id, email, university_name, major, location_city, location_state, bio')
          .eq('id', partnerId)
          .single();

        return {
          id: conn.id,
          partner,
          status: conn.status,
          created_at: conn.created_at,
        };
      })
    );

    res.json(connectionsWithPartners);
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Request a connection
router.post('/request', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { target_user_id } = req.body;
    const userId = req.user!.id;

    if (!target_user_id) {
      return res.status(400).json({ error: 'target_user_id is required' });
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${target_user_id}),and(user1_id.eq.${target_user_id},user2_id.eq.${userId})`)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    const { data, error } = await supabase
      .from('connections')
      .insert({
        user1_id: userId,
        user2_id: target_user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept a connection
router.put('/:id/accept', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a connection
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
