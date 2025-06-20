import React, { useState } from 'react';

export default function SearchForm({ onSearch }) {
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });
    const data = await res.json();
    onSearch(data);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        type="text"
        className="border p-2 w-full"
        placeholder="Describe your symptoms"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />
      <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
        Search
      </button>
    </form>
  );
}