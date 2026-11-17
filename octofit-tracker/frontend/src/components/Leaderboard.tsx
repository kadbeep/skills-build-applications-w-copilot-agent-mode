import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface LeaderboardEntry {
  teamName: string;
  totalPoints: number;
  rank: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(data => {
        setLeaderboard(data.leaderboard);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
        setLeaderboard([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p role="status">Loading rankings...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p role="alert">Unable to load leaderboard. {error}</p>
        </div>
      </section>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>No leaderboard rankings yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.rank}</td>
                <td>{entry.teamName}</td>
                <td>{entry.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
