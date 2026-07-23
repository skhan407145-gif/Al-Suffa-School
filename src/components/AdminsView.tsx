import React, { useState, useMemo } from 'react';
import { Admin } from '../types';
import { 
  UserPlus, Search, Edit2, Trash2, Phone, Mail, 
  KeyRound, Check, X, Shield, Plus
} from 'lucide-react';

interface AdminsViewProps {
  admins: Admin[];
  onAddAdmin: (admin: Omit<Admin, 'id'>) => void;
  onEditAdmin: (id: number, admin: Partial<Admin>) => void;
  onDeleteAdmin: (id: number) => void;
}

export const AdminsView: React.FC<AdminsViewProps> = ({
  admins,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Filtered Admins list
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const matchesSearch = 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.contact && admin.contact.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [admins, searchTerm]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingAdminId(null);
    setName('');
    setEmail('');
    setContact('');
    setPassword('admin123');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (admin: Admin) => {
    setEditingAdminId(admin.id);
    setName(admin.name);
    setEmail(admin.email);
    setContact(admin.contact || '');
    setPassword(admin.password || 'admin123');
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedContact = contact.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail) {
      setFormError('Name and Email are required.');
      return;
    }

    if (editingAdminId) {
      onEditAdmin(editingAdminId, {
        name: trimmedName,
        email: trimmedEmail,
        contact: trimmedContact,
        password: trimmedPassword
      });
    } else {
      // Check duplicate email
      if (admins.some(a => a.email.toLowerCase() === trimmedEmail)) {
        setFormError('An administrator with this email already exists.');
        return;
      }
      onAddAdmin({
        name: trimmedName,
        email: trimmedEmail,
        contact: trimmedContact,
        password: trimmedPassword
      });
    }

    setIsFormOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" id="admins-view-container">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2 text-white">
            <Shield className="text-[#297edb]" size={22} /> Admins Registry
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            System administration accounts and system credentials.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#1f538d] text-white rounded-lg text-xs font-bold hover:bg-[#297edb] transition flex items-center gap-1.5 shadow-md"
          id="btn-add-admin"
        >
          <UserPlus size={14} /> Add New Admin
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
          <Search size={15} />
        </span>
        <input
          type="text"
          placeholder="Search admins by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#1f538d]"
          id="search-admins-input"
        />
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 border border-zinc-850 rounded-xl" id="no-admins-state">
            <Shield size={36} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-zinc-400 text-xs font-semibold">No administrators found</p>
            <p className="text-zinc-500 text-[10px] mt-1">Try modifying your search or add a new admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="admins-grid">
            {filteredAdmins.map((admin) => (
              <div 
                key={admin.id} 
                className="bg-[#1e1e24] border border-zinc-850 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition"
                id={`admin-card-${admin.id}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-extrabold text-sm border border-zinc-700">
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">{admin.name}</h3>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1 inline-block">
                          System Admin
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs border-t border-zinc-800/60 pt-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail size={13} className="text-zinc-500" />
                      <span className="truncate text-zinc-300 font-mono text-[11px]">{admin.email}</span>
                    </div>
                    {admin.contact && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone size={13} className="text-zinc-500" />
                        <span className="text-zinc-300 font-mono text-[11px]">{admin.contact}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-zinc-400">
                      <KeyRound size={13} className="text-zinc-500" />
                      <span className="text-zinc-300">Password: </span>
                      <span className="font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
                        {admin.password || 'admin123'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800/40">
                  <button
                    onClick={() => handleOpenEdit(admin)}
                    className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition"
                    title="Edit Admin"
                    id={`btn-edit-admin-${admin.id}`}
                  >
                    <Edit2 size={13} />
                  </button>
                  {/* Prevent deleting the seed admin to avoid locking the system */}
                  {admin.id !== 1 ? (
                    <button
                      onClick={() => onDeleteAdmin(admin.id)}
                      className="p-1.5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-md transition"
                      title="Delete Admin"
                      id={`btn-delete-admin-${admin.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Add/Edit Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-zinc-900 border-b border-zinc-850 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-[#297edb]" />
                {editingAdminId ? 'Edit Admin Details' : 'Register New System Admin'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Office"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#1f538d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@alsuffa.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#1f538d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Contact Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92 42 11112233"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#1f538d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  System Login Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#1f538d] font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-850 mt-5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold transition border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1f538d] hover:bg-[#297edb] text-white rounded-lg text-xs font-bold shadow-md transition"
                >
                  {editingAdminId ? 'Save Changes' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
