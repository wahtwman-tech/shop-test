import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ordersApi, Order } from '../api';
import { useAuth } from '../context/AuthContext';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'قيد الانتظار', color: '#ffc107', bg: '#fff3cd' },
  processing: { label: 'جاري التجهيز', color: '#0d6efd', bg: '#cfe2ff' },
  delivered: { label: 'تم التوصيل', color: '#198754', bg: '#d1e7dd' },
  rejected: { label: 'مرفوض', color: '#dc3545', bg: '#f8d7da' },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      navigate('/login');
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { orders } = await ordersApi.getAll();
      setOrders(orders);
    } catch {
      setError('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    if (!orders.find(o => o.id === orderId)?.items) {
      try {
        const { order } = await ordersApi.getOne(orderId);
        setOrders(prev => prev.map(o => o.id === orderId ? order : o));
      } catch {
        return;
      }
    }
    setExpandedOrder(orderId);
  };

  if (loading) {
    return <div style={styles.loading}>جارِ تحميل الطلبات...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📦 طلباتي</h1>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {orders.length === 0 ? (
        <div style={styles.empty}>
          <p>لا توجد طلبات</p>
          <Link to="/" style={styles.shopBtn}>تسوق الآن</Link>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => {
            const status = statusLabels[order.status] || statusLabels.pending;
            const isExpanded = expandedOrder === order.id;
            
            return (
              <div key={order.id} style={styles.orderCard}>
                <div 
                  style={styles.orderHeader}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div style={styles.orderInfo}>
                    <h3 style={styles.orderId}>طلب #{order.id}</h3>
                    <p style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('ar-IQ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  
                  <div style={styles.orderStatus}>
                    <span style={{ ...styles.statusBadge, background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                    <span style={styles.orderTotal}>
                      {Number(order.totalPrice).toFixed(2)} د.ع
                    </span>
                    <span style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {isExpanded && order.items && (
                  <div style={styles.orderDetails}>
                    <h4 style={styles.detailsTitle}>تفاصيل الطلب:</h4>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th>المنتج</th>
                          <th>السعر</th>
                          <th>الكمية</th>
                          <th>المجموع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} style={styles.tableRow}>
                            <td>{item.product?.nameAr || `منتج #${item.productId}`}</td>
                            <td>{Number(item.price).toFixed(2)} د.ع</td>
                            <td>{item.quantity}</td>
                            <td>{(Number(item.price) * item.quantity).toFixed(2)} د.ع</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    background: '#f8f9fa',
    borderRadius: '12px',
  },
  shopBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    background: '#4361ee',
    color: '#fff',
    padding: '0.8rem 2rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  orderCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.2rem',
    cursor: 'pointer',
  },
  orderInfo: {},
  orderId: {
    color: '#333',
    marginBottom: '0.3rem',
  },
  orderDate: {
    color: '#666',
    fontSize: '0.9rem',
  },
  orderStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statusBadge: {
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  orderTotal: {
    fontWeight: 'bold',
    color: '#4361ee',
    fontSize: '1.1rem',
  },
  expandIcon: {
    color: '#999',
    fontSize: '0.8rem',
  },
  orderDetails: {
    padding: '1.2rem',
    background: '#f8f9fa',
    borderTop: '1px solid #eee',
  },
  detailsTitle: {
    marginBottom: '1rem',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#e9ecef',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
};
