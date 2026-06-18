import React from 'react';
import { Search, Package } from 'lucide-react';
import SearchableSelect from '../../../../components/SearchableSelect';

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
  formatRupiah
}: PosProductGridProps) {
  return (
    <>
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

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const price = parseFloat(product.sellingPrice?.toString() || (product as any).selling_price?.toString() || '0');
            const inCart = cart.find(c => c.product.id === product.id);

            const productStocks = stocks.filter(s => s.product_id === product.id && parseFloat(s.quantity) > 0);
            const physicalStock = productStocks.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
            const bookedStock = Number(product.bookedStock || (product as any).booked_stock || 0);
            const totalStock = Math.max(0, physicalStock - bookedStock);

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
                      <div className="flex flex-col">
                        <span className={totalStock > 0 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                          {totalStock > 0 ? `Tersedia: ${totalStock}` : 'Stok Habis'}
                        </span>
                        <span className="text-slate-400">
                          (Fisik: {physicalStock}, Dipesan: {bookedStock})
                        </span>
                      </div>
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
    </>
  );
}
