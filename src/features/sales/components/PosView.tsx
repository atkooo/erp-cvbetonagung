import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CheckCircle2, User, MapPin } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { salesApi } from '../api';
import type { Product, Customer } from '../../../types';
import { toApiDate } from '../../../utils/date';
import { customersApi } from '../../customers/api';
import SearchableSelect from '../../../components/SearchableSelect';

interface PosViewProps {
  onTriggerNotification: (message: string) => void;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  location_id: string;
}

export default function PosView({ onTriggerNotification }: PosViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  
  const [stocks, setStocks] = useState<any[]>([]);

  // Add Customer State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, locRes, stockRes, catRes] = await Promise.all([
          apiClient.get<{ data: any[] }>('/master/products?per_page=100'),
          apiClient.get<{ data: any[] }>('/master/customers?per_page=100'),
          apiClient.get<{ data: any[] }>('/master-data/storage-locations?per_page=100').catch(() =>
            apiClient.get<{ data: any[] }>('/master-data/warehouses')
          ),
          apiClient.get<{ data: any[] }>('/inventory/stocks?per_page=1000').catch(() => ({ data: [] })),
          apiClient.get<{ data: any[] }>('/master-data/product-categories?per_page=100').catch(() => ({ data: [] })),
        ]);

        setCategories(catRes.data || []);

        setStocks(stockRes.data || []);

        // Normalize products (from /master/products or /master-data/products)
        const allProducts = prodRes.data || [];
        setProducts(allProducts.filter((p: any) => p.type === 'finished_good' && p.status === 'active' && !Number(p.is_customizable)));
        setCustomers(custRes.data || []);

        const locs = locRes.data || [];
        setLocations(locs);

        // Auto-select first location if available (removed because location is now per-item)

      } catch (error) {
        console.error('Error fetching POS data:', error);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const pAny = p as any;
      const matchCategory = selectedCategoryId ? pAny.category_id === selectedCategoryId || pAny.category?.id === selectedCategoryId : true;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0');
      return total + (price * item.quantity);
    }, 0);
  }, [cart]);

  const addToCart = (product: any) => {
    const productStocks = stocks.filter(s => s.product_id === product.id && parseFloat(s.quantity) > 0);
    const defaultLocationId = productStocks.length > 0 
      ? productStocks.sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity))[0].location_id 
      : (locations[0]?.id || '');

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.location_id === defaultLocationId);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.location_id === defaultLocationId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: `${product.id}-${defaultLocationId}-${Date.now()}`,
        product, 
        quantity: 1,
        location_id: defaultLocationId
      }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };
  
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      onTriggerNotification('Nama pelanggan wajib diisi.');
      return;
    }
    setIsAddingCustomer(true);
    try {
      const code = `CUST-POS-${Date.now().toString().slice(-6)}`;
      const newCustomer = await customersApi.createCustomer({
        code,
        name: newCustomerName,
        phone: newCustomerPhone,
        email: '',
        city: '',
        address: newCustomerAddress,
        status: 'Aktif'
      });
      setCustomers(prev => [...prev, newCustomer]);
      setSelectedCustomerId(newCustomer.id);
      
      // Reset and close
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      onTriggerNotification('Pelanggan berhasil ditambahkan!');
    } catch (error: any) {
      onTriggerNotification(error.message || 'Gagal menambahkan pelanggan.');
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const updateCartItemLocation = (cartItemId: string, newLocationId: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        return { ...item, location_id: newLocationId };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      onTriggerNotification('Silakan pilih pelanggan terlebih dahulu.');
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
        transaction_date: toApiDate(),
        notes: notes,
        items: cart.map(item => ({
          product_id: item.product.id,
          location_id: item.location_id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0'),
          description: item.product.name,
        })),
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
      <div className="flex-1 flex flex-col bg-slate-50/50 border-r border-slate-200 relative">
        <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm flex items-center justify-between z-20 sticky top-0">
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
            <div className="w-48">
              <SearchableSelect
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={[{ value: '', label: 'Semua Kategori' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                placeholder="Pilih Kategori"
              />
            </div>
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

              const productStocks = stocks.filter(s => s.product_id === product.id && parseFloat(s.quantity) > 0);
              const totalStock = productStocks.reduce((sum, s) => sum + parseFloat(s.quantity), 0);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 border-2 ${inCart ? 'border-emerald-500 shadow-md transform scale-[0.98]' : 'border-transparent hover:border-emerald-200 shadow-sm'} relative flex flex-col justify-between min-h-[140px]`}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                      {inCart.quantity}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 mb-1">{product.sku || 'NO-SKU'}</div>
                    <div className="font-bold text-slate-700 leading-tight line-clamp-2">{product.name}</div>
                    
                    <div className="text-[11px] mt-1.5 text-slate-500">
                      <span className={totalStock > 0 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                        {totalStock > 0 ? `Stok: ${totalStock}` : 'Stok Habis'}
                      </span>
                      {productStocks.length > 0 && (
                        <div className="text-[9px] mt-0.5 text-slate-400 leading-tight">
                          {productStocks.map(s => `${s.location?.warehouse?.name ? s.location.warehouse.name + ' - ' : ''}${s.location?.name}: ${parseFloat(s.quantity)}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div className="bg-emerald-50 px-2 py-1 rounded-lg">
                      <div className="text-emerald-700 font-black text-sm">{formatRupiah(price)}</div>
                    </div>
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
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
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

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Tambah Pelanggan Baru</h3>
              <p className="text-sm text-slate-500 mt-1">Tambahkan pelanggan langsung tanpa keluar dari POS.</p>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nama Pelanggan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full border-slate-200 rounded-lg p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">No. Handphone</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full border-slate-200 rounded-lg p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Contoh: 08123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Alamat Lengkap</label>
                <textarea
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full border-slate-200 rounded-lg p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Alamat pelanggan..."
                  rows={3}
                />
              </div>
            </div>

            <div className="p-4 flex gap-3 bg-white border-t border-slate-100">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isAddingCustomer}
              >
                Batal
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={isAddingCustomer || !newCustomerName.trim()}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAddingCustomer ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
