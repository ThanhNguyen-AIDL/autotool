
import React, { useState } from 'react';
import {getContent} from "@/services/contentService"
const ContentWriter = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    try {
      const res = await getContent(prompt);
      const data = await res?.data?.data;
      setResponse(data || '');
    } catch (err) {
      setResponse('⚠️ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="prompt">Ask something:</label>
        <input
          type="text"
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 8 }}
          placeholder="e.g. Write a bedtime story..."
          required
        />
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>

      {response && (
        <div style={{ marginTop: 20, padding: 10, background: '#f9f9f9', borderRadius: 6 }}>
          <strong>Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default ContentWriter;
