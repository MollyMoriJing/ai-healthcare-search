import React from 'react';

export default function ProviderList({ providers }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Providers</h2>
      <ul>
        {providers.map((provider, idx) => (
          <li key={idx} className="border-b py-2">
            {provider.basic?.name || provider.basic?.first_name + ' ' + provider.basic?.last_name}
          </li>
        ))}
      </ul>
    </div>
  );
}