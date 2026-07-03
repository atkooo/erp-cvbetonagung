/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  X,
  Tag,
  Camera,
  ImageOff,
  Image,
} from "@/src/components/icons";
import { Product, Category, Discount } from "../types";
import { DEFAULT_UNITS, productsApi } from "../features/products/api";
import { UnitDto, ProductFormData } from "../features/products/types";
import { inventoryApi } from "../features/inventory/api";
import { apiClient } from "../services/api";
import { SkeletonTable, ErrorCard } from "./Skeleton";
import CurrencyInput from "./CurrencyInput";
import Swal from "sweetalert2";
import CameraCaptureModal from "./CameraCaptureModal";

interface ProductsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function ProductsView({
  onTriggerNotification,
}: ProductsViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New product states
  const [businessUnit, setBusinessUnit] = useState("CV Beton Agung");
  const [sku, setSku] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<
    "raw_material" | "finished_good" | "service"
  >("finished_good");
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [pricingMethod, setPricingMethod] = useState<
    "per_item" | "per_dimension"
  >("per_item");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("Gudang Utama");
  const [minStock, setMinStock] = useState(10);
  const [discountId, setDiscountId] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleUnits = units.length > 0 ? units : DEFAULT_UNITS;
  const filteredUnits = visibleUnits.filter(
    (u) => !u.type || u.type === "both" || u.type === type,
  );

  const fetchData = () => {
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      productsApi.getProducts(),
      productsApi.getCategories(),
      productsApi.getUnits(),
      inventoryApi.getProductStocks(),
      apiClient.get<{ data: any[] }>("/master-data/storage-locations"),
      apiClient.get<{ data: Discount[] }>("/master-data/discounts"),
    ])
      .then(([productsData, catsData, unitsData, stockData, locRes, discRes]) => {
        const productsWithStock = productsData.map((product) => {
          const productStocks = stockData.filter(
            (stockRow) =>
              stockRow.product_id === product.id ||
              stockRow.product?.sku === product.sku,
          );
          const totalStock = productStocks.reduce(
            (sum, stockRow) => sum + Number(stockRow.quantity || 0),
            0,
          );
          const locationNames = Array.from(
            new Set(
              productStocks
                .filter((stockRow) => Number(stockRow.quantity || 0) > 0)
                .map((stockRow) => stockRow.location?.name)
                .filter(Boolean),
            ),
          );
          const stockStatus: Product["status"] =
            totalStock <= 0
              ? "Habis"
              : totalStock <= product.minStock
                ? "Menipis"
                : "Aman";

          return {
            ...product,
            stock: totalStock,
            location:
              locationNames.length === 0
                ? "Belum ada stok"
                : locationNames.length === 1
                  ? (locationNames[0] ?? "Belum ada stok")
                  : `${locationNames.length} lokasi`,
            status: stockStatus,
          };
        });

        setProducts(productsWithStock);
        setCategories(catsData);
        setStorageLocations(locRes.data || []);
        setDiscounts(discRes.data || []);
        const nextUnits = unitsData.length > 0 ? unitsData : DEFAULT_UNITS;
        setUnits(unitsData);
        if (catsData.length > 0) {
          setCategory(catsData[0].id); // Select first category by default for new product
        }
        if (nextUnits.length > 0) {
          setUnit(nextUnits[0].id); // Select first unit by default
        }
        if (locRes.data && locRes.data.length > 0) {
          setLocation(locRes.data[0].id);
        }
      })
      .catch((err: Error) => {
        setErrorMessage(err.message);
        onTriggerNotification(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const resetForm = () => {
    setSku("");
    setQrValue("");
    setName("");
    setIsCustomizable(false);
    setPricingMethod("per_item");
    setType("finished_good");
    setCategory(categories[0]?.id || "");
    setCostPrice(0);
    setSellingPrice(0);
    setStock(0);
    const initialFilteredUnits = visibleUnits.filter(
      (u) => !u.type || u.type === "both" || u.type === "finished_good",
    );
    setUnit(initialFilteredUnits[0]?.id || visibleUnits[0]?.id || "");
    setLocation(storageLocations[0]?.id || "");
    setMinStock(10);
    setDiscountId("");
    setImageFile(null);
    setImagePreview(null);
    setIsImageDeleted(false);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setBusinessUnit(product.businessUnit || "CV Beton Agung");
    setSku(product.sku);
    setQrValue(product.qrValue && product.qrValue !== product.sku ? product.qrValue : "");
    setName(product.name);
    setIsCustomizable(product.isCustomizable || false);
    setPricingMethod(product.pricingMethod || "per_item");
    setType(product.type || "finished_good");

    const selectedCategory = categories.find(
      (cat) => cat.name === product.category,
    );
    const selectedUnit = visibleUnits.find(
      (u) =>
        u.id === product.unitId ||
        u.code === product.unit ||
        u.name === product.unit,
    );
    setCategory(selectedCategory?.id || categories[0]?.id || "");
    setCostPrice(product.costPrice);
    setSellingPrice(product.sellingPrice);
    setStock(0);

    const prodType = product.type || "finished_good";
    const initialFilteredUnits = visibleUnits.filter(
      (u) => !u.type || u.type === "both" || u.type === prodType,
    );
    setUnit(
      selectedUnit?.id ||
        initialFilteredUnits[0]?.id ||
        visibleUnits[0]?.id ||
        "",
    );
    setLocation(storageLocations[0]?.id || "");
    setMinStock(product.minStock);
    setDiscountId(product.discountId || "");
    // Show existing image as preview
    setImageFile(null);
    setImagePreview(product.imageUrl || null);
    setIsImageDeleted(false);
    setShowAddModal(true);
  };

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || prod.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      onTriggerNotification("Gagal menyimpan: Harap lengkapi nama produk!");
      return;
    }
    if (units.length === 0) {
      onTriggerNotification(
        "Gagal menyimpan: Master satuan belum tersedia. Tambahkan data satuan di backend terlebih dahulu.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload: ProductFormData = {
        business_unit: businessUnit,
        sku: sku,
        qr_value: qrValue || null,
        name,
        is_customizable: isCustomizable,
        pricing_method: pricingMethod,
        type,
        category_id: category, // The category select holds the ID
        unit_id: unit,
        cost_price: costPrice,
        selling_price: sellingPrice,
        min_stock: minStock,
        discount_id: discountId || null,
        status: "active",
      };

      if (editingProduct) {
        const updatedProduct = await productsApi.updateProduct(
          editingProduct.id,
          payload,
        );
        // Upload image if a new file was selected
        let finalImageUrl = editingProduct.imageUrl || null;
        if (imageFile) {
          setIsUploadingImage(true);
          try {
            const imgResult = await productsApi.uploadProductImage(
              editingProduct.id,
              imageFile,
            );
            finalImageUrl = imgResult.image_url;
          } finally {
            setIsUploadingImage(false);
          }
        } else if (isImageDeleted) {
          try {
            await productsApi.deleteProductImage(editingProduct.id);
            finalImageUrl = null;
          } catch (e) {
            console.error("Failed to delete image", e);
          }
        }
        setProducts((prev) =>
          prev.map((prod) => {
            if (prod.id !== editingProduct.id) {
              return prod;
            }

            const liveStock = prod.stock;
            const stockStatus: Product["status"] =
              liveStock <= 0
                ? "Habis"
                : liveStock <= updatedProduct.minStock
                  ? "Menipis"
                  : "Aman";

            return {
              ...updatedProduct,
              stock: liveStock,
              location: prod.location,
              status: stockStatus,
              imageUrl: finalImageUrl,
            };
          }),
        );
        onTriggerNotification(
          `Sukses memperbarui Produk: ${updatedProduct.name}`,
        );
      } else {
        const newProd = await productsApi.createProduct(payload);
        // Upload image if a file was selected
        let finalImageUrl: string | null = null;
        if (imageFile) {
          setIsUploadingImage(true);
          try {
            const imgResult = await productsApi.uploadProductImage(
              newProd.id,
              imageFile,
            );
            finalImageUrl = imgResult.image_url;
          } finally {
            setIsUploadingImage(false);
          }
        }
        const newProdWithImage = { ...newProd, imageUrl: finalImageUrl };
        if (stock > 0 && location) {
          await inventoryApi.updateProductStock(newProd.id, location, stock);
          // Update the list immediately to reflect new stock
          await fetchData();
        } else {
          setProducts((prev) => [newProdWithImage, ...prev]);
        }
        onTriggerNotification(`Sukses menambahkan Produk Baru: ${name}`);
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setBusinessUnit("CV Beton Agung");
      setSku("");
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan produk";
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus produk ${product.name} (${product.sku}) tidak dapat dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    onTriggerNotification(`Menghapus produk ${product.sku}...`);
    try {
      await productsApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((prod) => prod.id !== product.id));

      Swal.fire({
        title: "Terhapus!",
        text: `Produk ${product.name} berhasil dihapus.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus produk";
      Swal.fire({
        title: "Gagal!",
        text: msg,
        icon: "error",
      });
      onTriggerNotification(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan SKU atau nama produk konstruksi..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Filter size={13} className="text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-[11px] font-sans text-slate-600 bg-transparent py-1 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="All">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Main product display table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={9} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={fetchData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">
              Katalog Umum & Daftar Item Pabrik CV Beton Agung (
              {filteredProducts.length} Item)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Backend API
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-225">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Foto</th>
                  <th className="p-3.5">SKU / ID</th>
                  <th className="p-3.5">Unit Bisnis</th>
                  <th className="p-3.5">Nama Produk</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Harga Modal (COGS)</th>
                  <th className="p-3.5">Harga Jual (MSRP)</th>
                  <th className="p-3.5">Stok Saat Ini</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      Tidak ditemukan kecocokan produk untuk kata kunci
                      pencarian tersebut.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="p-3.5 pl-5">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <ImageOff size={14} className="text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {p.sku}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {p.businessUnit || "CV Beton Agung"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{p.name}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200/50">
                          <Tag size={10} className="text-slate-400" />
                          <span>{p.category}</span>
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5 capitalize">
                          {p.type?.replace("_", " ")}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {formatIDR(p.costPrice)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        {formatIDR(p.sellingPrice)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold">
                          {p.stock}{" "}
                          <span className="text-[10px] font-normal text-slate-400">
                            {p.unit}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors"
                            title="Edit Produk"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Catalog pagination summary */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
            <span>
              Menampilkan {paginatedProducts.length} dari total{" "}
              {filteredProducts.length} SKU katalog terdaftar
            </span>
            {totalPages > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  Prev
                </button>
                <span className="px-2 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  Next
                </button>
              </div>
            ) : (
              <span className="font-medium text-slate-400">
                CV Beton Agung Admin Desk
              </span>
            )}
          </div>
        </div>
      )}

      {/* Modal Add Product Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-cyan-400" />
                <h3 className="font-sans font-bold text-sm">
                  {editingProduct
                    ? "Edit SKU & Desain Produk"
                    : "Entri SKU & Desain Produk Baru"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 flex flex-col flex-1 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Kolom Kiri: Info Dasar & Harga */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Unit Bisnis / Perusahaan *
                      </label>
                      <select
                        required
                        value={businessUnit}
                        onChange={(e) => setBusinessUnit(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
                      >
                        <option value="CV Beton Agung">CV Beton Agung</option>
                        <option value="Griya Flora">Griya Flora</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Nomor SKU (AUTO GENERATED)
                      </label>
                      <input
                        type="text"
                        value={sku}
                        readOnly
                        disabled
                        placeholder="AUTO GENERATED"
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg text-xs font-mono focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Kategori Konstruksi
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-medium"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Barcode / QR Value (Opsional)
                      </label>
                      <input
                        type="text"
                        value={qrValue}
                        onChange={(e) => setQrValue(e.target.value)}
                        placeholder="Scan barcode pabrik..."
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Tipe Produk
                      </label>
                      <select
                        value={type}
                        onChange={(e) => {
                          const newType = e.target.value as any;
                          setType(newType);
                          const newFilteredUnits = visibleUnits.filter(
                            (u) =>
                              !u.type || u.type === "both" || u.type === newType,
                          );
                          if (
                            newFilteredUnits.length > 0 &&
                            !newFilteredUnits.find((u) => u.id === unit)
                          ) {
                            setUnit(newFilteredUnits[0].id);
                          } else if (newFilteredUnits.length === 0) {
                            setUnit("");
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-medium"
                      >
                        <option value="raw_material">Raw Material (Bahan Baku)</option>
                        <option value="finished_good">Finished Good (Barang Jadi)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Deskripsi / Nama Varian Item
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kubah GRC / Tiang Serut"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Harga Pokok Modal
                      </label>
                      <CurrencyInput
                        value={costPrice || ""}
                        onValueChange={(val) => setCostPrice(Number(val))}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Harga Jual Pasar (Rp)
                      </label>
                      <CurrencyInput
                        required
                        value={sellingPrice || ""}
                        onValueChange={(val) => setSellingPrice(Number(val))}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Pengaturan Khusus, Satuan, & Foto */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={isCustomizable}
                          onChange={(e) => setIsCustomizable(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-indigo-900 uppercase">
                          Barang Bisa Di-Custom
                        </span>
                      </label>
                      <p className="text-[9px] text-indigo-600/70 ml-6 leading-tight">
                        Centang jika ukuran produk bisa dipesan khusus oleh
                        pelanggan di Sales Order.
                      </p>
                    </div>
                    {isCustomizable && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-indigo-900 uppercase">
                          Metode Hitung Tagihan
                        </label>
                        <select
                          value={pricingMethod}
                          onChange={(e) => setPricingMethod(e.target.value as any)}
                          className="w-full px-3 py-2 border border-indigo-200 bg-white focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-indigo-900"
                        >
                          <option value="per_item">Harga Per Batang / Pcs</option>
                          <option value="per_dimension">Harga Per Meter / Dimensi</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-900 uppercase">
                        Master Diskon
                      </label>
                      <select
                        value={discountId}
                        onChange={(e) => setDiscountId(e.target.value)}
                        className="w-full px-3 py-2 border border-emerald-200 bg-white focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-emerald-900"
                      >
                        <option value="">Tanpa Diskon (Pilih Diskon)</option>
                        {discounts.filter(d => d.is_active).map((discount) => (
                          <option key={discount.id} value={discount.id}>
                            {discount.name} ({discount.type === 'percentage' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Satuan
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className={`w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${filteredUnits.length === 0 ? "border-red-300 bg-red-50" : ""}`}
                        disabled={filteredUnits.length === 0}
                      >
                        {filteredUnits.length > 0 ? (
                          filteredUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.code})
                            </option>
                          ))
                        ) : (
                          <option value="">Tidak ada satuan</option>
                        )}
                      </select>
                      {filteredUnits.length === 0 ? (
                        <p className="text-[10px] text-red-600 font-semibold mt-1">
                          Belum ada master satuan yang cocok untuk tipe produk ini.
                        </p>
                      ) : units.length === 0 ? (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1">
                          Master satuan belum tersedia di database.
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Batas Minim Alaram
                      </label>
                      <input
                        type="number"
                        value={minStock || ""}
                        onChange={(e) => setMinStock(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Foto Produk (Opsional)
                    </label>
                    <div className="relative w-full h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden group">
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                              setImagePreview(null);
                              setIsImageDeleted(true);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-2 p-3">
                          <div className="flex w-full gap-2 h-full">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/50 transition-all text-slate-500 shadow-sm"
                            >
                              <Image size={20} className="text-slate-400" />
                              <span className="text-[10px] font-bold">Galeri / File</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCameraModal(true)}
                              className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/50 transition-all text-slate-500 shadow-sm"
                            >
                              <Camera size={20} className="text-slate-400" />
                              <span className="text-[10px] font-bold">Buka Kamera</span>
                            </button>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">
                            JPG, PNG, WebP · maks 2MB
                          </span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {isSubmitting || isUploadingImage
                    ? "Menyimpan..."
                    : editingProduct
                      ? "Simpan Perubahan"
                      : "Simpan SKU Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}
