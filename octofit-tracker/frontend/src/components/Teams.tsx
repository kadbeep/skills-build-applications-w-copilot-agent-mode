import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  name: string;
  members: string[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(data => {
        setTeams(data.teams);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load teams');
        setTeams([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p role="status">Loading teams...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p role="alert">Unable to load teams. {error}</p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>No teams yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <ul>
          {teams.map((team, idx) => (
            <li key={idx}>
              <strong>{team.name}</strong>
              {team.members.length > 0 && (
                <ul>
                  {team.members.map((member, memberIdx) => (
                    <li key={memberIdx}>{member}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
