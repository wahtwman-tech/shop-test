import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, cartApi, Product } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      const { product } = await productsApi.getOne(Number(id));
      setProduct(product);
    } catch {
      setError('المنتج غير موجود');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    if (!product || product.stock < quantity) return;

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      await cartApi.add(product.id, quantity);
      setSuccess('تمت الإضافة للسلة!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة المنتج');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>جارِ التحميل...</div>;
  }

  if (!product) {
    return (
      <div style={styles.container}>
        <h2>المنتج غير موجود</h2>
        <Link to="/" style={styles.backLink}>العودة للمنتجات</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← العودة للمنتجات</Link>
      
      <div style={styles.card}>
        {product.image_url && (
          <img src={product.image_url} alt={product.name_ar} style={styles.image} />
        )}
        
        <div style={styles.details}>
          <h1 style={styles.name}>{product.name_ar}</h1>
          
          <div style={styles.priceSection}>
            <span style={styles.price}>{Number(product.price).toFixed(2)} د.ع</span>
            <span style={product.stock > 0 ? styles.inStock : styles.outStock}>
              {product.stock > 0 ? `متوفر (${product.stock})` : 'نفذ'}
            </span>
          </div>
          
          {product.description_ar && (
            <p style={styles.desc}>{product.description_ar}</p>
          )}
          
          {product.stock > 0 ? (
            <div style={styles.actions}>
              <div style={styles.quantitySection}>
                <label style={styles.label}>الكمية:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, Number(e.target.value))))}
                  style={styles.quantity}
                />
              </div>
              
              <button 
                onClick={handleAddToCart} 
                style={styles.addBtn}
                disabled={adding}
              >
                {adding ? 'جارِ الإضافة...' : '🛒 أضف للسلة'}
              </button>
            </div>
          ) : (
            <div style={styles.outOfStock}>هذا المنتج غير متوفر حالياً</div>
          )}
          
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '1.5rem',
    color: '#4361ee',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    objectFit: 'cover',
  },
  details: {
    padding: '2rem',
  },
  name: {
    color: '#333',
    marginBottom: '1rem',
    fontSize: '1.8rem',
  },
  priceSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
  },
  price: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#4361ee',
  },
  inStock: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  outStock: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  desc: {
    color: '#666',
    lineHeight: 1.8,
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  quantitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  quantity: {
    padding: '0.5rem 1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    width: '80px',
  },
  addBtn: {
    background: '#4361ee',
    color: '#fff',
    padding: '1rem 2rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  outOfStock: {
    background: '#fee',
    color: '#dc3545',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '0.8rem',
    borderRadius: '8px',
    marginTop: '1rem',
  },
  success: {
    background: '#efe',
    color: '#28a745',
    padding: '0.8rem',
    borderRadius: '8px',
    marginTop: '1rem',
    fontWeight: 'bold',
  },
};
