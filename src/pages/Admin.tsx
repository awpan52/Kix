import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Product, Category } from '../types/product';
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  importMockProducts,
  hasProductsInFirestore,
  removeProductFields,
} from '../services/productService';
import { Toast } from '../components/common';

const STANDARD_SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
const KIDS_SIZES = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

interface ProductFormData {
  name: string;
  brand: string;
  price: string;
  originalPrice: string;
  category: Category;
  description: string;
  imageUrl: string;
  onSale: boolean;
  discountPercent: string;
  isNewArrival: boolean;
  sizes: number[];
  features: string;
}

const initialFormData: ProductFormData = {
  name: '',
  brand: 'Nike',
  price: '',
  originalPrice: '',
  category: 'mens',
  description: '',
  imageUrl: '',
  onSale: false,
  discountPercent: '',
  isNewArrival: false,
  sizes: [],
  features: '',
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [hasFirestoreProducts, setHasFirestoreProducts] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [productsData, hasProducts] = await Promise.all([
          getAllProducts(),
          hasProductsInFirestore(),
        ]);
        setProducts(productsData);
        setHasFirestoreProducts(hasProducts);
      } catch (error) {
        console.error('[Admin] Error loading products:', error);
        setToast({ message: 'Failed to load products', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      loadProducts();
    }
  }, [isAdmin]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSizeToggle = (size: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size].sort((a, b) => a - b),
    }));
  };

  const handleSelectAllSizes = () => {
    const allSizes = formData.category === 'kids' ? KIDS_SIZES : STANDARD_SIZES;
    setFormData((prev) => ({ ...prev, sizes: allSizes }));
  };

  const handleClearSizes = () => {
    setFormData((prev) => ({ ...prev, sizes: [] }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category,
      description: product.description,
      imageUrl: product.imageUrl,
      onSale: product.onSale || false,
      discountPercent: product.discountPercent?.toString() || '',
      isNewArrival: product.isNewArrival,
      sizes: product.sizes,
      features: product.features.join('\n'),
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.imageUrl) {
      setToast({ message: 'Please fill in required fields', type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      // Build product data without undefined values (Firestore doesn't allow undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productData: any = {
        name: formData.name,
        brand: formData.brand,
        price: parseFloat(formData.price),
        onSale: formData.onSale,
        category: formData.category,
        imageUrl: formData.imageUrl,
        images: [formData.imageUrl],
        description: formData.description,
        features: formData.features.split('\n').filter((f) => f.trim()),
        sizes: formData.sizes,
        rating: 0,
        reviewCount: 0,
        reviews: [],
        isNewArrival: formData.isNewArrival,
        isTrending: false,
      };

      // Only add sale-related fields if product is on sale
      if (formData.onSale && formData.originalPrice) {
        productData.originalPrice = parseFloat(formData.originalPrice);
      }
      if (formData.onSale && formData.discountPercent) {
        productData.discountPercent = parseInt(formData.discountPercent);
      }

      console.log('[Admin] Saving product with imageUrl:', productData.imageUrl);
      console.log('[Admin] Full product data:', JSON.stringify(productData, null, 2));
      
      if (editingId) {
        await updateProduct(editingId, productData);
        // If not on sale, remove sale-related fields from Firestore
        if (!formData.onSale) {
          await removeProductFields(editingId, ['originalPrice', 'discountPercent']);
        }
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? { ...productData, id: editingId } : p))
        );
        setToast({ message: 'Product updated successfully', type: 'success' });
      } else {
        const newId = await addProduct(productData);
        console.log('[Admin] Product added with ID:', newId);
        setProducts((prev) => [...prev, { ...productData, id: newId }]);
        setToast({ message: 'Product added successfully', type: 'success' });
      }

      resetForm();
    } catch (error) {
      console.error('[Admin] Error saving product:', error);
      setToast({ message: 'Failed to save product', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      setToast({ message: 'Product deleted successfully', type: 'success' });
    } catch (error) {
      console.error('[Admin] Error deleting product:', error);
      setToast({ message: 'Failed to delete product', type: 'error' });
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const count = await importMockProducts();
      const newProducts = await getAllProducts();
      setProducts(newProducts);
      setHasFirestoreProducts(true);
      setToast({ message: `Imported ${count} products successfully`, type: 'success' });
    } catch (error) {
      console.error('[Admin] Error importing products:', error);
      setToast({ message: 'Failed to import products', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-6 h-6 text-text-dark" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-cabinet text-text-dark">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const availableSizes = formData.category === 'kids' ? KIDS_SIZES : STANDARD_SIZES;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-cabinet font-bold text-2xl lg:text-3xl text-text-dark">
              Admin Dashboard
            </h1>
            <p className="font-cabinet text-gray-500 mt-1">
              Manage products in your store
            </p>
          </div>
          <div className="flex gap-3">
            {!hasFirestoreProducts && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 bg-blue-600 text-white font-cabinet font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Mock Products'}
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-card-bg text-white font-cabinet font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 lg:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cabinet font-bold text-xl text-text-dark">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    Product Name <span className="text-discount-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Air Max 90"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark"
                    required
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Nike"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    Price <span className="text-discount-red">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="160"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-text-dark"
                  >
                    <option value="mens">Men's</option>
                    <option value="womens">Women's</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    Image URL <span className="text-discount-red">*</span>
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/shoe.png"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark"
                    required
                  />
                </div>

                {/* On Sale */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="onSale"
                      checked={formData.onSale}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-gray-300 text-discount-red focus:ring-discount-red"
                    />
                    <span className="font-cabinet text-text-dark">On Sale</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={formData.isNewArrival}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-cabinet text-text-dark">New Arrival</span>
                  </label>
                </div>

                {/* Sale Price (if on sale) */}
                {formData.onSale && (
                  <>
                    <div>
                      <label className="block font-cabinet font-medium text-text-dark mb-2">
                        Original Price
                      </label>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="200"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark"
                      />
                    </div>
                    <div>
                      <label className="block font-cabinet font-medium text-text-dark mb-2">
                        Discount %
                      </label>
                      <input
                        type="number"
                        name="discountPercent"
                        value={formData.discountPercent}
                        onChange={handleInputChange}
                        placeholder="20"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-cabinet font-medium text-text-dark">
                    Available Sizes
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllSizes}
                      className="text-sm font-cabinet text-blue-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearSizes}
                      className="text-sm font-cabinet text-gray-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-4 py-2 rounded-lg border font-cabinet text-sm transition-colors ${
                        formData.sizes.includes(size)
                          ? 'bg-card-bg text-white border-card-bg'
                          : 'bg-white text-text-dark border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-cabinet font-medium text-text-dark mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block font-cabinet font-medium text-text-dark mb-2">
                  Features (one per line)
                </label>
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  placeholder="Breathable mesh upper&#10;Air Max cushioning&#10;Rubber outsole"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark focus:outline-none focus:ring-2 focus:ring-text-dark resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-card-bg text-white font-cabinet font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-200 text-text-dark font-cabinet font-medium rounded-lg hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-cabinet font-bold text-lg text-text-dark">
              Products ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-cabinet text-gray-500">No products found.</p>
              <p className="font-cabinet text-gray-400 text-sm mt-2">
                Click "Import Mock Products" to load sample data or "Add Product" to create new products.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-cabinet font-medium text-gray-500 text-sm">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left font-cabinet font-medium text-gray-500 text-sm">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left font-cabinet font-medium text-gray-500 text-sm">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left font-cabinet font-medium text-gray-500 text-sm">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left font-cabinet font-medium text-gray-500 text-sm">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right font-cabinet font-medium text-gray-500 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#E8E8E8] rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <span className="font-cabinet font-medium text-text-dark">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-cabinet text-gray-600">
                        {product.brand}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-cabinet font-medium ${product.onSale ? 'text-discount-red' : 'text-text-dark'}`}>
                          ${product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="font-cabinet text-gray-400 line-through ml-2">
                            ${product.originalPrice}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-cabinet text-gray-600 capitalize">
                          {product.category === 'mens' ? "Men's" : product.category === 'womens' ? "Women's" : 'Kids'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {product.onSale && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-cabinet rounded">
                              Sale
                            </span>
                          )}
                          {product.isNewArrival && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-cabinet rounded">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1.5 text-sm font-cabinet text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                          {deleteConfirm === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="px-3 py-1.5 text-sm font-cabinet text-white bg-discount-red hover:bg-red-600 rounded transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 text-sm font-cabinet text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="px-3 py-1.5 text-sm font-cabinet text-discount-red hover:bg-red-50 rounded transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Admin;
