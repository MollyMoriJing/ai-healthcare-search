import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import ProviderList from './components/ProviderList';

function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Healthcare Search</h1>
      <SearchForm onSearch={setResult} />
      {result && <>
        <p className="mt-4">Recommended Specialty: <strong>{result.specialty}</strong></p>
        <ProviderList providers={result.providers} />
      </>}
    </div>
  );
}

export default App;