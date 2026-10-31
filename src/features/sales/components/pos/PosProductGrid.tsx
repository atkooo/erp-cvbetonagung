import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchableSelect from '../../../../components/SearchableSelect';
import { getFileUrl } from '../../../../services/api';

interface PosProductGridProps {
  categories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: any[];
  stocks: any[];
  cart: any[];
  addToCart: (product: any) => void;
  formatRupiah: (number: number) => string;
  isKioskMode?: boolean;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export default function PosProductGrid({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  searchQuery,
  setSearchQuery,
  filteredProducts,
  stocks,
  cart,
  addToCart,
  formatRupiah,
  isKioskMode = false,
}: PosProductGridProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // O(1) Pre-calculated Stock Map untuk performa maksimal ("biar ga berat")
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stocks) {
      const qty = parseFloat(s.quantity) || 0;
      if (qty > 0 && s.product_id) {
        map.set(s.product_id, (map.get(s.product_id) || 0) + qty);
      }
    }
    return map;
  }, [stocks]);

  const getProductStock = (product: any): number => {
    const physical = stockMap.get(product.id) || 0;
    const booked = Number(product.bookedStock || product.booked_stock || 0);
    return Math.max(0, physical - booked);
  };

  // Filter & Urutan: Produk stok available (> 0) DI ATAS, stok kosong (<= 0) DI BAWAH
  const sortedAndFilteredProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const stockA = getProductStock(a);
      const stockB = getProductStock(b);

      const hasA = stockA > 0 ? 1 : 0;
      const hasB = stockB > 0 ? 1 : 0;

      // 1. Yang ada stok (available) selalu di atas
      if (hasA !== hasB) {
        return hasB - hasA;
      }

      // 2. Jika sama-sama ada stok, urutkan dari stok terbanyak
      if (stockA > 0 && stockB > 0 && stockA !== stockB) {
        return stockB - stockA;
      }

      // 3. Fallback: urutkan alfabetis nama produk
      return (a.name || '').localeCompare(b.name || '', 'id');
    });
  }, [filteredProducts, stockMap]);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId]);

  // Total stok ready untuk badge ringkasan
  const readyCount = useMemo(() => {
    return filteredProducts.filter(p => getProductStock(p) > 0).length;
  }, [filteredProducts, stockMap]);

  // Kalkulasi Pagination
  const totalItems = sortedAndFilteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = sortedAndFilteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm z-20 sticky top-[73px]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-60 shrink-0">
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
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Product Grid Container */}
      <div ref={gridContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
        <div className={`grid gap-4 ${isKioskMode ? 'grid-cols-4' : 'grid-cols-2 xl:grid-cols-3'}`}>
          {paginatedProducts.map((product) => {
            const price = parseFloat(product.sellingPrice?.toString() || (product as any).selling_price?.toString() || '0');
            const hasActiveDiscount = product.discount && (product.discount.is_active === true || product.discount.is_active === 1);
            const discountType = hasActiveDiscount ? product.discount.type : null;
            const discountValue = hasActiveDiscount ? product.discount.value : 0;
            
            let discountAmount = 0;
            if (discountType === 'percentage') {
              discountAmount = price * (parseFloat(discountValue) / 100);
            } else if (discountType === 'nominal') {
              discountAmount = parseFloat(discountValue);
            }
            const finalPrice = Math.max(0, price - discountAmount);
            
            const inCart = cart.find(c => c.product.id === product.id);
            const rawImageUrl = (product as any).image_url || product.imageUrl || null;
            const imageUrl: string | null = getFileUrl(rawImageUrl);

            const totalStock = getProductStock(product);

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-white rounded-2xl cursor-pointer transition-all duration-200 border-2 overflow-hidden ${
                  inCart
                    ? 'border-sky-500 shadow-md ring-2 ring-sky-100 scale-[0.98]'
                    : 'border-slate-100 hover:border-sky-300 shadow-2xs hover:shadow-sm'
                } relative flex flex-col`}
              >
                {/* Badge jumlah di keranjang */}
                {inCart && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xs z-10 font-mono">
                    {inCart.quantity}
                  </div>
                )}

                {/* Gambar produk */}
                <div className={`relative w-full bg-slate-100 shrink-0 h-40`}>
                  {discountAmount > 0 && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm z-10">
                      {discountType === 'percentage' ? `Disc ${parseFloat(discountValue)}%` : `Disc ${formatRupiah(parseFloat(discountValue))}`}
                    </div>
                  )}
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {/* Tombol zoom — klik tanpa trigger addToCart */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxUrl(imageUrl);
                        }}
                        className="absolute bottom-1.5 right-1.5 p-1 bg-black/40 hover:bg-black/70 text-white rounded-lg transition-colors backdrop-blur-sm cursor-pointer"
                        title="Lihat gambar penuh"
                      >
                        <ZoomIn size={13} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package size={36} />
                    </div>
                  )}
                </div>

                {/* Info produk */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 mb-0.5">{product.sku || 'NO-SKU'}</div>
                    <div className="font-bold text-slate-700 leading-tight text-sm line-clamp-2">
                      {product.name}
                      {Number((product as any).is_customizable) ? <span className="ml-1.5 inline-block bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">PO</span> : null}
                    </div>

                    <div className="text-[11px] mt-1.5 text-slate-500">
                      {Number((product as any).is_customizable) ? (
                        <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold">
                          Barang Inden / PO
                        </span>
                      ) : totalStock > 0 ? (
                        <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-semibold">
                          Ready: {totalStock}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md font-semibold">
                          Stok Habis (Inden)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-xl self-start">
                    {discountAmount > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-[10px] line-through leading-none mb-1 font-mono">{formatRupiah(price)}</span>
                        <span className="text-sky-800 font-black text-sm leading-none font-mono">{formatRupiah(finalPrice)}</span>
                      </div>
                    ) : (
                      <div className="text-sky-800 font-black text-sm font-mono">{formatRupiah(price)}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {paginatedProducts.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
              <Package size={48} className="mb-4 text-slate-300" />
              <p className="font-semibold text-slate-600">Tidak ada produk ditemukan.</p>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="mt-6 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs bg-white/70 backdrop-blur-xs rounded-xl px-2 py-2">
            <div className="text-slate-500 font-medium flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-slate-800">{startIndex + 1}–{endIndex}</strong> dari <strong className="text-slate-800">{totalItems}</strong> produk
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] font-semibold">
                {readyCount} Ready
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Selector Baris per Halaman */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Per hal:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:border-sky-500 outline-none cursor-pointer"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              {/* Tombol Halaman */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>

                {getPageNumbers(safeCurrentPage, totalPages).map((pageNum, idx) => {
                  if (pageNum === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                        …
                      </span>
                    );
                  }
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(Number(pageNum))}
                      className={`min-w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-600 text-white shadow-xs font-bold'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview Produk"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
