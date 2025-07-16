'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getPromptList, createPrompt, deletePrompt } from '@/services/promptService';
import React, { useEffect, useState } from 'react';

const PromptManager = () => { 
  const {categories} = useCategories()
  const [prompts, setPrompts] = useState([]);
  const [form, setForm] = useState({ name: '', category: '' });
  const [filter, setFilter] = useState('');


  useEffect(() => {
    fetchPrompts();
  }, [filter]);

  const fetchPrompts = async () => {
    try {
      const data = await getPromptList(filter)
      setPrompts(data);
    } catch (err) {
      setError('Failed to load prompts');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      setError('Name and category are required');
      return;
    }

    try {
        await createPrompt(form);
        setForm({ ...form, name: "" });

        fetchPrompts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prompt?')) return;
    try {
        await deletePrompt(id)
        fetchPrompts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>📌 Prompt Manager</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Prompt name"
          value={form.name}
          onChange={handleChange}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <select
          name="category"
          value={form.category}
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
    </div>
  );
};

export default PromptManager;
