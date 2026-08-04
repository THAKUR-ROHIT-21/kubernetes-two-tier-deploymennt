import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as addressApi from '../api/addressApi';
import { MapPin, Plus, Pencil, Trash2, Star, Loader2, Home, Briefcase, X } from 'lucide-react';

const LABEL_ICONS = { Home, Work: Briefcase, Other: MapPin };

const EMPTY_FORM = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

function AddressFormModal({ initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(initialData?._id);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form, isEditing ? initialData._id : null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-graphite/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface ring-1 ring-border-line rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-text-primary">
            {isEditing ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-text-muted text-xs font-medium mb-1.5">Label</label>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setForm({ ...form, label: l })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.label === l
                      ? 'bg-teal text-graphite border-teal'
                      : 'bg-graphite text-text-muted border-border-line hover:border-teal'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <input
            name="fullName"
            placeholder="Full name"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
          />
          <input
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
          />
          <input
            name="street"
            placeholder="Street address, house no."
            value={form.street}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
            />
            <input
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="postalCode"
              placeholder="Postal code"
              value={form.postalCode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
            />
            <input
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-graphite border border-border-line text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-teal transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Address'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data.addresses);
    } catch (err) {
      setError('Could not load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const handleSave = async (formData, editId) => {
    if (editId) {
      await addressApi.updateAddress(editId, formData);
    } else {
      await addressApi.createAddress(formData);
    }
    await fetchAddresses();
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await addressApi.deleteAddress(id);
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressApi.setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set default address');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center gap-4 px-6 text-center">
        <MapPin className="w-12 h-12 text-text-muted" strokeWidth={1.5} />
        <p className="text-text-primary font-display text-xl">Log in to manage addresses</p>
        <Link to="/login" state={{ from: '/addresses' }} className="bg-teal hover:bg-teal-dim text-graphite font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Your Addresses</h1>
            <p className="text-text-muted text-sm mt-1">Manage delivery addresses for checkout</p>
          </div>
          <button
            onClick={() => { setEditingAddress(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 bg-teal hover:bg-teal-dim text-graphite text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {error && (
          <p className="text-amber text-sm bg-amber/10 border border-amber/30 rounded-lg px-4 py-2.5 mb-5">
            {error}
          </p>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-28 bg-surface border border-border-line rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && addresses.length === 0 && (
          <div className="text-center py-16 bg-surface border border-border-line rounded-2xl">
            <MapPin className="w-10 h-10 text-text-muted mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-text-primary font-medium mb-1">No addresses saved yet</p>
            <p className="text-text-muted text-sm">Add an address to speed up checkout.</p>
          </div>
        )}

        <div className="space-y-3">
          {addresses.map((addr) => {
            const LabelIcon = LABEL_ICONS[addr.label] || MapPin;
            return (
              <div
                key={addr._id}
                className={`relative bg-surface border rounded-2xl p-5 transition-colors ${
                  addr.isDefault ? 'border-teal/50' : 'border-border-line'
                }`}
              >
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 bg-teal/10 text-teal text-[11px] font-semibold px-2 py-1 rounded-full">
                    <Star className="w-3 h-3" fill="currentColor" />
                    Default
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <LabelIcon className="w-4 h-4 text-teal" strokeWidth={1.75} />
                  <span className="text-text-primary font-semibold text-sm">{addr.label}</span>
                </div>

                <p className="text-text-primary font-medium">{addr.fullName}</p>
                <p className="text-text-muted text-sm mt-0.5">
                  {addr.street}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                </p>
                <p className="text-text-muted text-sm mt-0.5">{addr.phone}</p>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-line">
                  <button
                    onClick={() => { setEditingAddress(addr); setModalOpen(true); }}
                    className="flex items-center gap-1.5 text-text-muted hover:text-teal text-xs font-medium transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="flex items-center gap-1.5 text-text-muted hover:text-teal text-xs font-medium transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Set as default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr._id)}
                    disabled={deletingId === addr._id}
                    className="flex items-center gap-1.5 text-text-muted hover:text-amber text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {deletingId === addr._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && (
        <AddressFormModal
          initialData={editingAddress}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Addresses;