'use client';

import React, { useEffect, useState } from 'react';
import { getLogNames, getLogsByName } from '@/services/logService';
import { useLogManager } from '@/redux/utils/logUtitls';
import styles from './LogViewer.module.css'
export default function LogViewer() {
    const logManager = useLogManager()
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLogNames().then(logManager.setLogNames).catch(console.error);
  }, []);

  useEffect(() => {
    if (!logManager.selectedFile) return;
    setLoading(true);
    getLogsByName(logManager.selectedFile)
      .then(data => logManager.setLogRows(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [logManager.selectedFile]);

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log Viewer</h1>

      <div className="mb-6">
        <label htmlFor="log-select" className="font-medium mr-2">
          Select Log File:
        </label>
        <select
          id="log-select"
          className="border rounded px-3 py-2"
          value={logManager.selectedFile}
          onChange={(e) => logManager.setSelectedName(e.target.value)}
        >
          <option value="">-- Select a log file --</option>
          {logManager.logFiles.map((file) => (
            <option key={file} value={file}>
              {file}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading log entries...</p>
      ) : logManager.logEntities.length > 0 ? (
        <div className="overflow-x-auto border rounded">
        <table className={styles.logTable}>
            <thead>
                <tr>
                <th>Time</th>
                <th>PID</th>
                <th>Hostname</th>
                <th>Details</th>
                </tr>
            </thead>
            <tbody>
                {logManager.logEntities.map((entry, index) => (
                <tr key={index}>
                    <td>{entry.time}</td>
                    <td>{entry.pid}</td>
                    <td>{entry.hostname}</td>
                    <td className={styles.detailsCell}>
                        <div  className={styles.detailsPreview}>
                            {JSON.stringify(entry.details)}
                        </div>
                        <div  className={styles.detailsFull}>
                            {JSON.stringify(entry.details, null, 2)}
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>

        </div>
      ) : logManager.selectedFile ? (
        <p>No entries found in this log.</p>
      ) : null}
    </div>
  );
}
