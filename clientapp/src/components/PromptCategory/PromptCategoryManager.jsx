'use client';

import React, { useState, useEffect } from 'react';
import { getPromptCategories, createPromptCategory, deleteCategory } from '@/services/promptCatService';
import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames } from '@/services/profileService';
import { useSearchParams } from 'next/navigation';

const PromptCategoryManager = () => {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', owner: '' });
  const [error, setError] = useState('');
  const queryParams = new URLSearchParams(window.location.search);

  const {categories, setCategories} = useCategories()
  const [computerNames, setComputerNames] = useState([]);
  
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
      setMounted(true);
    }, []);
  
  useEffect(() => {
    if (mounted) {
      fetchComputerNames();
    }
  }, [mounted]);
  

  const fetchComputerNames = async () => {
      try {
          const data = await getCompunterNames();
          setComputerNames(data);
      } catch (err) {
          console.error('Failed to load computer names');
      }
  };

  
  const fetchCategories = async () => {
    try {
      
      const data = await getPromptCategories(queryParams.get('owner'));
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {

    try {
      await createPromptCategory(form)
      
      setForm({ name: '', owner: '' });
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      await deleteCategory    (id)  
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>📚 Prompt Categories</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Category name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8 }}
        />

        <select   value={form.owner}
            style={{ width: '100%', padding: 8 }}

          onChange={handleChange} name="owner" required={true}>
            <option value="">ALL</option>
            {computerNames.map((c) => (
                <option key={c} value={c}>
                    {c}
                </option>
            ))}

        </select>


        <button type="submit" style={{ marginTop: 8 }}>
              Add
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>⚠️ {error}</p>}

      <ul style={{ marginTop: 20 }}>
        {categories.map((cat) => (
          <li key={cat.id} style={{ marginBottom: 10 }}>
            <strong>{cat.name}</strong>
            <button onClick={() => handleDelete(cat.id)} style={{ marginLeft: 5, color: 'red' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PromptCategoryManager;
