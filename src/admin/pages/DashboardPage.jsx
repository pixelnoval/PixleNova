import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contactApi } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUSES = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function truncate(str, n = 90) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  // Counts for each status
  const [counts, setCounts]   = useState({ total: 0, NEW: 0, READ: 0, REPLIED: 0, ARCHIVED: 0 });
  const [recent, setRecent]   = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        // Fetch counts for each status in parallel + recent 5
        const [all, newQ, readQ, repliedQ, archivedQ, recentQ] = await Promise.all([
          contactApi.list({ limit: 1 }),
          contactApi.list({ status: 'NEW',      limit: 1 }),
          contactApi.list({ status: 'READ',     limit: 1 }),
          contactApi.list({ status: 'REPLIED',  limit: 1 }),
          contactApi.list({ status: 'ARCHIVED', limit: 1 }),
          contactApi.list({ limit: 5, sort: 'createdAt', order: 'desc' }),
        ]);

        setCounts({
          total:    all.pagination.total,
          NEW:      newQ.pagination.total,
          READ:     readQ.pagination.total,
          REPLIED:  repliedQ.pagination.total,
          ARCHIVED: archivedQ.pagination.total,
        });
        setRecent(recentQ.data);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total',    value: counts.total,    mod: '' },
    { label: 'New',      value: counts.NEW,       mod: '--new' },
    { label: 'Read',     value: counts.READ,      mod: '--read' },
    { label: 'Replied',  value: counts.REPLIED,   mod: '--replied' },
    { label: 'Archived', value: counts.ARCHIVED,  mod: '--archived' },
  ];

  return (
    <div className="a-page">
      <div className="a-page__header">
        <h1 className="a-page__title">Dashboard</h1>
        <Link to="/admin/enquiries" className="a-btn a-btn--primary a-btn--sm">
          View all enquiries →
        </Link>
      </div>

      {error && <div className="a-alert a-alert--error" role="alert">{error}</div>}

      {/* ── STAT CARDS ── */}
      <div className="a-stat-grid">
        {statCards.map(({ label, value, mod }) => (
          <div key={label} className={`a-stat-card${mod ? ` a-stat-card${mod}` : ''}`}>
            {loading
              ? <div className="a-skeleton a-skeleton--num" />
              : <span className="a-stat-num">{value}</span>
            }
            <span className="a-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── RECENT ENQUIRIES ── */}
      <section className="a-section">
        <h2 className="a-section__title">Recent Enquiries</h2>

        {loading && (
          <div className="a-table-wrap">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="a-skeleton a-skeleton--row" />
            ))}
          </div>
        )}

        {!loading && !error && recent.length === 0 && (
          <div className="a-empty">
            <p className="a-empty__title">No enquiries yet</p>
            <p className="a-empty__sub">Submissions from the contact form will appear here.</p>
          </div>
        )}

        {!loading && recent.length > 0 && (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td className="a-td--name">{c.name}</td>
                    <td className="a-td--email">{c.email}</td>
                    <td className="a-td--msg">{truncate(c.message)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="a-td--date">{formatDate(c.createdAt)}</td>
                    <td>
                      <Link to={`/admin/enquiries/${c.id}`} className="a-link">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
