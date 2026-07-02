import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CheckCircle2, User, MapPin, Maximize, Minimize, Download, Bluetooth } from 'lucide-react';
import { FaCarSide, FaTruck } from 'react-icons/fa6';
import { apiClient } from '../../../services/api';
import { salesApi } from '../api';
import type { Product, Customer } from '../../../types';
import { toApiDate } from '../../../utils/date';
import { customersApi } from '../../customers/api';
import SearchableSelect from '../../../components/SearchableSelect';
import PosProductGrid from './pos/PosProductGrid';
import PosCartSidebar from './pos/PosCartSidebar';
import { printReceipt as psPrintReceipt, downloadReceipt as psDownloadReceipt, printBluetoothReceipt as psPrintBluetoothReceipt } from './pos/PosPrintService';

interface PosViewProps {
  onTriggerNotification: (message: string) => void;
}

interface CartItem {
  id: string;
  product: any;
  quantity: number;
  location_id: string;
  fulfillment_type: 'take_away' | 'delivery';
  discount_amount?: number;
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
  
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage'|'nominal'>('nominal');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<string>('');

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
        setStocks(stockRes.data || []);
        setAccounts(accRes.data || []);

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
      const pAny = p as any;
      // Sembunyikan barang PO/Customizable dari POS
      if (Number(pAny.is_customizable) === 1 || pAny.is_customizable === true) return false;

      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryId ? pAny.category_id === selectedCategoryId || pAny.category?.id === selectedCategoryId : true;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const defaultPrice = parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0');
      const discount = item.discount_amount || 0;
      const subtotal = (defaultPrice * item.quantity) - discount;
      return total + Math.max(0, subtotal);
    }, 0);
  }, [cart]);

  const globalDiscountAmountComputed = useMemo(() => {
    const val = parseFloat(globalDiscountValue || '0');
    if (isNaN(val) || val < 0) return 0;
    if (globalDiscountType === 'percentage') {
      return cartTotal * (val / 100);
    }
    return Math.min(val, cartTotal);
  }, [cartTotal, globalDiscountType, globalDiscountValue]);

  const grandTotal = useMemo(() => {
    return Math.max(0, cartTotal - globalDiscountAmountComputed);
  }, [cartTotal, globalDiscountAmountComputed]);

  const addToCart = (product: any) => {
    const productStocks = stocks.filter(s => s.product_id === product.id && parseFloat(s.quantity) > 0);
    const defaultLocationId = productStocks.length > 0
      ? productStocks.sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity))[0].location_id
      : (locations[0]?.id || '');

    setCart(prev => {
      const maxStock = productStocks.find(s => s.location_id === defaultLocationId)?.quantity || 0;
      const isCustom = Number((product as any).is_customizable);

      let itemFulfillment = fulfillmentType;

      if (fulfillmentType === 'take_away') {
        if (isCustom) {
          itemFulfillment = 'delivery';
          onTriggerNotification(`Otomatis dimasukkan sebagai "Diantar" karena ini barang Custom/PO.`);
        } else {
          // Jika first time add dan stok 0
          const existing = prev.find(item => item.product.id === product.id && item.location_id === defaultLocationId && item.fulfillment_type === 'take_away');
          if (!existing && 1 > parseFloat(maxStock)) {
            itemFulfillment = 'delivery';
            onTriggerNotification(`Otomatis dimasukkan sebagai "Diantar (PO)" karena stok gudang kosong.`);
          }
        }
      }

      let baseDiscount = 0;
      if (product.discount_type === 'percentage') {
        const defaultPrice = parseFloat(product.sellingPrice?.toString() || product.selling_price?.toString() || '0');
        baseDiscount = defaultPrice * (parseFloat(product.discount_value || 0) / 100);
      } else if (product.discount_type === 'nominal') {
        baseDiscount = parseFloat(product.discount_value || 0);
      }

      const existing = prev.find(item => item.product.id === product.id && item.location_id === defaultLocationId && item.fulfillment_type === itemFulfillment);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.location_id === defaultLocationId && item.fulfillment_type === fulfillmentType
            ? { ...item, quantity: item.quantity + 1, discount_amount: baseDiscount * (item.quantity + 1) }
            : item
        );
      }
      return [...prev, {
        id: `${product.id}-${defaultLocationId}-${itemFulfillment}-${Date.now()}`,
        product,
        quantity: 1,
        location_id: defaultLocationId,
        fulfillment_type: itemFulfillment,
        discount_amount: baseDiscount * 1
      }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        
        let baseDiscount = 0;
        if (item.product.discount_type === 'percentage') {
          const defaultPrice = parseFloat(item.product.sellingPrice?.toString() || item.product.selling_price?.toString() || '0');
          baseDiscount = defaultPrice * (parseFloat(item.product.discount_value || 0) / 100);
        } else if (item.product.discount_type === 'nominal') {
          baseDiscount = parseFloat(item.product.discount_value || 0);
        }

        return { ...item, quantity: newQty, discount_amount: baseDiscount * newQty };
      }
      return item;
    }));
  };

  const setQuantity = (cartItemId: string, qtyRaw: string | number) => {
    let newQty = typeof qtyRaw === 'string' ? parseInt(qtyRaw) : qtyRaw;
    if (isNaN(newQty)) newQty = 0; // Allow temporarily empty

    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        let baseDiscount = 0;
        if (item.product.discount_type === 'percentage') {
          const defaultPrice = parseFloat(item.product.sellingPrice?.toString() || item.product.selling_price?.toString() || '0');
          baseDiscount = defaultPrice * (parseFloat(item.product.discount_value || 0) / 100);
        } else if (item.product.discount_type === 'nominal') {
          baseDiscount = parseFloat(item.product.discount_value || 0);
        }

        return { ...item, quantity: newQty, discount_amount: baseDiscount * newQty };
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
        let newQty = item.quantity;

        return { ...item, location_id: newLocationId, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleItemFulfillment = (id: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newType = item.fulfillment_type === 'take_away' ? 'delivery' : 'take_away';

        if (newType === 'take_away') {
          if (Number((item.product as any).is_customizable)) {
            onTriggerNotification(`Barang Custom/PO wajib Diantar/Indent.`);
            return item;
          }

        }

        return { ...item, fulfillment_type: newType, id: `${item.product.id}-${item.location_id}-${newType}-${Date.now()}` };
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
        amount_paid: Number(amountPaid.replace(/\D/g, '')),
        notes: notes || undefined,
        items: cart.map(item => {
          const defaultPrice = parseFloat(item.product.sellingPrice?.toString() || (item.product as any).selling_price?.toString() || '0');
          return {
            product_id: item.product.id,
            location_id: item.location_id,
            quantity: item.quantity,
            unit_price: defaultPrice,
            discount_amount: item.discount_amount,
            fulfillment_type: item.fulfillment_type,
            description: item.product.name,
          };
        }),
        global_discount_type: globalDiscountAmountComputed > 0 ? globalDiscountType : null,
        global_discount_value: parseFloat(globalDiscountValue || '0'),
        global_discount_amount: globalDiscountAmountComputed,
      });

      const txInfo = {
        orderNumber: salesOrder.orderNumber || (salesOrder as any).order_number,
        change: paid - cartTotal,
        fulfillmentType,
        customerName: customers.find(c => c.id === selectedCustomerId)?.name || 'Pelanggan',
        amountPaid: paid,
        cartTotal: cartTotal,
        grandTotal: grandTotal,
        globalDiscountAmount: globalDiscountAmountComputed,
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
    setGlobalDiscountType('nominal');
    setGlobalDiscountValue('');
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
    psPrintReceipt(infoToPrint || checkoutSuccessInfo, companyProfile, stocks, onTriggerNotification);
  };

  const downloadReceipt = async (infoToPrint?: any) => {
    psDownloadReceipt(infoToPrint || checkoutSuccessInfo, companyProfile, stocks, onTriggerNotification);
  };

  const printBluetoothReceipt = async (infoToPrint?: any) => {
    psPrintBluetoothReceipt(infoToPrint || checkoutSuccessInfo, companyProfile, stocks, onTriggerNotification);
  };

  const [isKioskMode, setIsKioskMode] = useState(false);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const hasPOItems = cart.some(item => {
    if (Number((item.product as any).is_customizable)) return true;
    const locationStock = stocks.find(s => s.product_id === item.product.id && s.location_id === item.location_id);
    const maxStock = locationStock ? parseFloat(locationStock.quantity) : 0;
    return item.quantity > maxStock;
  });

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
        </div>
        <PosProductGrid
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredProducts={filteredProducts}
          stocks={stocks}
          cart={cart}
          addToCart={addToCart}
          formatRupiah={formatRupiah}
          isKioskMode={isKioskMode}
        />
      </div>

      {/* RIGHT PANEL: CART */}
      <PosCartSidebar
        cart={cart}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        setShowAddCustomerModal={setShowAddCustomerModal}
        removeFromCart={removeFromCart}
        toggleItemFulfillment={toggleItemFulfillment}
        updateCartItemLocation={updateCartItemLocation}
        updateQuantity={updateQuantity}
        setQuantity={setQuantity}
        cartTotal={cartTotal}
        grandTotal={grandTotal}
        globalDiscountType={globalDiscountType}
        setGlobalDiscountType={setGlobalDiscountType}
        globalDiscountValue={globalDiscountValue}
        setGlobalDiscountValue={setGlobalDiscountValue}
        globalDiscountAmountComputed={globalDiscountAmountComputed}
        formatRupiah={formatRupiah}
        stocks={stocks}
        onTriggerNotification={onTriggerNotification}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        setAmountPaid={setAmountPaid}
        setShowCheckoutModal={setShowCheckoutModal}
      />

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Pembayaran</h3>
              <p className="text-slate-500 mt-1">Total Tagihan: <span className="font-bold text-emerald-600">{formatRupiah(grandTotal)}</span></p>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              {hasPOItems && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-4">
                  <strong>⚠️ Perhatian:</strong> Terdapat barang Inden/PO atau <strong>Backorder</strong> (stok kurang) di keranjang. Transaksi ini akan otomatis dialihkan menjadi <strong>Sales Order</strong> dengan sistem partial-delivery.
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
                {parseFloat(amountPaid || '0') >= grandTotal && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-slate-500">Kembalian: </span>
                    <span className="font-bold text-emerald-600">{formatRupiah(parseFloat(amountPaid || '0') - grandTotal)}</span>
                  </div>
                )}
                {parseFloat(amountPaid || '0') < grandTotal && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-slate-500">Sisa Outstanding Receivable: </span>
                    <span className="font-bold text-rose-500">{formatRupiah(grandTotal - parseFloat(amountPaid || '0'))}</span>
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
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Sisa Outstanding Receivable</p>
                  <div className="text-4xl font-black text-rose-600">
                    {formatRupiah(Math.abs(checkoutSuccessInfo.change))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 space-y-3 bg-white">
              <div className="flex gap-3">
                <button
                  onClick={() => printReceipt(checkoutSuccessInfo)}
                  className="flex-1 py-3.5 border-2 border-emerald-500 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Package size={20} />
                  Cetak Struk
                </button>
                <button
                  onClick={() => printBluetoothReceipt(checkoutSuccessInfo)}
                  className="flex-1 py-3.5 border-2 border-blue-500 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Bluetooth size={20} />
                  Bluetooth
                </button>
                <button
                  onClick={() => downloadReceipt(checkoutSuccessInfo)}
                  className="flex-1 py-3.5 border-2 border-slate-500 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download PDF
                </button>
              </div>

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
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              const info = {
                                orderNumber: tx.order_number,
                                change: 0,
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
                              downloadReceipt(info);
                            }}
                            className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                            title="Download Struk (PDF)"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const info = {
                                orderNumber: tx.order_number,
                                change: 0,
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
                              printBluetoothReceipt(info);
                            }}
                            className="px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                            title="Cetak Bluetooth"
                          >
                            <Bluetooth size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const info = {
                                orderNumber: tx.order_number,
                                change: 0,
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
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                          >
                            <Package size={16} /> Cetak
                          </button>
                        </div>
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
