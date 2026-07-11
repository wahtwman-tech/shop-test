import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await register(email, password);
        setSuccess('تم إنشاء الحساب! تفقد بريدك الإلكتروني لتفعيل الحساب.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}</h1>
        
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              placeholder="example@email.com"
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              minLength={8}
              placeholder="8 أحرف على الأقل"
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'جارِ...' : isLogin ? 'دخول' : 'إنشاء حساب'}
          </button>
        </form>
        
        <p style={styles.toggle}>
          {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب؟'}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            style={styles.toggleBtn}
          >
            {isLogin ? 'سجل الآن' : 'سجل دخول'}
          </button>
        </p>
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
    padding: '2.5rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '1.5rem',
    fontSize: '1.8rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  input: {
    padding: '0.8rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  },
  button: {
    background: '#4361ee',
    color: '#fff',
    padding: '1rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#666',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#4361ee',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  success: {
    background: '#efe',
    color: '#3c3',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};
