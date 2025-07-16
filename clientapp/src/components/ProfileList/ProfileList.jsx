'use client';

import { useEffect, useState } from 'react';
import {
  getProfiles,
  createProfile,
  deleteProfile,
  launchProfile,
  updateProfile
} from '@/services/profileService';
import styles from './ProfileList.module.css';


import EditProfileModal from '../EditProfileModal/EditProfileModal';
import ContentWriter from '../ContentWriter/ContentWriter';
import { useWriterText } from '@/redux/utils/contentWriterUtils';


export default function ProfileList() {
  const [profiles, setProfiles] = useState([]);
  const [newName, setNewName] = useState('');
  const [launchURL, setLaunchURL] = useState('https://coinmarketcap.com');
  const [editingProfile, setEditingProfile] = useState(null);
  const {writerResponse} = useWriterText()
  const [form, setForm] = useState({
    name: '',
    auth: '',
    owner: '',
    isMain: false,
  });

  const refresh = async () => {
    const data = await getProfiles();
    setProfiles(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreate = async () => {
    createProfile(form);
    setForm({ name: '', auth: '', owner: '', isMain: false });
    refresh();
  };

  const handleDelete = async (name) => {
    await deleteProfile(name);
    refresh();
  };

  const handleLaunch = async (name) => {
    await launchProfile(name, launchURL, writerResponse);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Chrome Profile Manager</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input name="owner" placeholder="Owner" value={form.owner} onChange={handleChange} style={{ marginLeft: '0.5rem' }} />
        <input name="auth" placeholder="Auth" value={form.auth} onChange={handleChange} style={{ marginLeft: '0.5rem', width: '300px' }} />
        <label style={{ marginLeft: '1rem' }}>
          <input type="checkbox" name="isMain" checked={form.isMain} onChange={handleChange} />
          Is Main
        </label>
        <button onClick={handleCreate} style={{ marginLeft: '0.5rem' }}>Create</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="URL to launch with"
          value={launchURL}
          onChange={(e) => setLaunchURL(e.target.value)}
        />
      </div>

      <ContentWriter />

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Auth</th>
            <th className={styles.th}>Owner</th>
            <th className={styles.th}>Is Main</th>
            <th className={styles.th}>Last Action</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td className={styles.td}>{profile.name}</td>
              <td className={`${styles.td} ${styles.authCell}`}>{profile.auth}</td>
              <td className={styles.td}>{profile.owner}</td>
              <td className={styles.td}>{profile.isMain ? '✅' : '—'}</td>
              <td className={styles.td}>{profile.lastAction || 'N/A'}</td>
              <td className={styles.td}>
                <button onClick={() => handleLaunch(profile.name)}>Launch</button>
                <button onClick={() => handleDelete(profile.name)} style={{ marginLeft: '0.5rem' }}>Delete</button>
                <button
                  onClick={() => setEditingProfile(profile)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Edit
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
      

      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onSave={async (updated) => {
            await updateProfile(updated.id, updated);
            setEditingProfile(null);
            refresh();
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}

      </div>
  );

}
