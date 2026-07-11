import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, productsApi, AdminOrder } from '../api';
import { useAuth } from '../context/AuthContext';

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار', color: '#ffc107' },
  { value: 'processing', label: 'جاري التجهيز', color: '#0d6efd' },
  { value: 'delivered', label: 'تم التوصيل', color: '#198754' },
  { value: 'rejected', label: 'مرفوض', color: '#dc3545' },
];

export default function Admin() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.isAdmin) {
      navigate('/');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const { orders } = await adminApi.getOrders();
      setOrders(orders);
    } catch {
      setError('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    setError('');
    
    try {
      const { order } = await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: order.status } : o));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الحالة');
    } finally {
      setUpdating(null);
    }
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    setError('');
    
    try {
      const { message } = await productsApi.seed();
      alert(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة المنتجات');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>جارِ تحميل البيانات...</div>;
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚙️ لوحة تحكم الأدمن</h1>
      
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
          <h3>تم التوصيل</h3>
          <p style={{ ...styles.statNumber, color: '#198754' }}>
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
      </div>
      
      <h2 style={styles.subtitle}>إدارة المنتجات</h2>
      
      <div style={styles.productsSection}>
        <button onClick={handleSeedProducts} style={styles.seedBtn} disabled={seeding}>
          {seeding ? 'جارِ إضافة المنتجات...' : '➕ إضافة منتجات تجريبية'}
        </button>
      </div>
      
      <h2 style={styles.subtitle}>إدارة الطلبات</h2>
      
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
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                
                <div style={styles.orderTotal}>
                  <span>المجموع:</span>
                  <strong>{Number(order.totalPrice).toFixed(2)} د.ع</strong>
                </div>
              </div>
              
              <div style={styles.itemsSection}>
                <h4 style={styles.itemsTitle}>المنتجات:</h4>
                {order.items.map((item) => (
                  <div key={item.id} style={styles.item}>
                    <span>{item.product?.name_ar || `منتج #${item.productId}`}</span>
                    <span>{item.quantity} × {Number(item.price).toFixed(2)}</span>
                    <span>{(Number(item.price) * item.quantity).toFixed(2)} د.ع</span>
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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '2rem',
  },
  subtitle: {
    color: '#333',
    marginBottom: '1rem',
    marginTop: '2rem',
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
  productsSection: {
    marginBottom: '2rem',
  },
  seedBtn: {
    background: '#28a745',
    color: '#fff',
    padding: '0.8rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
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
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
};
