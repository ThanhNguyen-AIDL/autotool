'use client';

import React, { useEffect, useState } from 'react';
import { getLogNames, getLogsByName } from '@/services/logService';
import { useLogManager } from '@/redux/utils/logUtitls';
import styles from './LogViewer.module.css';


function formatToLocalTime(isoString, timeZone = 'Asia/Ho_Chi_Minh') {
  const date = new Date(isoString);
  const local = new Date(date.toLocaleString('en-US', { timeZone }));

  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  const hours = String(local.getHours()).padStart(2, '0');
  const minutes = String(local.getMinutes()).padStart(2, '0');
  const seconds = String(local.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
export default function LogViewer() {
  const logManager = useLogManager();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    getLogNames().then(logManager.setLogNames).catch(console.error);
  }, []);

  useEffect(() => {
    if (!logManager.selectedFile) return;
    fetchLogs();
  }, [logManager.selectedFile, page, limit]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getLogsByName(logManager.selectedFile, page, limit);
      logManager.setLogRows(res.logs);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1); // reset to first page when limit changes
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log Viewer</h1>

      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="log-select" className="font-medium">
          Select Log File:
        </label>
        <select
          id="log-select"
          className="border rounded px-3 py-2"
          value={logManager?.selectedFile}
          onChange={(e) => {
            logManager?.setSelectedName(e.target.value);
            setPage(1);
          }}
        >
          <option value="">-- Select a log file --</option>
          {logManager.logFiles.map((file) => (
            <option key={file} value={file}>
              {file}
            </option>
          ))}
        </select>

        <label htmlFor="limit-select" className="ml-auto font-medium">
          Items per page:
        </label>
        <select
          id="limit-select"
          className="border rounded px-2 py-1"
          value={limit}
          onChange={handleLimitChange}
        >
          {[ 50, 100, 200].map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading log entries...</p>
      ) : logManager?.logEntities?.length > 0 ? (
        <>
          <div className="overflow-x-auto border rounded mb-4">
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logManager?.logEntities?.map((entry, index) => (
                  <tr key={index}>
                    <td>{formatToLocalTime(entry.time)}</td>
                    <td>{entry.actionId}</td>
                    <td className={styles.detailsCell}>
                      <div className={styles.detailsPreview}>
                        {JSON.stringify(entry.details)}
                      </div>
                      <div className={styles.detailsFull}>
                        {JSON.stringify(entry.details, null, 2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : logManager.selectedFile ? (
        <p>No entries found in this log.</p>
      ) : null}
    </div>
  );
}
