import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('رابط التفعيل غير صالح');
      return;
    }

    verifyToken(token);
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const { message } = await authApi.verify(token);
      setStatus('success');
      setMessage(message);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'فشل تفعيل الحساب');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'loading' && (
          <>
            <div style={styles.spinner}>⏳</div>
            <h2>جارِ تفعيل الحساب...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={styles.icon}>✅</div>
            <h2 style={styles.successTitle}>تم تفعيل الحساب!</h2>
            <p style={styles.message}>{message}</p>
            <Link to="/login" style={styles.loginBtn}>سجل دخول الآن</Link>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={styles.icon}>❌</div>
            <h2 style={styles.errorTitle}>فشل التفعيل</h2>
            <p style={styles.message}>{message}</p>
            <Link to="/" style={styles.backBtn}>العودة للصفحة الرئيسية</Link>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '3rem',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  spinner: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  successTitle: {
    color: '#28a745',
    marginBottom: '1rem',
  },
  errorTitle: {
    color: '#dc3545',
    marginBottom: '1rem',
  },
  message: {
    color: '#666',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  loginBtn: {
    display: 'inline-block',
    background: '#4361ee',
    color: '#fff',
    padding: '1rem 2rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  backBtn: {
    display: 'inline-block',
    background: '#6c757d',
    color: '#fff',
    padding: '1rem 2rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
