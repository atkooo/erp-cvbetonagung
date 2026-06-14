import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CheckCircle2, User, MapPin } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { salesApi } from '../api';
import type { Product, Customer } from '../../../types';
import { toApiDate } from '../../../utils/date';

interface PosViewProps {
  onTriggerNotification: (message: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosView({ onTriggerNotification }: PosViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, locRes] = await Promise.all([
          apiClient.get<{ data: any[] }>('/master/products?per_page=100'), // Fallback to raw fetch if needed
          apiClient.get<{ data: any[] }>('/master/customers?per_page=100'),
          apiClient.get<{ data: any[] }>('/master-data/storage-locations?per_page=100').catch(() =>
            apiClient.get<{ data: any[] }>('/master-data/warehouses') // Fallback if locations is not available
          ),
        ]);

        // Normalize products (from /master/products or /master-data/products)
        setProducts(prodRes.data || []);
        setCustomers(custRes.data || []);

        const locs = locRes.data || [];
        setLocations(locs);

        // Auto-select first location if available
        if (locs.length > 0) {
          setSelectedLocationId(locs[0].id);
        }

      } catch (error) {
        console.error('Error fetching POS data:', error);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0');
      return total + (price * item.quantity);
    }, 0);
  }, [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      onTriggerNotification('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    if (!selectedLocationId) {
      onTriggerNotification('Silakan pilih lokasi gudang.');
      return;
    }
    if (cart.length === 0) {
      onTriggerNotification('Keranjang masih kosong.');
      return;
    }

    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < cartTotal) {
      onTriggerNotification('Jumlah bayar kurang dari total belanja.');
      return;
    }

    setIsProcessing(true);
    try {
      await salesApi.processPos({
        customer_id: selectedCustomerId,
        location_id: selectedLocationId,
        transaction_date: toApiDate(),
        notes: notes,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0'),
          description: item.product.name,
        })),
        handled_by: 'Kasir POS'
      });

      onTriggerNotification('Transaksi berhasil diproses!');

      // Reset POS
      setCart([]);
      setAmountPaid('');
      setNotes('');
      setShowCheckoutModal(false);

    } catch (error: any) {
      onTriggerNotification(error.message || 'Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const [isKioskMode, setIsKioskMode] = useState(false);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className={`flex bg-slate-100 overflow-hidden transition-all duration-300 ${isKioskMode ? 'fixed inset-0 z-[100] m-0 rounded-none h-screen' : 'h-[calc(100vh-120px)] -m-6 rounded-lg border border-slate-200'}`}>

      {/* LEFT PANEL: PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Katalog Produk</h2>
              <p className="text-xs text-slate-500">Pilih produk untuk ditambahkan ke keranjang</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              />
            </div>
            <button
              onClick={() => setIsKioskMode(!isKioskMode)}
              className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              title={isKioskMode ? 'Keluar Mode Kiosk' : 'Mode Kiosk (Layar Penuh)'}
            >
              {isKioskMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const price = parseFloat(product.sellingPrice?.toString() || (product as any).selling_price?.toString() || '0');
              const inCart = cart.find(c => c.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer transition-all border-2 ${inCart ? 'border-emerald-500 shadow-md transform scale-[0.98]' : 'border-transparent hover:border-slate-300 shadow-sm hover:shadow-md'} relative flex flex-col justify-between min-h-[140px]`}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                      {inCart.quantity}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 mb-1">{product.sku || 'NO-SKU'}</div>
                    <div className="font-bold text-slate-700 leading-tight line-clamp-2">{product.name}</div>
                  </div>
                  <div className="mt-3">
                    <div className="text-emerald-600 font-black">{formatRupiah(price)}</div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                <Package size={48} className="mb-4 text-slate-300" />
                <p>Tidak ada produk ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: CART */}
      <div className="w-[400px] flex flex-col bg-white shrink-0 z-20 shadow-xl">
        <div className="p-4 bg-slate-900 text-white flex items-center gap-3">
          <ShoppingCart size={20} />
          <h2 className="font-bold tracking-wide">Struk Belanja</h2>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <User size={12} /> Pelanggan
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name || (c as any).company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <MapPin size={12} /> Lokasi Gudang (Pengeluaran Stok)
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">-- Pilih Gudang --</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
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
              return (
                <div key={item.product.id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm relative group">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-sm mb-1">{item.product.name}</div>
                    <div className="text-emerald-600 font-semibold text-sm">{formatRupiah(price)}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-rose-600"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
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
              if (!selectedCustomerId || !selectedLocationId || cart.length === 0) {
                onTriggerNotification('Mohon lengkapi data pelanggan, gudang, dan keranjang.');
                return;
              }
              setAmountPaid(cartTotal.toString());
              setShowCheckoutModal(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={24} />
            BAYAR SEKARANG
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Pembayaran</h3>
              <p className="text-slate-500 mt-1">Total Tagihan: <span className="font-bold text-emerald-600">{formatRupiah(cartTotal)}</span></p>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Jumlah Diterima (Rp)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full text-2xl font-bold p-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors text-right"
                  placeholder="0"
                />
                {parseFloat(amountPaid || '0') >= cartTotal && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-slate-500">Kembalian: </span>
                    <span className="font-bold text-rose-500">{formatRupiah(parseFloat(amountPaid || '0') - cartTotal)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Catatan Transaksi</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-slate-200 rounded-lg"
                  placeholder="Contoh: Tunai, transfer bank, dll..."
                />
              </div>
            </div>

            <div className="p-4 flex gap-3 bg-white">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing || parseFloat(amountPaid || '0') < cartTotal}
                className="flex-[2] px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Selesaikan Transaksi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
