import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Plus, Trash2, Edit2, Sparkles } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onSaveInventoryItem: (item: Omit<InventoryItem, 'id'> & { id?: number }) => void;
  onDeleteInventoryItem: (id: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onSaveInventoryItem,
  onDeleteInventoryItem
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !quantity.trim()) {
      alert('Item Name and Quantity are required!');
      return;
    }

    const qty = parseInt(quantity);

    if (isNaN(qty) || qty < 0) {
      alert('Quantity must be a positive whole number!');
      return;
    }

    onSaveInventoryItem({
      id: editingId || undefined,
      itemName: itemName.trim(),
      quantity: qty,
      lowStockThreshold: 0,
      expiryDate: expiryDate ? expiryDate : undefined
    });

    handleClear();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setItemName(item.itemName);
    setQuantity(String(item.quantity));
    setExpiryDate(item.expiryDate || '');
  };

  const handleClear = () => {
    setEditingId(null);
    setItemName('');
    setQuantity('');
    setExpiryDate('');
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Remove supply item '${name}' from stock entirely?`)) {
      onDeleteInventoryItem(id);
      if (editingId === id) {
        handleClear();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 rounded-md text-white text-base">📦</span>
          Supply Inventory & Expiry Tracker
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage campus assets, uniforms, and textbook lists. Keep track of stock quantities and item expiry/renewal records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-2 bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 h-fit">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-400" />
            {editingId ? 'Edit Supply Item Details' : 'Supply Entry Form'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Item Name *
              </label>
              <input
                type="text"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="e.g. Science Lab Kit A"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Expiry / Renewal Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition ${
                  editingId 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {editingId ? 'Update Item Details' : 'Save Supply Item'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-transparent border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-sm transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Inventory list */}
        <div className="lg:col-span-3 bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 flex flex-col h-[460px]">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            Current Supplies Ledger
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {inventory.length > 0 ? (
              inventory.map(item => {
                return (
                  <div 
                    key={item.id} 
                    className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-900/90 transition duration-150"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{item.itemName}</h4>
                      </div>

                      <div className="text-xs text-gray-400 space-y-0.5 font-medium">
                        <p>Stock Level: <span className="text-white font-semibold">{item.quantity}</span></p>
                        {item.expiryDate && (
                          <p className="text-gray-500">📅 Expiry / Renewal date: <span className="text-gray-400">{item.expiryDate}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition"
                        title="Edit Item"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.itemName)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="Delete Item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <p className="text-sm text-gray-400">No supply items inside inventory.</p>
                <p className="text-xs text-gray-500 mt-1">Add items using the supply portal form on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
