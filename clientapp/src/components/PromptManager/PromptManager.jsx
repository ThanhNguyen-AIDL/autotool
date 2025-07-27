'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames } from '@/services/profileService';
import { getPromptList, createPrompt, deletePrompt } from '@/services/promptService';
import React, { useEffect, useState } from 'react';

const PromptManager = () => { 
  const [mounted, setMounted] = useState(false);
  const {categories} = useCategories()
  const [prompts, setPrompts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', owner: '' });
  const [filter, setFilter] = useState('');

  const [computerNames, setComputerNames] = useState([]);
  const [selectedPC, setSelectdPC] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchComputerNames();
    }
  }, [mounted]);


  useEffect(() => {
    fetchPrompts();
    setForm({ ...form, owner: selectedPC });

  }, [filter, selectedPC]);

  const fetchComputerNames = async () => {
      try {
          const data = await getCompunterNames();
          setComputerNames(data);
      } catch (err) {
          console.error('Failed to load computer names');
      }
  };

  
  const fetchPrompts = async () => {
    try {
      const data = await getPromptList(filter, selectedPC)
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      console.error('Name and category are required');
      return;
    }

    try {
        await createPrompt(form);
        setForm({ ...form, name: "", category: '' });

        fetchPrompts();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prompt?')) return;
    try {
        await deletePrompt(id)
        fetchPrompts();
    } catch (err) {
      console.error(err.message);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <div style={{ marginTop: 20 }}>
          <label>Computer Names: </label>
          <select value={selectedPC} onChange={(e) => setSelectdPC(e.target.value)} required={true}>
              <option value="">All</option>
              {computerNames.map((c) => (
                  <option key={c} value={c}>
                      {c}
                  </option>
              ))}
          </select>
      </div>
      {selectedPC && <div> 
        
          <h2>📌 Prompt Manager</h2>

          <form onSubmit={handleSubmit}>
            <textarea
              name="name"
              placeholder="Prompt name"
              value={form.name}
              required={true}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <select
              name="category"
              value={form.category}
              required={true}
              onChange={handleChange}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" style={{ marginTop: 10 }}>Add Prompt</button>
          </form>

          <div style={{ marginTop: 20 }}>
            <label>Filter by Category: </label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <table style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse' }}>
              <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Name</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Category</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {prompts.map((p) => (
                  <tr key={p.id}>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{p.category}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                      <button
                          onClick={() => handleDelete(p.id)}
                          style={{ color: 'white', backgroundColor: 'red', padding: '4px 8px', border: 'none', borderRadius: '4px' }}
                      >
                          Delete
                      </button>
                      </td>
                  </tr>
                  ))}
              </tbody>
          </table>
      </div>}
      
    </div>
  );
};

export default PromptManager;
