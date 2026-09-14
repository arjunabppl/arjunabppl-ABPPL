import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { User, UserRole } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Users, UserPlus, Search, Edit2, Trash2, Key, CheckCircle, XCircle,
  Shield, UserCheck, RefreshCw, AlertTriangle, Filter, Lock
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'sales' as UserRole,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    password: ''
  });

  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      role: 'sales',
      status: 'ACTIVE',
      password: ''
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      username: u.username || '',
      email: u.email,
      role: u.role,
      status: u.status || 'ACTIVE',
      password: ''
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenResetPasswordModal = (u: User) => {
    setSelectedUser(u);
    setResetPasswordVal('');
    setError(null);
    setIsResetPasswordModalOpen(true);
  };

  const handleOpenDeleteModal = (u: User) => {
    setSelectedUser(u);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createUser(formData);
      setIsAddModalOpen(false);
      showNotification(`User '${formData.name}' created successfully.`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.updateUser(selectedUser.id, formData);
      setIsEditModalOpen(false);
      showNotification(`User '${formData.name}' updated successfully.`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.resetUserPassword(selectedUser.id, resetPasswordVal.trim());
      setIsResetPasswordModalOpen(false);
      showNotification(`Password for '${selectedUser.name}' reset successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    if (currentUser?.id === u.id) {
      alert('You cannot deactivate your own logged-in admin account.');
      return;
    }
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateUser(u.id, { status: newStatus });
      showNotification(`User status changed to ${newStatus}.`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (currentUser?.id === selectedUser.id) {
      setError('You cannot delete your own logged-in admin account.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      showNotification(`User '${selectedUser.name}' removed successfully.`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredUsers = (users || []).filter(u => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = (users || []).filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length;
  const inactiveCount = (users || []).filter(u => u.status === 'INACTIVE').length;
  const adminCount = (users || []).filter(u => u.role === 'admin').length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-700">Administrator</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700">Operations Manager</span>;
      case 'sales':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700">Sales Lead</span>;
      case 'inventory':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700">Warehouse Mgr</span>;
      case 'accounts':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700">Accounts Officer</span>;
      case 'purchase':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-950/80 text-orange-300 border border-orange-700">Purchase Officer</span>;
      case 'distributor':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700">Distributor Portal</span>;
      case 'customer':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">Customer Portal</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{role}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black text-white tracking-wide">User Management & Security</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create user accounts, set credentials, assign security roles, and manage active system access.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg flex items-center space-x-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Accounts</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">{users.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Registered in database</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Users</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
          <p className="text-[10px] text-emerald-500/80 mt-1">Allowed login access</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Inactive Users</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{inactiveCount}</div>
          <p className="text-[10px] text-rose-500/80 mt-1">Access suspended</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Administrators</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{adminCount}</div>
          <p className="text-[10px] text-purple-400/80 mt-1">Full system control</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Name, Username / Login ID, or Email..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 pl-9 pr-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="manager">Operations Manager</option>
            <option value="sales">Sales Lead</option>
            <option value="inventory">Warehouse Manager</option>
            <option value="accounts">Accounts Officer</option>
            <option value="purchase">Purchase Officer</option>
            <option value="distributor">Distributor Portal</option>
            <option value="customer">Customer Portal</option>
          </select>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={fetchUsers}
            title="Refresh Users"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading user accounts from database...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No users found</p>
            <p className="text-[11px] text-slate-500 mt-1">Try adjusting search parameters or add a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">User Details</th>
                  <th className="py-3.5 px-4">Login ID / Username</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-extrabold flex items-center justify-center text-xs shadow-inner">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <span>{u.name}</span>
                            {currentUser?.id === u.id && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700 px-1.5 py-0.2 rounded font-mono">You</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {u.username}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.status === 'INACTIVE' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Inactive</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        className={`p-1.5 rounded-md border transition ${
                          u.status === 'ACTIVE'
                            ? 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-rose-950/60 hover:border-rose-700'
                            : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-emerald-950/60 hover:border-emerald-700'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenResetPasswordModal(u)}
                        title="Reset Password"
                        className="p-1.5 bg-slate-800 text-amber-400 hover:bg-amber-950/60 hover:border-amber-700 rounded-md border border-slate-700 transition"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(u)}
                        title="Edit User Details"
                        className="p-1.5 bg-slate-800 text-blue-400 hover:bg-blue-950/60 hover:border-blue-700 rounded-md border border-slate-700 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(u)}
                        disabled={currentUser?.id === u.id}
                        title={currentUser?.id === u.id ? "Cannot delete self" : "Delete User"}
                        className={`p-1.5 rounded-md border transition ${
                          currentUser?.id === u.id
                            ? 'opacity-30 bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 text-rose-400 hover:bg-rose-950/80 hover:border-rose-600 border-slate-700'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Create New User Account</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Set up user details and assign ERP access role.</p>

            {error && (
              <div className="mb-4 bg-rose-950/80 border border-rose-600 text-rose-300 text-xs p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username / Login ID</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. ramesh123"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@abppl.com"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sales">Sales Executive</option>
                    <option value="manager">Operations Manager</option>
                    <option value="inventory">Warehouse Mgr</option>
                    <option value="accounts">Accounts Officer</option>
                    <option value="purchase">Purchase Officer</option>
                    <option value="distributor">Distributor Portal</option>
                    <option value="customer">Customer Portal</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set account password"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <Edit2 className="w-5 h-5 text-blue-400" />
              <span>Edit User Account</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Update account profile, login ID, or status.</p>

            {error && (
              <div className="mb-4 bg-rose-950/80 border border-rose-600 text-rose-300 text-xs p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username / Login ID</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sales">Sales Executive</option>
                    <option value="manager">Operations Manager</option>
                    <option value="inventory">Warehouse Mgr</option>
                    <option value="accounts">Accounts Officer</option>
                    <option value="purchase">Purchase Officer</option>
                    <option value="distributor">Distributor Portal</option>
                    <option value="customer">Customer Portal</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Reset User Password</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Set a new password for <span className="font-bold text-white">{selectedUser.name}</span> ({selectedUser.username}).
            </p>

            {error && (
              <div className="mb-4 bg-rose-950/80 border border-rose-600 text-rose-300 text-xs p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={e => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <p className="text-[11px] text-amber-400/80 bg-amber-950/30 border border-amber-800/50 p-2.5 rounded-lg">
                Note: Updating the password will securely re-hash credentials in the database and invalidate any active login session for this user immediately.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md"
                >
                  {submitting ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete User Confirmation */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center space-x-3 mb-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">Confirm User Deletion</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete <strong className="text-white">{selectedUser.name}</strong> (<span className="font-mono">{selectedUser.username}</span>)?
              This user will no longer be able to log into the ERP.
            </p>

            {error && (
              <div className="mb-4 bg-rose-950/80 border border-rose-600 text-rose-300 text-xs p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md"
              >
                {submitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
