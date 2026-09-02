import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit2, Key, Power, Trash2 } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminManagementPage() {
  const { admin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminApi.list();
      setAdmins(res.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const closeAllModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsPasswordModalOpen(false);
    setIsDisableModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedAdmin(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setFormError('');
  };

  // ─── ADD ADMIN ─────────────────────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (formData.password !== formData.confirmPassword) {
      return setFormError('Passwords do not match');
    }
    setSubmitting(true);
    try {
      await adminApi.create({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      showSuccess('Staff administrator created successfully.');
      closeAllModals();
      fetchAdmins();
    } catch (err) {
      setFormError(err.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── EDIT ADMIN ────────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await adminApi.update(selectedAdmin.id, {
        name: formData.name,
        email: formData.email
      });
      showSuccess('Admin updated successfully.');
      closeAllModals();
      fetchAdmins();
    } catch (err) {
      setFormError(err.message || 'Failed to update admin');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RESET PASSWORD ────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (formData.password !== formData.confirmPassword) {
      return setFormError('Passwords do not match');
    }
    setSubmitting(true);
    try {
      await adminApi.resetPassword(selectedAdmin.id, formData.password);
      showSuccess('Password updated successfully.');
      closeAllModals();
    } catch (err) {
      setFormError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── STATUS (DISABLE/ENABLE) ───────────────────────────────────────────────
  const handleToggleStatus = async () => {
    setSubmitting(true);
    try {
      await adminApi.updateStatus(selectedAdmin.id, !selectedAdmin.isActive);
      showSuccess(`Admin ${selectedAdmin.isActive ? 'disabled' : 'enabled'} successfully.`);
      closeAllModals();
      fetchAdmins();
    } catch (err) {
      setFormError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DELETE ADMIN ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await adminApi.delete(selectedAdmin.id);
      showSuccess('Admin account deleted successfully.');
      closeAllModals();
      fetchAdmins();
    } catch (err) {
      setFormError(err.message || 'Failed to delete admin');
    } finally {
      setSubmitting(false);
    }
  };

  const openAction = (adminItem, action) => {
    setSelectedAdmin(adminItem);
    if (action === 'edit') {
      setFormData({ name: adminItem.name, email: adminItem.email, password: '', confirmPassword: '' });
      setIsEditModalOpen(true);
    }
    if (action === 'password') setIsPasswordModalOpen(true);
    if (action === 'status') setIsDisableModalOpen(true);
    if (action === 'delete') setIsDeleteModalOpen(true);
  };

  const filteredAdmins = admins.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? a.isActive : !a.isActive);
    const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Management</h1>
          <p className="page-subtitle">Manage staff and administrator accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {successMessage && <div className="toast success">{successMessage}</div>}

      <div className="card">
        <div className="filters-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-select">
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="STAFF_ADMIN">Staff Admin</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state">Loading admins...</div>
        ) : error ? (
          <div className="empty-state error">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">No administrators found.</div>
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map(adminItem => (
                    <tr key={adminItem.id}>
                      <td>{adminItem.name}</td>
                      <td>{adminItem.email}</td>
                      <td>
                        <StatusBadge 
                          status={adminItem.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'STAFF'} 
                          type={adminItem.role === 'SUPER_ADMIN' ? 'primary' : 'secondary'} 
                        />
                      </td>
                      <td>
                        <StatusBadge 
                          status={adminItem.isActive ? 'Active' : 'Disabled'} 
                          type={adminItem.isActive ? 'success' : 'danger'} 
                        />
                      </td>
                      <td>{new Date(adminItem.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-menu-wrap" style={{ position: 'relative', display: 'inline-block' }}>
                          <button className="action-btn" aria-label="Actions" onClick={(e) => {
                            const menu = e.currentTarget.nextElementSibling;
                            document.querySelectorAll('.action-dropdown').forEach(d => { if(d !== menu) d.classList.remove('show'); });
                            menu.classList.toggle('show');
                          }}>
                            <MoreVertical size={18} />
                          </button>
                          <div className="action-dropdown" style={{ right: 0, top: '100%', position: 'absolute', zIndex: 10, background: 'var(--surface-high)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.5rem', minWidth: '150px', display: 'none' }}>
                            <button className="dropdown-item" onClick={() => openAction(adminItem, 'edit')}><Edit2 size={14}/> Edit</button>
                            <button className="dropdown-item" onClick={() => openAction(adminItem, 'password')}><Key size={14}/> Reset Password</button>
                            {adminItem.role !== 'SUPER_ADMIN' && (
                              <>
                                <button className="dropdown-item" onClick={() => openAction(adminItem, 'status')}><Power size={14}/> {adminItem.isActive ? 'Disable' : 'Enable'}</button>
                                <button className="dropdown-item text-danger" onClick={() => openAction(adminItem, 'delete')}><Trash2 size={14}/> Delete</button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}
      
      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal open">
            <div className="modal-header">
              <h3>Create Staff Admin</h3>
              <button className="close-btn" onClick={closeAllModals}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="toast error" style={{marginBottom:'1rem'}}>{formError}</div>}
              <form id="addAdminForm" onSubmit={handleAddSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" className="form-control" value="STAFF_ADMIN" disabled />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" className="form-control" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" className="form-control" required minLength={8} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" type="button" onClick={closeAllModals} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="addAdminForm" disabled={submitting}>{submitting ? 'Creating...' : 'Create Admin'}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal open">
            <div className="modal-header">
              <h3>Edit Admin</h3>
              <button className="close-btn" onClick={closeAllModals}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="toast error" style={{marginBottom:'1rem'}}>{formError}</div>}
              <form id="editAdminForm" onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" className="form-control" value={selectedAdmin.role} disabled />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" type="button" onClick={closeAllModals} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="editAdminForm" disabled={submitting}>{submitting ? 'Updating...' : 'Update Admin'}</button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {isPasswordModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal open">
            <div className="modal-header">
              <h3>Reset Admin Password</h3>
              <button className="close-btn" onClick={closeAllModals}>&times;</button>
            </div>
            <div className="modal-body">
              {formError && <div className="toast error" style={{marginBottom:'1rem'}}>{formError}</div>}
              <form id="pwdAdminForm" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" className="form-control" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" className="form-control" required minLength={8} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" type="button" onClick={closeAllModals} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="pwdAdminForm" disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DISABLE CONFIRMATION */}
      {isDisableModalOpen && (
        <ConfirmDialog 
          isOpen={true}
          title={selectedAdmin?.isActive ? "Disable Administrator?" : "Enable Administrator?"}
          message={`Are you sure you want to ${selectedAdmin?.isActive ? 'disable' : 'enable'} this administrator account?`}
          confirmText={selectedAdmin?.isActive ? 'Disable Admin' : 'Enable Admin'}
          onConfirm={handleToggleStatus}
          onCancel={closeAllModals}
          isDestructive={selectedAdmin?.isActive}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {isDeleteModalOpen && (
        <ConfirmDialog 
          isOpen={true}
          title="Delete Administrator?"
          message="Are you sure you want to permanently delete this administrator account? This action cannot be undone."
          confirmText="Delete Admin"
          onConfirm={handleDelete}
          onCancel={closeAllModals}
          isDestructive={true}
        />
      )}
    </div>
  );
}
