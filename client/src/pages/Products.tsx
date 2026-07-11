import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, Product } from '../api';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { products } = await productsApi.getAll();
      setProducts(products);
    } catch (err) {
      setError('فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>جارِ تحميل المنتجات...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div style={styles.empty}>
        <h2>لا توجد منتجات</h2>
        <p>سيتم إضافة منتجات قريباً</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>منتجاتنا</h1>
      
      <div style={styles.grid}>
        {products.map((product) => (
          <div key={product.id} style={styles.card}>
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.nameAr} style={styles.image} />
            )}
            <div style={styles.cardBody}>
              <h3 style={styles.name}>{product.nameAr}</h3>
              {product.descriptionAr && (
                <p style={styles.desc}>{product.descriptionAr.substring(0, 80)}...</p>
              )}
              <div style={styles.priceRow}>
                <span style={styles.price}>{Number(product.price).toFixed(2)} د.ع</span>
                <span style={product.stock > 0 ? styles.inStock : styles.outStock}>
                  {product.stock > 0 ? `متوفر (${product.stock})` : 'نفذ'}
                </span>
              </div>
              <Link to={`/product/${product.id}`} style={styles.detailsBtn}>
                عرض التفاصيل
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '2rem',
    fontSize: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: '#dc3545',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '1.2rem',
  },
  name: {
    color: '#333',
    marginBottom: '0.5rem',
    fontSize: '1.2rem',
  },
  desc: {
    color: '#666',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    marginBottom: '1rem',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  price: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#4361ee',
  },
  inStock: {
    color: '#28a745',
    fontSize: '0.85rem',
  },
  outStock: {
    color: '#dc3545',
    fontSize: '0.85rem',
  },
  detailsBtn: {
    display: 'block',
    background: '#1a1a2e',
    color: '#fff',
    textAlign: 'center',
    padding: '0.8rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
