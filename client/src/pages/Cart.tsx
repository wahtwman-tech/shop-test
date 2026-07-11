import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartApi, ordersApi, CartItem } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      navigate('/login');
    }
  }, [user]);

  const loadCart = async () => {
    try {
      const { items, total } = await cartApi.get();
      setItems(items);
      setTotal(total);
    } catch {
      setError('فشل تحميل السلة');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    try {
      await cartApi.update(id, quantity);
      loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الكمية');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await cartApi.remove(id);
      loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف المنتج');
    }
  };

  const handleCheckout = async () => {
    setOrdering(true);
    setError('');
    setSuccess('');

    try {
      const { order } = await ordersApi.create();
      setSuccess(`تم إنشاء الطلب رقم #${order.id} بنجاح!`);
      setItems([]);
      setTotal(0);
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إتمام الطلب');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>جارِ تحميل السلة...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🛒 سلة التسوق</h1>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      
      {items.length === 0 ? (
        <div style={styles.empty}>
          <p>السلة فارغة</p>
          <Link to="/" style={styles.shopBtn}>تسوق الآن</Link>
        </div>
      ) : (
        <>
          <div style={styles.itemsList}>
            {items.map((item) => (
              <div key={item.id} style={styles.item}>
                {item.product.image_url && (
                  <img src={item.product.image_url} alt={item.product.name_ar} style={styles.itemImage} />
                )}
                
                <div style={styles.itemDetails}>
                  <h3 style={styles.itemName}>{item.product.name_ar}</h3>
                  <p style={styles.itemPrice}>{Number(item.product.price).toFixed(2)} د.ع</p>
                </div>
                
                <div style={styles.quantityControl}>
                  <button 
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    style={styles.qtyBtn}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span style={styles.qtyValue}>{item.quantity}</span>
                  <button 
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    style={styles.qtyBtn}
                    disabled={item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>
                
                <p style={styles.itemTotal}>
                  {(Number(item.product.price) * item.quantity).toFixed(2)} د.ع
                </p>
                
                <button onClick={() => handleRemove(item.id)} style={styles.removeBtn}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div style={styles.summary}>
            <div style={styles.totalRow}>
              <span>المجموع الكلي:</span>
              <span style={styles.totalPrice}>{total.toFixed(2)} د.ع</span>
            </div>
            
            <button 
              onClick={handleCheckout} 
              style={styles.checkoutBtn}
              disabled={ordering}
            >
              {ordering ? 'جارِ إتمام الطلب...' : 'إتمام الطلب'}
            </button>
          </div>
        </>
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
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: '#333',
    marginBottom: '0.3rem',
  },
  itemPrice: {
    color: '#666',
    fontSize: '0.9rem',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  qtyBtn: {
    width: '32px',
    height: '32px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  qtyValue: {
    width: '40px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  itemTotal: {
    fontWeight: 'bold',
    color: '#4361ee',
    minWidth: '100px',
    textAlign: 'right',
  },
  removeBtn: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
  },
  summary: {
    marginTop: '2rem',
    padding: '1.5rem',
    background: '#1a1a2e',
    borderRadius: '12px',
    color: '#fff',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.2rem',
    marginBottom: '1rem',
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  checkoutBtn: {
    width: '100%',
    background: '#4361ee',
    color: '#fff',
    padding: '1rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  success: {
    background: '#efe',
    color: '#28a745',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
};
