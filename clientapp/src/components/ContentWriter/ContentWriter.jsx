
import React, { useState } from 'react';
import {getContent} from "@/services/contentService"
import { useWriterText } from '@/redux/utils/contentWriterUtils';
const ContentWriter = () => {
  const [loading, setLoading] = useState(false);
  const {
      writerResponse,
      setWriterResponse,
      promtInput, 
      setWriterPromt
    } = useWriterText()
  debugger
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWriterResponse('');

    try {
      const res = await getContent(promtInput);
      const data = await res?.data?.data;
      debugger
      setWriterResponse(data)
    } catch (err) {
      setWriterResponse('⚠️ Error: ' + err.message);
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
          value={promtInput}
          onChange={(e) => setWriterPromt(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 8 }}
          placeholder="e.g. Write a bedtime story..."
          required
        />
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>

      {writerResponse && (
        <div style={{ marginTop: 20, padding: 10, background: '#f9f9f9', borderRadius: 6 }}>
          <strong>Response:</strong>
          <p>{writerResponse}</p>
        </div>
      )}
    </div>
  );
};

export default ContentWriter;
