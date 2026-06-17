import React from 'react';
import { ShoppingCart, User, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';
import { FaCarSide, FaTruck } from 'react-icons/fa6';
import SearchableSelect from '../../../../components/SearchableSelect';

interface PosCartSidebarProps {
  cart: any[];
  customers: any[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  setShowAddCustomerModal: (show: boolean) => void;
  removeFromCart: (id: string) => void;
  toggleItemFulfillment: (id: string) => void;
  updateCartItemLocation: (id: string, locationId: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, qty: string | number) => void;
  cartTotal: number;
  formatRupiah: (number: number) => string;
  stocks: any[];
  onTriggerNotification: (msg: string) => void;
  accounts: any[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  setAmountPaid: (amount: string) => void;
  setShowCheckoutModal: (show: boolean) => void;
}

export default function PosCartSidebar({
  cart,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  setShowAddCustomerModal,
  removeFromCart,
  toggleItemFulfillment,
  updateCartItemLocation,
  updateQuantity,
  setQuantity,
  cartTotal,
  formatRupiah,
  stocks,
  onTriggerNotification,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  setAmountPaid,
  setShowCheckoutModal
}: PosCartSidebarProps) {
  return (
    <div className="w-[400px] flex flex-col bg-white shrink-0 z-30 shadow-2xl border-l border-slate-200">
      <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center gap-3">
        <ShoppingCart size={20} />
        <h2 className="font-bold tracking-wide">Struk Belanja</h2>
      </div>

      <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
            <User size={12} /> Pelanggan
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                placeholder="-- Pilih Pelanggan --"
                options={customers.map(c => ({ value: c.id, label: c.name || (c as any).company_name }))}
              />
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-emerald-200"
              title="Tambah Pelanggan Baru"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ShoppingCart size={40} className="mb-3 text-slate-300" />
            <p className="text-sm">Belum ada barang.</p>
          </div>
        ) : (
          cart.map(item => {
            const price = parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0');
            const itemStocks = stocks.filter(s => s.product_id === item.product.id && parseFloat(s.quantity) > 0);

            return (
              <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative group">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-sm mb-1">{item.product.name}</div>
                  <div className="text-emerald-600 font-semibold text-sm">{formatRupiah(price)}</div>

                  <button
                    onClick={() => toggleItemFulfillment(item.id)}
                    className="mt-1 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    {item.fulfillment_type === 'take_away' ? (
                      <><FaCarSide size={12} className="text-emerald-600" /> Bawa Sendiri</>
                    ) : (
                      <><FaTruck size={12} className="text-indigo-500" /> Diantar</>
                    )}
                  </button>

                  <div className="mt-2">
                    <select
                      value={item.location_id}
                      onChange={(e) => updateCartItemLocation(item.id, e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-[10px] bg-slate-50 text-slate-700 outline-none focus:border-emerald-400"
                    >
                      <option value="">-- Pilih Gudang --</option>
                      {itemStocks.map(s => (
                        <option key={s.location_id} value={s.location_id}>
                          {s.location?.warehouse?.name ? s.location.warehouse.name + ' - ' : ''}{s.location?.name} (Stok: {parseFloat(s.quantity)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-rose-600"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => setQuantity(item.id, e.target.value)}
                      onBlur={() => {
                        if (item.quantity === 0) setQuantity(item.id, 1);
                      }}
                      className="w-12 text-center text-sm font-bold bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded hide-arrows"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-emerald-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-500 font-bold">Total Pembayaran</span>
          <span className="text-2xl font-black text-slate-900">{formatRupiah(cartTotal)}</span>
        </div>
        <button
          onClick={() => {
            if (!selectedCustomerId || cart.length === 0) {
              onTriggerNotification('Mohon lengkapi data pelanggan dan keranjang.');
              return;
            }
            if (cart.some(item => !item.location_id)) {
              onTriggerNotification('Mohon pilih gudang untuk setiap barang di keranjang.');
              return;
            }
            if (accounts.length > 0 && !selectedAccountId) {
              // Auto-select first account if not selected
              setSelectedAccountId(accounts[0].id);
            }
            setAmountPaid(cartTotal.toString());
            setShowCheckoutModal(true);
          }}
          disabled={cart.length === 0}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <CheckCircle2 size={24} className="drop-shadow-sm" />
          BAYAR SEKARANG
        </button>
      </div>
    </div>
  );
}
