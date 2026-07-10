import bcrypt from 'bcryptjs';

let dbMode = 'mongoose';
const memoryState = { users: [], leads: [] };

export const setDbMode = (mode) => {
  dbMode = mode;
};

export const getDbMode = () => dbMode;

export const initMemoryStore = () => {
  if (!memoryState.initialized) {
    memoryState.users = [];
    memoryState.leads = [];
    memoryState.initialized = true;
  }
  return memoryState;
};

const makeId = () => Math.random().toString(36).slice(2, 10);

export const findUserByEmail = async (email) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    return memoryState.users.find((user) => user.email === email) || null;
  }
  return null;
};

export const createUser = async (data) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    const user = {
      _id: makeId(),
      email: data.email,
      password: data.password,
      role: data.role || 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryState.users.push(user);
    return user;
  }
  return null;
};

export const createLead = async (data) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    const lead = {
      _id: makeId(),
      name: data.name,
      email: data.email,
      company: data.company || '',
      phone: data.phone || '',
      status: data.status || 'New',
      source: data.source || '',
      value: Number(data.value) || 0,
      priority: data.priority || 'Medium',
      notes: Array.isArray(data.notes) ? data.notes : [],
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      createdBy: data.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryState.leads.unshift(lead);
    return lead;
  }
  return null;
};

export const listLeads = async ({ search = '', status = '', page = 1, limit = 8 }) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    const query = memoryState.leads.filter((lead) => {
      const matchesSearch = !search || [lead.name, lead.company, lead.email].some((value) => value?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !status || lead.status === status;
      return matchesSearch && matchesStatus;
    });

    const total = query.length;
    const leads = query.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice((page - 1) * limit, page * limit);
    return {
      leads,
      total,
      page: Number(page),
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }
  return { leads: [], total: 0, page: 1, pages: 1 };
};

export const updateLead = async (id, updates) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    const lead = memoryState.leads.find((item) => item._id === id);
    if (!lead) return null;
    Object.assign(lead, updates, { updatedAt: new Date() });
    return lead;
  }
  return null;
};

export const deleteLead = async (id) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    memoryState.leads = memoryState.leads.filter((lead) => lead._id !== id);
    return true;
  }
  return false;
};

export const addLeadNote = async (id, note) => {
  if (dbMode === 'memory') {
    initMemoryStore();
    const lead = memoryState.leads.find((item) => item._id === id);
    if (!lead) return null;
    lead.notes = [...(lead.notes || []), note];
    lead.updatedAt = new Date();
    return lead;
  }
  return null;
};
