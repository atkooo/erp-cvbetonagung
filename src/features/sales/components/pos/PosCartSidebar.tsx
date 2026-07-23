import React, { useState } from 'react';
import { ShoppingCart, User, Plus, Minus, Trash2, CheckCircle2, Edit2, Car, Truck } from 'lucide-react';
import SearchableSelect from '../../../../components/SearchableSelect';
import Swal from 'sweetalert2';

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
  grandTotal: number;
  globalDiscountType: 'percentage' | 'nominal';
  setGlobalDiscountType: (type: 'percentage' | 'nominal') => void;
  globalDiscountValue: string;
  setGlobalDiscountValue: (val: string) => void;
  globalDiscountAmountComputed: number;
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
  grandTotal,
  globalDiscountType,
  setGlobalDiscountType,
  globalDiscountValue,
  setGlobalDiscountValue,
  globalDiscountAmountComputed,
  formatRupiah,
  stocks,
  onTriggerNotification,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  setAmountPaid,
  setShowCheckoutModal
}: PosCartSidebarProps) {

  const confirmRemoveItem = async (itemId: string, productName: string) => {
    const result = await Swal.fire({
      title: 'Hapus item?',
      text: `"${productName}" akan dihapus dari keranjang.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl font-bold',
        cancelButton: 'rounded-xl font-bold',
      },
    });
    if (result.isConfirmed) {
      removeFromCart(itemId);
    }
  };

  const handleDecrease = (itemId: string, productName: string, currentQty: number) => {
    if (currentQty <= 1) {
      confirmRemoveItem(itemId, productName);
    } else {
      updateQuantity(itemId, -1);
    }
  };

  return (
    <div className="w-100 flex flex-col bg-white shrink-0 z-30 shadow-2xl border-l border-slate-200">
      <div className="p-5 bg-linear-to-r from-slate-900 to-emerald-950 text-white flex items-center gap-3">
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
            const defaultPrice = parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0');
            const discountAmount = item.discount_amount || 0;
            const itemSubtotal = (defaultPrice * item.quantity) - discountAmount;
            const itemStocks = stocks.filter(s => s.product_id === item.product.id && parseFloat(s.quantity) > 0);

            return (
              <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow relative">
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-sm mb-1">{item.product.name}</div>
                  <div className="text-emerald-600 font-semibold text-sm mb-1 flex justify-between">
                    <span>{formatRupiah(defaultPrice)}</span>
                    <span className="text-slate-800 font-bold">{formatRupiah(itemSubtotal)}</span>
                  </div>

                  {(() => {
                    if (discountAmount > 0) {
                      const hasActiveDiscount = item.product.discount && (item.product.discount.is_active === true || item.product.discount.is_active === 1);
                      const discountType = hasActiveDiscount ? item.product.discount.type : null;
                      const discountValue = hasActiveDiscount ? item.product.discount.value : 0;
                      const discountLabel = discountType === 'percentage' ? `(${parseFloat(discountValue)}%)` : '';
                      return (
                        <div className="text-rose-500 text-xs font-semibold mb-1 text-right">
                          Diskon {discountLabel}: -{formatRupiah(discountAmount)}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <button
                    onClick={() => toggleItemFulfillment(item.id)}
                    className="mt-1 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    {item.fulfillment_type === 'take_away' ? (
                      <><Car size={16} className="text-emerald-600" /> Bawa Sendiri</>
                    ) : (
                      <><Truck size={16} className="text-indigo-500" /> Diantar</>
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
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => handleDecrease(item.id, item.product.name, item.quantity)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-rose-600 active:bg-rose-50 transition-colors"
                      title={item.quantity === 1 ? 'Hapus item' : 'Kurangi'}
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
                      className="w-10 text-center text-sm font-bold bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded hide-arrows"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-emerald-600 active:bg-emerald-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {/* Tombol hapus selalu visible — tidak pakai hover, aman di touch device */}
                  <button
                    onClick={() => confirmRemoveItem(item.id, item.product.name)}
                    className="mt-2 w-7 h-7 flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 active:bg-rose-200 rounded-lg transition-colors"
                    title="Hapus item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Subtotal</span>
            <span className="font-semibold text-slate-700">{formatRupiah(cartTotal)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
              <span>Diskon Transaksi</span>
            </label>
            <div className="flex gap-2">
              <select
                value={globalDiscountType}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  setGlobalDiscountType(newType);
                  if (newType === 'percentage' && Number(globalDiscountValue) > 100) {
                    setGlobalDiscountValue('100');
                  } else if (newType === 'nominal' && Number(globalDiscountValue) > cartTotal) {
                    setGlobalDiscountValue(cartTotal.toString());
                  }
                }}
                className="w-20 bg-slate-50 border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500"
              >
                <option value="nominal">Rp</option>
                <option value="percentage">%</option>
              </select>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={globalDiscountValue}
                onChange={(e) => {
                  let val = e.target.value;
                  if (globalDiscountType === 'percentage' && Number(val) > 100) {
                    val = '100';
                  } else if (globalDiscountType === 'nominal' && Number(val) > cartTotal) {
                    val = cartTotal.toString();
                  }
                  setGlobalDiscountValue(val);
                }}
                className="flex-1 bg-white border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-right"
              />
            </div>
            {globalDiscountAmountComputed > 0 && (
              <div className="text-right text-rose-500 text-xs font-semibold mt-0.5">
                -{formatRupiah(globalDiscountAmountComputed)}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-bold">Grand Total</span>
            <span className="text-2xl font-black text-slate-900">{formatRupiah(grandTotal)}</span>
          </div>
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
            setAmountPaid(grandTotal.toString());
            setShowCheckoutModal(true);
          }}
          disabled={cart.length === 0}
          className="w-full py-4 bg-linear-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <CheckCircle2 size={24} className="drop-shadow-sm" />
          BAYAR SEKARANG
        </button>
      </div>
    </div>
  );
}
