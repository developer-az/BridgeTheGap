import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

// Get current user's schedule
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get another user's schedule
router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching user schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get mutual availability with partner
router.get('/mutual/:partnerId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const partnerId = req.params.partnerId;

    // Get both schedules
    const [{ data: mySchedule }, { data: partnerSchedule }] = await Promise.all([
      supabase.from('schedules').select('*').eq('user_id', userId),
      supabase.from('schedules').select('*').eq('user_id', partnerId),
    ]);

    res.json({
      mySchedule: mySchedule || [],
      partnerSchedule: partnerSchedule || [],
    });
  } catch (error: any) {
    console.error('Error fetching mutual availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create schedule entry
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { day_of_week, start_time, end_time, title, type } = req.body;

    const { data, error } = await supabase
      .from('schedules')
      .insert({
        user_id: req.user!.id,
        day_of_week,
        start_time,
        end_time,
        title,
        type,
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error creating schedule entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update schedule entry
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { day_of_week, start_time, end_time, title, type } = req.body;

    const { data, error } = await supabase
      .from('schedules')
      .update({
        day_of_week,
        start_time,
        end_time,
        title,
        type,
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating schedule entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule entry
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting schedule entry:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
