import React, { useState, useEffect } from 'react';
import styles from './ProfileModal.module.css';

export default function EditProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    auth: '',
    owner: '',
    isMain: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        auth: profile.auth || '',
        owner: profile.owner || '',
        isMain: profile.isMain || false,
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = () => {
    onSave({ ...form, id: profile.id });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Edit Profile</h2>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="owner" value={form.owner} onChange={handleChange} placeholder="Owner" />
        <input name="auth" value={form.auth} onChange={handleChange} placeholder="Auth" />
        <label>
          <input
            type="checkbox"
            name="isMain"
            checked={form.isMain}
            onChange={handleChange}
          />
          Is Main
        </label>
        <div className={styles.buttons}>
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose} className={styles.cancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
