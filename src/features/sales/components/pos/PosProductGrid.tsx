import React, { useState } from 'react';
import { Search, Package, X, ZoomIn } from 'lucide-react';
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

  return (
    <>
      {/* Filter Bar */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm z-20 sticky top-[73px]">
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

      {/* Product Grid — 2 kolom saja, lebih besar dan nyaman */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`grid gap-4 ${isKioskMode ? 'grid-cols-4' : 'grid-cols-2 xl:grid-cols-3'}`}>
          {filteredProducts.map((product) => {
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

            const productStocks = stocks.filter(s => s.product_id === product.id && parseFloat(s.quantity) > 0);
            const physicalStock = productStocks.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
            const bookedStock = Number(product.bookedStock || (product as any).booked_stock || 0);
            const totalStock = Math.max(0, physicalStock - bookedStock);

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-white rounded-2xl cursor-pointer transition-all duration-200 border-2 overflow-hidden ${inCart ? 'border-emerald-500 shadow-md scale-[0.98]' : 'border-transparent hover:border-emerald-200 shadow-sm'} relative flex flex-col`}
              >
                {/* Badge jumlah di keranjang */}
                {inCart && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow z-10">
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
                        className="absolute bottom-1.5 right-1.5 p-1 bg-black/40 hover:bg-black/70 text-white rounded-lg transition-colors backdrop-blur-sm"
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
                        <span className="text-amber-600 font-bold">Barang Inden / PO</span>
                      ) : (
                        <span className={totalStock > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {totalStock > 0 ? `Stok: ${totalStock}` : 'Stok Habis'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-50 px-2 py-1 rounded-lg self-start">
                    {discountAmount > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-[10px] line-through leading-none mb-1">{formatRupiah(price)}</span>
                        <span className="text-emerald-700 font-black text-sm leading-none">{formatRupiah(finalPrice)}</span>
                      </div>
                    ) : (
                      <div className="text-emerald-700 font-black text-sm">{formatRupiah(price)}</div>
                    )}
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
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
