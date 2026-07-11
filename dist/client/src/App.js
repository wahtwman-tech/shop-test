import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsxs("div", { style: styles.app, children: [_jsx(Navbar, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Products, {}) }), _jsx(Route, { path: "/product/:id", element: _jsx(ProductDetails, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/verify", element: _jsx(Verify, {}) }), _jsx(Route, { path: "/cart", element: _jsx(Cart, {}) }), _jsx(Route, { path: "/orders", element: _jsx(Orders, {}) }), _jsx(Route, { path: "/admin", element: _jsx(Admin, {}) })] })] }) }) }));
}
const styles = {
    app: {
        minHeight: '100vh',
        background: '#f5f6fa',
    },
};
