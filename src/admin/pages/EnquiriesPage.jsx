import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { contactApi } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';

const STATUSES = ['', 'NEW', 'READ', 'REPLIED', 'ARCHIVED'];
const STATUS_LABELS = { '': 'All', NEW: 'New', READ: 'Read', REPLIED: 'Replied', ARCHIVED: 'Archived' };
const PAGE_SIZE = 20;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function truncate(str, n = 80) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function EnquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state from URL params for shareable/bookmarkable filters
  const page   = parseInt(searchParams.get('page')   || '1', 10);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const [contacts,   setContacts]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [searchInput, setSearchInput] = useState(search);

  // Debounce search — 400ms
  const debounceRef = useRef(null);

  function updateParams(updates) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v); else next.delete(k);
      });
      // Reset to page 1 when filters change
      if ('status' in updates || 'search' in updates) next.set('page', '1');
      return next;
    });
  }

  // Fetch whenever URL params change
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contactApi.list({
        page,
        limit: PAGE_SIZE,
        ...(status && { status }),
        ...(search && { search }),
        sort: 'createdAt',
        order: 'desc',
      });
      setContacts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Debounced search input → URL
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ search: val }), 400);
  }

  return (
    <div className="a-page">
      <div className="a-page__header">
        <h1 className="a-page__title">Enquiries</h1>
      </div>

      {/* ── FILTERS ── */}
      <div className="a-filters">
        <input
          className="a-input a-input--search"
          type="search"
          placeholder="Search by name, email or message…"
          value={searchInput}
          onChange={handleSearchChange}
          aria-label="Search enquiries"
        />
        <div className="a-filter-tabs" role="tablist" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <button
              key={s || 'all'}
              role="tab"
              aria-selected={status === s}
              className={`a-filter-tab${status === s ? ' a-filter-tab--active' : ''}`}
              onClick={() => updateParams({ status: s })}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="a-alert a-alert--error" role="alert">{error}</div>}

      {/* ── TABLE ── */}
      {loading ? (
        <div className="a-table-wrap">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="a-skeleton a-skeleton--row" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="a-empty">
          <p className="a-empty__title">
            {search || status ? 'No matching enquiries' : 'No enquiries yet'}
          </p>
          <p className="a-empty__sub">
            {search || status
              ? 'Try adjusting your search or filter.'
              : 'Submissions from the contact form will appear here.'}
          </p>
        </div>
      ) : (
        <>
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
                {contacts.map((c) => (
                  <tr key={c.id} className={c.status === 'NEW' ? 'a-tr--new' : ''}>
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

          <Pagination pagination={pagination} onChange={(p) => updateParams({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
