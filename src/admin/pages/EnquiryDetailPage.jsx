import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contactApi } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const STATUS_ACTIONS = [
  { status: 'READ',     label: 'Mark as Read' },
  { status: 'REPLIED',  label: 'Mark as Replied' },
  { status: 'ARCHIVED', label: 'Archive' },
  { status: 'NEW',      label: 'Mark as New' },
];

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' IST';
}

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact,       setContact]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMsg,     setStatusMsg]     = useState('');
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    contactApi.get(id)
      .then((res) => setContact(res.data))
      .catch((err) => setError(err.message || 'Unable to load enquiry.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus) {
    if (contact?.status === newStatus) return;
    setStatusLoading(true);
    setStatusMsg('');
    try {
      const res = await contactApi.updateStatus(id, newStatus);
      // Backend returns { success, message, data: updatedContact }
      setContact(res.data);
      setStatusMsg(`Status updated to ${newStatus}.`);
    } catch (err) {
      setStatusMsg(err.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await contactApi.delete(id);
      navigate('/admin/enquiries', { replace: true, state: { deleted: true } });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete enquiry.');
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="a-page">
        <div className="a-skeleton a-skeleton--title" />
        <div className="a-skeleton a-skeleton--body" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="a-page">
        <div className="a-alert a-alert--error" role="alert">{error}</div>
        <Link to="/admin/enquiries" className="a-link">← Back to enquiries</Link>
      </div>
    );
  }

  if (!contact) return null;

  // Filter out the current status from action buttons
  const availableActions = STATUS_ACTIONS.filter((a) => a.status !== contact.status);

  return (
    <>
      <div className="a-page">
        {/* ── BACK + HEADER ── */}
        <div className="a-page__header">
          <div>
            <Link to="/admin/enquiries" className="a-back-link">← Enquiries</Link>
            <h1 className="a-page__title" style={{ marginTop: '8px' }}>
              {contact.name}
            </h1>
          </div>
          <StatusBadge status={contact.status} />
        </div>

        <div className="a-detail-grid">
          {/* ── ENQUIRY BODY ── */}
          <div className="a-detail-main">
            <div className="a-card">
              <div className="a-card__meta">
                <div className="a-meta-row">
                  <span className="a-meta-label">From</span>
                  <span className="a-meta-val">
                    {contact.name} &lt;
                    <a href={`mailto:${contact.email}`} className="a-link">{contact.email}</a>
                    &gt;
                  </span>
                </div>
                <div className="a-meta-row">
                  <span className="a-meta-label">Received</span>
                  <span className="a-meta-val">{formatDateTime(contact.createdAt)}</span>
                </div>
                {contact.updatedAt !== contact.createdAt && (
                  <div className="a-meta-row">
                    <span className="a-meta-label">Updated</span>
                    <span className="a-meta-val">{formatDateTime(contact.updatedAt)}</span>
                  </div>
                )}
                <div className="a-meta-row">
                  <span className="a-meta-label">ID</span>
                  <span className="a-meta-val a-meta-mono">{contact.id}</span>
                </div>
              </div>
              <div className="a-card__message">
                <p className="a-meta-label" style={{ marginBottom: '12px' }}>Message</p>
                <p className="a-message-body">{contact.message}</p>
              </div>
              <div className="a-card__reply-cta">
                <a
                  href={`mailto:${contact.email}?subject=Re: Your enquiry to PixleNova`}
                  className="a-btn a-btn--primary"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <aside className="a-detail-aside">
            <div className="a-card">
              <p className="a-card__section-label">Update Status</p>
              {statusMsg && (
                <div className="a-alert a-alert--info" role="status">{statusMsg}</div>
              )}
              <div className="a-action-list">
                {availableActions.map(({ status, label }) => (
                  <button
                    key={status}
                    className="a-btn a-btn--ghost a-btn--full"
                    onClick={() => handleStatusChange(status)}
                    disabled={statusLoading}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="a-card a-card--danger-zone">
              <p className="a-card__section-label">Danger Zone</p>
              {deleteError && (
                <div className="a-alert a-alert--error" role="alert">{deleteError}</div>
              )}
              <button
                className="a-btn a-btn--danger a-btn--full"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Enquiry
              </button>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this enquiry?"
        message={`This will permanently delete the enquiry from ${contact.name}. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteError(''); }}
        loading={deleteLoading}
      />
    </>
  );
}
