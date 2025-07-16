'use client';

import React, { useState, useEffect } from 'react';
import { getPromptCategories, createPromptCategory, deleteCategory } from '@/services/promptCatService';
import { useCategories } from '@/redux/utils/categoryUtils';
const PromptCategoryManager = () => {
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');

  const {categories, setCategories} = useCategories()
  
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getPromptCategories();
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
      
      setForm({ name: '' });
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
