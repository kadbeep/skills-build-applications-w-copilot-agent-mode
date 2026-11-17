import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Suggestion {
  title: string;
  reason: string;
}

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = 'mona@example.com';
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then(data => {
        setSuggestions(data.suggestions);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load suggestions');
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p role="status">Loading workout suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p role="alert">Unable to load suggestions. {error}</p>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>No workout suggestions available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <ul>
          {suggestions.map((suggestion, idx) => (
            <li key={idx}>
              <strong>{suggestion.title}</strong>: {suggestion.reason}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
