import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { driversApi } from '@/services/api';
import { RegisteredDriver } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'list' | 'add' | 'edit';

const EMPTY_FORM = { name: '', vehicleNumber: '', phone: '', password: '' };

export function ManageDriversModal({ open, onClose }: Props) {
  const [drivers, setDrivers] = useState<RegisteredDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('list');
  const [editTarget, setEditTarget] = useState<RegisteredDriver | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await driversApi.getRegistered();
      setDrivers(list);
    } catch {
      setError('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setMode('list');
      setError('');
      loadDrivers();
    }
  }, [open, loadDrivers]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowPass(false);
    setError('');
    setMode('add');
  }

  function openEdit(driver: RegisteredDriver) {
    setForm({ name: driver.name, vehicleNumber: driver.vehicleNumber, phone: driver.phone, password: '' });
    setEditTarget(driver);
    setShowPass(false);
    setError('');
    setMode('edit');
  }

  async function handleSave() {
    setError('');
    if (!form.name.trim() || !form.vehicleNumber.trim() || !form.phone.trim()) {
      setError('Name, vehicle number and phone are required');
      return;
    }
    if (mode === 'add' && !form.password.trim()) {
      setError('Password is required for new driver');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'add') {
        const created = await driversApi.create({
          name: form.name.trim(),
          vehicleNumber: form.vehicleNumber.trim(),
          phone: form.phone.trim(),
          password: form.password,
        });
        setDrivers((prev) => [...prev, created]);
      } else if (editTarget) {
        const payload: { name?: string; phone?: string; password?: string } = {
          name: form.name.trim(),
          phone: form.phone.trim(),
        };
        if (form.password) payload.password = form.password;
        const updated = await driversApi.update(editTarget.id, payload);
        setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      }
      setMode('list');
    } catch (err) {
      setError((err as Error).message || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await driversApi.remove(id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError('Failed to delete driver');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md glass-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: '#0f172a' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-brand-400" />
                <h2 className="text-sm font-semibold text-white">
                  {mode === 'list' ? 'Manage Drivers' : mode === 'add' ? 'Add New Driver' : 'Edit Driver'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {error}
                </div>
              )}

              {mode === 'list' && (
                <>
                  <button
                    onClick={openAdd}
                    className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
                  >
                    <Plus size={13} />
                    Add New Driver
                  </button>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={20} className="text-brand-400 animate-spin" />
                    </div>
                  ) : drivers.length === 0 ? (
                    <p className="text-center text-xs text-slate-600 py-6">No drivers registered yet</p>
                  ) : (
                    <div className="space-y-2">
                      {drivers.map((driver) => (
                        <div
                          key={driver.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {driver.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{driver.name}</p>
                            <p className="text-[10px] text-slate-500">{driver.vehicleNumber} · {driver.phone}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => openEdit(driver)}
                              className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-brand-400 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDelete(driver.id)}
                              disabled={deleting === driver.id}
                              className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === driver.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {(mode === 'add' || mode === 'edit') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="e.g. AP09AB1234"
                      value={form.vehicleNumber}
                      disabled={mode === 'edit'}
                      onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
                      Password {mode === 'edit' && <span className="normal-case text-slate-600">(leave blank to keep current)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder={mode === 'edit' ? 'Enter new password…' : 'e.g. Driver@123'}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full px-3 py-2.5 pr-9 text-xs rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {(mode === 'add' || mode === 'edit') && (
              <div className="px-5 py-4 border-t border-white/8 flex items-center gap-2.5">
                <button
                  onClick={() => { setMode('list'); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl glass text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {mode === 'add' ? 'Add Driver' : 'Save Changes'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
