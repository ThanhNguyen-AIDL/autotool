'use client';

import React, { useEffect, useState } from 'react';
import {
  getCooldowns,
  updateCooldown,
  deleteCooldown,
  syncCooldowns,
} from '@/services/cooldownService';
import { getCompunterNames } from '@/services/profileService';


const formatSeconds = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs} h`);
  if (mins > 0) parts.push(`${mins} mins`);
  if (hrs === 0 && mins === 0) parts.push(`${secs} sec`);

  return parts.join(' ');
};

export default function CooldownManager() {
  const [pcList, setPcList] = useState([]);
  const [selectedPC, setSelectedPC] = useState('');
  const [cooldowns, setCooldowns] = useState([]);
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPCs();
  }, []);

  useEffect(() => {
    if (selectedPC) fetchCooldowns(selectedPC);
  }, [selectedPC]);

  const fetchPCs = async () => {
    try {
      const data = await getCompunterNames();
      setPcList(data);
    } catch (err) {
      console.error('Failed to load PCs', err);
    }
  };

  const fetchCooldowns = async (pc) => {
    setLoading(true);
    try {
      const data = await getCooldowns(pc);
      setCooldowns(data);
    } catch (err) {
      console.error('Failed to load cooldowns', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(editing);

    if (updates.length === 0) return;

    setLoading(true);
    try {
      for (const [id, newCooldown] of updates) {
        await updateCooldown(id, { cooldown_period: parseInt(newCooldown) });
      }
      await fetchCooldowns(selectedPC);
      setEditing({});
    } catch (err) {
      console.error('Bulk update failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCooldown(id);
      await fetchCooldowns(selectedPC);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleSync = async () => {
    try {
      await syncCooldowns(selectedPC);
      await fetchCooldowns(selectedPC);
    } catch (err) {
      console.error('Sync failed', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cooldown Config Manager</h1>

      <div className="mb-6">
        <label className="font-semibold mr-2">Select PC:</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedPC}
          onChange={(e) => setSelectedPC(e.target.value)}
        >
          <option value="">-- Choose PC --</option>
          {pcList.map((pc) => (
            <option key={pc} value={pc}>
              {pc}
            </option>
          ))}
        </select>

        <button
          onClick={handleSync}
          disabled={!selectedPC}
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sync Missing
        </button>
      </div>

      {loading ? (
        <p>Loading cooldowns...</p>
      ) : (
        <>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-3 py-2">Category</th>
                <th className="border px-3 py-2">Cooldown (sec)</th>
                <th className="border px-3 py-2">Last Run</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cooldowns.map((item) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2">{item.category}</td>
                  <td className="border px-3 py-2">
                    <select
                      className="border rounded px-2 py-1 w-28"
                      value={(editing[item.id] ?? item?.cooldownPeriod)?.toString() || ''}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value),
                        }))
                      }
                    >
                      {[30, 60, 120, 600, 1200, 1800, 3600, 7200, 9600, 21600, 43200, 86400].map((seconds) => (
                        <option key={seconds} value={seconds}>
                          {formatSeconds(seconds)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-3 py-2">
                    {item.lastRun
                      ? new Date(item.lastRun * 1000).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="border px-3 py-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {cooldowns.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No cooldowns found for this PC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 text-right">
            <button
              onClick={handleBulkSave}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={Object.keys(editing).length === 0}
            >
              Save All Changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
