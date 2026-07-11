import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, productsApi, AdminOrder, Product } from '../api';

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار', color: '#ffc107' },
  { value: 'processing', label: 'جاري التجهيز', color: '#0d6efd' },
  { value: 'delivered', label: 'تم التوصيل', color: '#198754' },
  { value: 'rejected', label: 'مرفوض', color: '#dc3545' },
];

const LOW_STOCK_THRESHOLD = 10; // عرض تحذير إذا المخزون أقل من هذا

export default function Admin() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  
  const [productForm, setProductForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      if (!response.ok) {
        navigate('/admin/login');
        return;
      }
      fetchData();
    } catch {
      navigate('/admin/login');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/orders', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/products', { credentials: 'include' }).then(r => r.json()),
      ]);
      setOrders(ordersRes.orders || []);
      setProducts(productsRes.products || []);
    } catch {
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login');
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: data.order.status } : o));
      } else {
        setError(data.message || 'فشل تحديث الحالة');
      }
    } catch {
      setError('فشل تحديث الحالة');
    } finally {
      setUpdating(null);
    }
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    setError('');
    
    try {
      const response = await fetch('/api/products/seed', { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchData();
      } else {
        setError(data.message || 'فشل إضافة المنتجات');
      }
    } catch {
      setError('فشل إضافة المنتجات');
    } finally {
      setSeeding(false);
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', price: '', stock: '', imageUrl: '' });
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      nameAr: product.nameAr || '',
      nameEn: product.nameEn || '',
      descriptionAr: product.descriptionAr || '',
      descriptionEn: product.descriptionEn || '',
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl || '',
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
        }),
      });
      
      if (response.ok) {
        setShowProductModal(false);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'فشل حفظ المنتج');
      }
    } catch {
      setError('فشل حفظ المنتج');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'فشل حذف المنتج');
      }
    } catch {
      setError('فشل حذف المنتج');
    }
  };

  if (loading) {
    return <div style={styles.loading}>جارِ تحميل البيانات...</div>;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const lowStockProducts = products.filter(p => p.stock < LOW_STOCK_THRESHOLD);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ لوحة تحكم الأدمن</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>🚪 تسجيل الخروج</button>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>إجمالي الطلبات</h3>
          <p style={styles.statNumber}>{orders.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>قيد الانتظار</h3>
          <p style={{ ...styles.statNumber, color: '#ffc107' }}>
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        <div style={styles.statCard}>
          <h3>إجمالي المنتجات</h3>
          <p style={styles.statNumber}>{products.length}</p>
        </div>
      </div>
      
      <div style={styles.tabs}>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'products' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('products')}
        >
          📦 المنتجات ({products.length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'orders' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('orders')}
        >
          📋 الطلبات ({orders.length})
        </button>
      </div>
      
      {activeTab === 'products' && (
        <>
          <div style={styles.productsActions}>
            <button onClick={openAddProduct} style={styles.addBtn}>➕ إضافة منتج جديد</button>
            <button onClick={handleSeedProducts} style={styles.seedBtn} disabled={seeding}>
              {seeding ? 'جارِ...' : '📥 إضافة منتجات تجريبية'}
            </button>
          </div>
          
          {lowStockProducts.length > 0 && (
            <div style={styles.warning}>
              ⚠️ يوجد {lowStockProducts.length} منتج بالمخزون المنخفض!
            </div>
          )}
          
          <div style={styles.productsGrid}>
            {products.map((product) => (
              <div key={product.id} style={styles.productCard}>
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/150'} 
                  alt={product.nameAr}
                  style={styles.productImage}
                />
                <div style={styles.productInfo}>
                  <h3 style={styles.productName}>{product.nameAr}</h3>
                  <p style={styles.productNameEn}>{product.nameEn}</p>
                  <div style={styles.productMeta}>
                    <span style={styles.price}>{Number(product.price).toLocaleString()} د.ع</span>
                    <span style={{ 
                      ...styles.stock,
                      color: product.stock < LOW_STOCK_THRESHOLD ? '#dc3545' : '#28a745'
                    }}>
                      {product.stock === 0 ? '❌ غير متوفر' : `📦 ${product.stock}`}
                    </span>
                  </div>
                </div>
                <div style={styles.productActions}>
                  <button onClick={() => openEditProduct(product)} style={styles.editBtn}>✏️ تعديل</button>
                  <button onClick={() => handleDeleteProduct(product.id)} style={styles.deleteBtn}>🗑️ حذف</button>
                </div>
              </div>
            ))}
          </div>
          
          {products.length === 0 && (
            <div style={styles.empty}>لا توجد منتجات. أضف منتج جديد أو استخدم المنتجات التجريبية.</div>
          )}
        </>
      )}
      
      {activeTab === 'orders' && (
        <>
          {orders.length === 0 ? (
            <div style={styles.empty}>لا توجد طلبات</div>
          ) : (
            <div style={styles.ordersList}>
              {orders.map((order) => (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderHeader}>
                    <div>
                      <h3 style={styles.orderId}>طلب #{order.id}</h3>
                      <p style={styles.customerEmail}>{order.user.email}</p>
                      <p style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('ar-IQ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div style={styles.orderTotal}>
                      <span>المجموع:</span>
                      <strong>{Number(order.totalPrice).toLocaleString()} د.ع</strong>
                    </div>
                  </div>
                  
                  <div style={styles.itemsSection}>
                    <h4 style={styles.itemsTitle}>المنتجات ({order.items.length}):</h4>
                    {order.items.map((item) => (
                      <div key={item.id} style={styles.item}>
                        <span>{item.product?.nameAr || `منتج #${item.productId}`}</span>
                        <span>× {item.quantity}</span>
                        <span>{Number(item.price).toLocaleString()} د.ع</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={styles.statusSection}>
                    <label style={styles.statusLabel}>تغيير الحالة:</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                      style={styles.statusSelect}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {updating === order.id && <span style={styles.updating}>جارِ التحديث...</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {showProductModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingProduct ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}
            </h2>
            <form onSubmit={handleProductSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label>اسم المنتج (عربي)</label>
                  <input
                    type="text"
                    value={productForm.nameAr}
                    onChange={(e) => setProductForm({...productForm, nameAr: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label>اسم المنتج (إنجليزي)</label>
                  <input
                    type="text"
                    value={productForm.nameEn}
                    onChange={(e) => setProductForm({...productForm, nameEn: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label>الوصف (عربي)</label>
                  <textarea
                    value={productForm.descriptionAr}
                    onChange={(e) => setProductForm({...productForm, descriptionAr: e.target.value})}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.formField}>
                  <label>الوصف (إنجليزي)</label>
                  <textarea
                    value={productForm.descriptionEn}
                    onChange={(e) => setProductForm({...productForm, descriptionEn: e.target.value})}
                    style={styles.textarea}
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label>السعر (دينار)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    style={styles.input}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formField}>
                  <label>المخزون</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    style={styles.input}
                    required
                    min="0"
                  />
                </div>
              </div>
              
              <div style={styles.formField}>
                <label>رابط الصورة</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>
              
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>💾 حفظ</button>
                <button type="button" onClick={() => setShowProductModal(false)} style={styles.cancelBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    color: '#333',
    margin: 0,
  },
  logoutBtn: {
    background: '#dc3545',
    color: '#fff',
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#4361ee',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  tab: {
    padding: '0.8rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    background: '#e0e0e0',
  },
  tabActive: {
    background: '#4361ee',
    color: '#fff',
  },
  productsActions: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  addBtn: {
    background: '#28a745',
    color: '#fff',
    padding: '0.8rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  seedBtn: {
    background: '#17a2b8',
    color: '#fff',
    padding: '0.8rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  warning: {
    background: '#fff3cd',
    color: '#856404',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  productCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  productImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
  },
  productInfo: {
    padding: '1rem',
  },
  productName: {
    margin: '0 0 0.3rem 0',
    fontSize: '1.1rem',
  },
  productNameEn: {
    margin: '0 0 0.5rem 0',
    color: '#666',
    fontSize: '0.85rem',
  },
  productMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontWeight: 'bold',
    color: '#4361ee',
  },
  stock: {
    fontWeight: 'bold',
  },
  productActions: {
    display: 'flex',
    borderTop: '1px solid #eee',
  },
  editBtn: {
    flex: 1,
    padding: '0.8rem',
    border: 'none',
    background: '#ffc107',
    cursor: 'pointer',
  },
  deleteBtn: {
    flex: 1,
    padding: '0.8rem',
    border: 'none',
    background: '#dc3545',
    color: '#fff',
    cursor: 'pointer',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  orderCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
  },
  orderId: {
    color: '#333',
    marginBottom: '0.3rem',
  },
  customerEmail: {
    color: '#4361ee',
    marginBottom: '0.3rem',
  },
  orderDate: {
    color: '#666',
    fontSize: '0.85rem',
  },
  orderTotal: {
    textAlign: 'left',
  },
  itemsSection: {
    marginBottom: '1rem',
  },
  itemsTitle: {
    color: '#333',
    marginBottom: '0.5rem',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '0.9rem',
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  statusLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  statusSelect: {
    padding: '0.5rem 1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  updating: {
    color: '#666',
    fontSize: '0.9rem',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    background: '#f8f9fa',
    borderRadius: '12px',
    color: '#666',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  input: {
    padding: '0.8rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.8rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    minHeight: '80px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  saveBtn: {
    background: '#28a745',
    color: '#fff',
    padding: '0.8rem 2rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  cancelBtn: {
    background: '#6c757d',
    color: '#fff',
    padding: '0.8rem 2rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
