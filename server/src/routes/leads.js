import express from 'express';
import Lead from '../models/Lead.js';
import { protect } from '../middleware/auth.js';
import { addLeadNote, createLead, deleteLead, getDbMode, listLeads, updateLead } from '../utils/storage.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const { search = '', status = '', page = 1, limit = 8 } = req.query;

  if (getDbMode() === 'memory') {
    const data = await listLeads({ search, status, page, limit });
    return res.json(data);
  }

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) query.status = status;

  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ leads, total, page: Number(page), pages: Math.ceil(total / limit) });
});

router.post('/', protect, async (req, res) => {
  try {
    if (getDbMode() === 'memory') {
      const lead = await createLead({ ...req.body, createdBy: req.user.id });
      return res.status(201).json(lead);
    }
    const lead = await Lead.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create lead', error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    if (getDbMode() === 'memory') {
      const lead = await updateLead(req.params.id, req.body);
      return res.json(lead);
    }
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update lead', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (getDbMode() === 'memory') {
      await deleteLead(req.params.id);
      return res.json({ message: 'Lead deleted' });
    }
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete lead', error: error.message });
  }
});

router.post('/:id/notes', protect, async (req, res) => {
  try {
    if (getDbMode() === 'memory') {
      const lead = await addLeadNote(req.params.id, req.body.note);
      return res.json(lead);
    }
    const lead = await Lead.findById(req.params.id);
    lead.notes.push(req.body.note);
    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add note', error: error.message });
  }
});

export default router;
