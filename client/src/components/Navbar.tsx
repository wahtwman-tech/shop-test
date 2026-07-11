import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>🛒 Fayiz Shop</Link>
        
        <div style={styles.links}>
          <Link to="/" style={styles.link}>المنتجات</Link>
          
          {user ? (
            <>
              <Link to="/cart" style={styles.link}>🛒 السلة</Link>
              <Link to="/orders" style={styles.link}>📦 طلباتي</Link>
              {user.isAdmin && (
                <Link to="/admin" style={styles.linkAdmin}>⚙️ الأدمن</Link>
              )}
              <span style={styles.email}>{user.email}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>خروج</button>
            </>
          ) : (
            <Link to="/login" style={styles.loginBtn}>دخول / تسجيل</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: '#1a1a2e',
    padding: '1rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fff',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  link: {
    color: '#e0e0e0',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
  },
  linkAdmin: {
    color: '#ffd700',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
  },
  loginBtn: {
    background: '#4361ee',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  logoutBtn: {
    background: '#dc3545',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  email: {
    color: '#aaa',
    fontSize: '0.9rem',
  },
};
