import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Activity {
  type: string;
  minutes: number;
  points: number;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(data => {
        setActivities(data.activities);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load activities');
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p role="status">Loading activities...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p role="alert">Unable to load activities. {error}</p>
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>No activities yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Minutes</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, idx) => (
              <tr key={idx}>
                <td>{activity.type}</td>
                <td>{activity.minutes}</td>
                <td>{activity.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
