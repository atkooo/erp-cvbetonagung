import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CheckCircle2, User, MapPin, Maximize, Minimize } from 'lucide-react';
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

  const [fulfillmentType, setFulfillmentType] = useState<'take_away' | 'delivery'>('take_away');
  const [checkoutSuccessInfo, setCheckoutSuccessInfo] = useState<any>(null);
  const [lastTransactionInfo, setLastTransactionInfo] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyCategory, setHistoryCategory] = useState(''); // Maps to status

  const [stocks, setStocks] = useState<any[]>([]);

  // Finance Accounts State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Add Customer State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<any>(null);

  useEffect(() => {
    import('../../../utils/companyProfile').then(({ getCompanyProfile }) => {
      setCompanyProfile(getCompanyProfile());
      const handleProfileUpdate = () => setCompanyProfile(getCompanyProfile());
      window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
      return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, locRes, stockRes, catRes, accRes] = await Promise.all([
          apiClient.get<{ data: any[] }>('/master/products?per_page=100'),
          apiClient.get<{ data: any[] }>('/master/customers?per_page=100'),
          apiClient.get<{ data: any[] }>('/master-data/storage-locations?per_page=100').catch(() =>
            apiClient.get<{ data: any[] }>('/master-data/warehouses')
          ),
          apiClient.get<{ data: any[] }>('/inventory/stocks?per_page=1000').catch(() => ({ data: [] })),
          apiClient.get<{ data: any[] }>('/master-data/product-categories?per_page=100').catch(() => ({ data: [] })),
          apiClient.get<{ data: any[] }>('/finance/accounts?per_page=100').catch(() => ({ data: [] })),
        ]);

        setCategories(catRes.data || []);
        setAccounts(accRes.data || []);

        setStocks(stockRes.data || []);

        // Normalize products (from /master/products or /master-data/products)
        const allProducts = prodRes.data || [];
        setProducts(allProducts.filter((p: any) => p.type === 'finished_good' && p.status === 'active'));
        setCustomers(custRes.data || []);

        const locs = locRes.data || [];
        setLocations(locs);

        // Load last transaction from local storage
        const savedLastTx = localStorage.getItem('pos_last_transaction');
        if (savedLastTx) {
          try {
            setLastTransactionInfo(JSON.parse(savedLastTx));
          } catch (e) {
            console.error('Failed to parse last transaction', e);
          }
        }

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
        const maxStock = productStocks.find(s => s.location_id === defaultLocationId)?.quantity || 0;
        if (!Number((product as any).is_customizable) && existing.quantity + 1 > parseFloat(maxStock)) {
          onTriggerNotification(`Stok di gudang ini tidak mencukupi. Sisa: ${parseFloat(maxStock)}`);
          return prev;
        }

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

        const locationStock = stocks.find(s => s.product_id === item.product.id && s.location_id === item.location_id);
        const maxStock = locationStock ? parseFloat(locationStock.quantity) : 0;

        if (!Number((item.product as any).is_customizable) && newQty > maxStock && delta > 0) {
          onTriggerNotification(`Gagal. Sisa stok di gudang terpilih hanya ${maxStock}`);
          return item;
        }

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
        const locationStock = stocks.find(s => s.product_id === item.product.id && s.location_id === newLocationId);
        const maxStock = locationStock ? parseFloat(locationStock.quantity) : 0;

        let newQty = item.quantity;
        if (!Number((item.product as any).is_customizable) && newQty > maxStock) {
          newQty = maxStock || 1;
          if (maxStock > 0) {
            onTriggerNotification(`Jumlah disesuaikan dengan sisa stok gudang (${maxStock})`);
          } else {
            onTriggerNotification(`Perhatian: Stok gudang ini kosong (0)`);
          }
        }

        return { ...item, location_id: newLocationId, quantity: newQty };
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
    if (isNaN(paid) || paid < 0) {
      onTriggerNotification('Jumlah bayar tidak valid.');
      return;
    }

    setIsProcessing(true);
    try {
      const salesOrder = await salesApi.processPos({
        customer_id: selectedCustomerId,
        transaction_date: toApiDate(),
        fulfillment_type: fulfillmentType,
        payment_account_id: selectedAccountId,
        amount_paid: paid,
        notes: notes,
        items: cart.map(item => ({
          product_id: item.product.id,
          location_id: item.location_id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0'),
          description: item.product.name,
        })),
      });

      const txInfo = {
        orderNumber: salesOrder.orderNumber || (salesOrder as any).order_number,
        change: paid - cartTotal,
        fulfillmentType,
        customerName: customers.find(c => c.id === selectedCustomerId)?.name || 'Pelanggan',
        amountPaid: paid,
        cartTotal: cartTotal,
        items: [...cart],
        date: toApiDate(),
      };

      // Save to localStorage so it persists across refreshes
      localStorage.setItem('pos_last_transaction', JSON.stringify(txInfo));

      // Show success modal
      setCheckoutSuccessInfo(txInfo);
      setLastTransactionInfo(txInfo);
      setShowCheckoutModal(false);

    } catch (error: any) {
      onTriggerNotification(error.message || 'Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPos = () => {
    setCart([]);
    setAmountPaid('');
    setNotes('');
    setFulfillmentType('take_away');
    setCheckoutSuccessInfo(null);
  };

  const fetchHistory = async (page = 1, search = '', startDate = '', endDate = '', category = '') => {
    setIsLoadingHistory(true);
    try {
      const qParam = search ? `&q=${encodeURIComponent(search)}` : '';
      const dateParams = (startDate && endDate) ? `&start_date=${startDate}&end_date=${endDate}` : '';
      const statusParam = category ? `&status=${category}` : '';

      const res = await apiClient.get<{ data: any[], meta: any }>(`/sales/sales-orders?source=pos&include=customer,items.product&per_page=10&sort=-created_at&page=${page}${qParam}${dateParams}${statusParam}`);
      setTransactionHistory(res.data || []);
      setHistoryTotalPages(res.meta?.last_page || 1);
      setHistoryPage(page);
    } catch (err) {
      onTriggerNotification('Gagal memuat riwayat transaksi');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const printReceipt = (infoToPrint?: any) => {
    const info = infoToPrint || checkoutSuccessInfo;
    if (!info) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      onTriggerNotification('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pembayaran - ${info.orderNumber}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 80mm; 
            margin: 0; 
            padding: 10px; 
            font-size: 12px; 
            line-height: 1.2;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 5px; }
          .mb-2 { margin-bottom: 10px; }
          .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
          .flex { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="text-center mb-2 font-bold" style="font-size: 14px;">${companyProfile?.name ? companyProfile.name.toUpperCase() : 'CV BETON AGUNG'}</div>
        <div class="text-center border-b mb-2" style="font-size: 10px;">
          ${companyProfile?.address || 'Jl. Raya Konstruksi No.123'}<br>
          Telp: ${companyProfile?.phone || '0812-3456-7890'}
        </div>
        
        <div class="mb-2" style="font-size: 10px;">
          <div class="flex"><span>No:</span> <span>${info.orderNumber}</span></div>
          <div class="flex"><span>Tgl:</span> <span>${info.date}</span></div>
          <div class="flex"><span>Kasir:</span> <span>Admin</span></div>
          <div class="flex"><span>Plg:</span> <span>${info.customerName}</span></div>
        </div>
        
        <div class="border-b"></div>
        
        <table class="mb-2" style="font-size: 11px;">
          ${info.items.map((item: any) => {
      const price = parseFloat(item.product.sellingPrice?.toString() || item.product.selling_price?.toString() || '0');
      const subtotal = price * item.quantity;
      return `
              <tr>
                <td colspan="3">${item.product.name}</td>
              </tr>
              <tr>
                <td>${item.quantity}x</td>
                <td>${new Intl.NumberFormat('id-ID').format(price)}</td>
                <td class="text-right">${new Intl.NumberFormat('id-ID').format(subtotal)}</td>
              </tr>
            `;
    }).join('')}
        </table>
        
        <div class="border-b"></div>
        
        <table class="mb-2 font-bold" style="font-size: 11px;">
          <tr>
            <td>TOTAL</td>
            <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(info.cartTotal)}</td>
          </tr>
          <tr>
            <td>BAYAR</td>
            <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(info.amountPaid)}</td>
          </tr>
          <tr>
            <td>KEMBALI</td>
            <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(info.change)}</td>
          </tr>
        </table>
        
        <div class="text-center mb-2 mt-4" style="font-size: 10px;">
          *** TERIMA KASIH ***<br>
          Barang yang sudah dibeli<br>
          tidak dapat ditukar/dikembalikan
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const [isKioskMode, setIsKioskMode] = useState(false);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const hasPOItems = cart.some(item => Number((item.product as any).is_customizable));

  return (
    <div className={`flex bg-slate-100 overflow-hidden transition-all duration-300 ${isKioskMode ? 'fixed inset-0 z-[100] m-0 rounded-none h-screen' : 'h-[calc(100vh-120px)] rounded-2xl border border-slate-200 shadow-sm'}`}>

      {/* LEFT PANEL: PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col bg-slate-50/50 border-r border-slate-200 relative">
        <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm flex flex-col gap-4 z-20 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Katalog Produk</h2>
                <p className="text-xs text-slate-500">Pilih produk untuk ditambahkan ke keranjang</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHistoryPage(1);
                  setHistorySearch('');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistoryCategory('');
                  fetchHistory(1, '', '', '', '');
                  setShowHistoryModal(true);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 border border-slate-200"
                title="Riwayat Transaksi"
              >
                <Search size={16} />
                <span className="hidden sm:inline">Riwayat</span>
              </button>
              {lastTransactionInfo && (
                <button
                  onClick={() => printReceipt(lastTransactionInfo)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 border border-slate-200"
                  title="Cetak Ulang Struk Terakhir"
                >
                  <Package size={16} />
                  <span className="hidden sm:inline">Cetak Terakhir</span>
                </button>
              )}
              <button
                onClick={() => setIsKioskMode(!isKioskMode)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-sm shadow-slate-900/20"
                title={isKioskMode ? 'Tutup Mode Penuh' : 'Mode Kasir Penuh'}
              >
                {isKioskMode ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64 shrink-0">
              <SearchableSelect
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={[{ value: '', label: 'Semua Kategori' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                placeholder="Pilih Kategori"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama produk atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    <div className="font-bold text-slate-700 leading-tight line-clamp-2">
                      {product.name}
                      {Number((product as any).is_customizable) ? <span className="ml-1.5 inline-block bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">PO</span> : null}
                    </div>

                    <div className="text-[11px] mt-1.5 text-slate-500">
                      {Number((product as any).is_customizable) ? (
                        <span className="text-amber-600 font-bold">Barang Inden / PO</span>
                      ) : (
                        <span className={totalStock > 0 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                          {totalStock > 0 ? `Stok: ${totalStock}` : 'Stok Habis'}
                        </span>
                      )}
                      {productStocks.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-1">
                          {productStocks.map(s => {
                            const locName = `${s.location?.warehouse?.name ? s.location.warehouse.name + ' - ' : ''}${s.location?.name || 'Unknown'}`;
                            return (
                              <div key={s.location_id} className="flex justify-between items-center text-[9px]">
                                <span className="text-slate-400 truncate pr-1" title={locName}>
                                  {locName}
                                </span>
                                <span className="font-bold text-slate-600 bg-slate-100 px-1 rounded shrink-0">
                                  {parseFloat(s.quantity)}
                                </span>
                              </div>
                            );
                          })}
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

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Pembayaran</h3>
              <p className="text-slate-500 mt-1">Total Tagihan: <span className="font-bold text-emerald-600">{formatRupiah(cartTotal)}</span></p>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              {hasPOItems && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-4">
                  <strong>⚠️ Perhatian:</strong> Terdapat barang Inden/PO di keranjang. Transaksi ini akan otomatis dialihkan menjadi <strong>Sales Order</strong> dengan sistem partial-delivery.
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  {hasPOItems ? 'Jumlah Diterima / DP (Rp)' : 'Jumlah Diterima (Rp)'}
                </label>
                <input
                  type="text"
                  value={amountPaid ? new Intl.NumberFormat('id-ID').format(parseFloat(amountPaid.replace(/\D/g, ''))) : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAmountPaid(val);
                  }}
                  className="w-full text-2xl font-bold p-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors text-right"
                  placeholder="0"
                />
                {parseFloat(amountPaid || '0') >= cartTotal && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-slate-500">Kembalian: </span>
                    <span className="font-bold text-emerald-600">{formatRupiah(parseFloat(amountPaid || '0') - cartTotal)}</span>
                  </div>
                )}
                {parseFloat(amountPaid || '0') < cartTotal && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-slate-500">Sisa Piutang: </span>
                    <span className="font-bold text-rose-500">{formatRupiah(cartTotal - parseFloat(amountPaid || '0'))}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Penerimaan Pembayaran (Kas/Bank)</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 bg-white font-bold text-slate-700 outline-none transition-colors"
                >
                  <option value="" disabled>-- Pilih Akun --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.code || acc.account_number || '-'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Metode Pengambilan</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFulfillmentType('take_away')}
                    className={`border-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${fulfillmentType === 'take_away' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${fulfillmentType === 'take_away' ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {fulfillmentType === 'take_away' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Bawa Sendiri</span>
                  </div>

                  <div
                    onClick={() => setFulfillmentType('delivery')}
                    className={`border-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${fulfillmentType === 'delivery' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${fulfillmentType === 'delivery' ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {fulfillmentType === 'delivery' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Kirim ke Lokasi</span>
                  </div>
                </div>
                {fulfillmentType === 'delivery' && (
                  <p className="text-[11px] text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                    *Stok fisik tidak akan dipotong langsung. Surat Jalan (Delivery Order) akan dibuat untuk ditindaklanjuti gudang.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Catatan Transaksi</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-slate-200 rounded-lg"
                  placeholder="Note"
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
                disabled={isProcessing || !amountPaid || !selectedAccountId}
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

      {/* SUCCESS MODAL */}
      {checkoutSuccessInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-center text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/20">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black">Transaksi Sukses!</h3>
                <p className="text-emerald-100 mt-1 opacity-90">{checkoutSuccessInfo.orderNumber} • {checkoutSuccessInfo.customerName}</p>
              </div>
            </div>

            <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
              {checkoutSuccessInfo.change >= 0 ? (
                <>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Kembalian</p>
                  <div className="text-4xl font-black text-slate-800">
                    {formatRupiah(checkoutSuccessInfo.change)}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Sisa Piutang</p>
                  <div className="text-4xl font-black text-rose-600">
                    {formatRupiah(Math.abs(checkoutSuccessInfo.change))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 space-y-3 bg-white">
              <button
                onClick={() => printReceipt(checkoutSuccessInfo)}
                className="w-full py-3.5 border-2 border-emerald-500 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <Package size={20} />
                Cetak Struk Pembayaran
              </button>

              {checkoutSuccessInfo.fulfillmentType === 'delivery' && (
                <button
                  onClick={() => onTriggerNotification('Mencetak Surat Jalan...')}
                  className="w-full py-3.5 border-2 border-indigo-500 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={20} />
                  Cetak Surat Jalan (DO)
                </button>
              )}

              <button
                onClick={handleResetPos}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <ShoppingCart size={20} />
                Mulai Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Riwayat Transaksi</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Cari no struk atau pelanggan..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchHistory(1, historySearch, historyStartDate, historyEndDate, historyCategory)}
                    className="w-full pl-9 pr-4 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-32 px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-200 outline-none transition-all"
                  />
                  <span className="text-slate-400 self-center">-</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-32 px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
                <select
                  value={historyCategory}
                  onChange={(e) => setHistoryCategory(e.target.value)}
                  className="px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-200 outline-none transition-all"
                >
                  <option value="">Semua Kategori</option>
                  <option value="completed">Selesai (Kasir POS)</option>
                  <option value="processing">Diproses (Reguler)</option>
                </select>
                <button
                  onClick={() => fetchHistory(1, historySearch, historyStartDate, historyEndDate, historyCategory)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-slate-500">Memuat riwayat...</div>
              ) : transactionHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Belum ada transaksi hari ini</div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-slate-800">{tx.order_number}</div>
                        <div className="text-sm text-slate-500">{tx.customer?.name || 'Pelanggan'} • {tx.order_date}</div>
                        <div className="text-xs text-slate-400 mt-1">{tx.items?.length || 0} Item</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-black text-slate-900">{formatRupiah(parseFloat(tx.total))}</div>
                        <button
                          onClick={() => {
                            // Map backend sales order to info format
                            const info = {
                              orderNumber: tx.order_number,
                              change: 0, // Not saved in SO
                              fulfillmentType: 'take_away',
                              customerName: tx.customer?.name || 'Pelanggan',
                              amountPaid: parseFloat(tx.total),
                              cartTotal: parseFloat(tx.total),
                              items: (tx.items || []).map((i: any) => ({
                                product: i.product,
                                quantity: i.quantity,
                              })),
                              date: tx.order_date,
                            };
                            printReceipt(info);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors"
                        >
                          Cetak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Halaman {historyPage} dari {historyTotalPages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={historyPage <= 1 || isLoadingHistory}
                  onClick={() => fetchHistory(historyPage - 1, historySearch, historyStartDate, historyEndDate, historyCategory)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Sebelumnnya
                </button>
                <button
                  disabled={historyPage >= historyTotalPages || isLoadingHistory}
                  onClick={() => fetchHistory(historyPage + 1, historySearch, historyStartDate, historyEndDate, historyCategory)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
