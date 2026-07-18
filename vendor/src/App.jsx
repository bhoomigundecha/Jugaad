import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

import AmbientOrbs from './components/AmbientOrbs';
import Header from './components/Header';
import StatsStrip from './components/StatsStrip';
import ProductList from './components/ProductList';
import BottomNav from './components/BottomNav';
import AddListing from './components/AddListing';
import AnalyticsLoader from './components/AnalyticsLoader';
import SettingsLoader from './components/SettingsLoader';
import Login from './components/Login';
import Signup from './components/Signup';
import { getSession, saveSession, clearSession } from './lib/auth';
import { getVendorProducts, updateNegotiable, updateFloorPrice, updatePersona, mapProduct } from './lib/api';

export default function App() {
  const [vendor, setVendor] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [isDark, setIsDark] = useState(false);
  const [authView, setAuthView] = useState('login');

  // Sync CSS theme token
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Restore session on load
  useEffect(() => {
    setVendor(getSession());
    setCheckingSession(false);
  }, []);

  const loadProducts = useCallback((vendorId) => {
    setLoadingProducts(true);
    getVendorProducts(vendorId)
      .then((data) => setProducts(data.map(mapProduct)))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    if (vendor) loadProducts(vendor.id);
  }, [vendor, loadProducts]);

  const handleLogin = (v, remember = true) => {
    saveSession(v, remember);
    setVendor(v);
  };

  const handleLogout = () => {
    clearSession();
    setVendor(null);
    setProducts([]);
    setAuthView('login');
  };

  // Derived stats for StatsStrip
  const negotiableCount = products.filter((p) => p.isNegotiable).length;

  const toggleNegotiable = (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const next = !product.isNegotiable;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isNegotiable: next, isExpanded: next } : p))
    );
    updateNegotiable(id, next).catch(() => {
      // revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isNegotiable: !next, isExpanded: !next } : p))
      );
    });
  };

  const toggleExpand = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isExpanded: !p.isExpanded } : p))
    );
  };

  const handleUpdateFloor = (id, newFloor) => {
    const prevProducts = products;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, floorPrice: newFloor } : p)));
    updateFloorPrice(id, newFloor).catch(() => setProducts(prevProducts));
  };

  const handleUpdatePersona = (id, persona) => {
    const prevProducts = products;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, persona } : p)));
    updatePersona(id, persona).catch(() => setProducts(prevProducts));
  };

  const handleProductCreated = () => {
    if (vendor) loadProducts(vendor.id);
    setActiveTab('products');
  };

  if (checkingSession) return null;

  if (!vendor) {
    return authView === 'login' ? (
      <Login onLogin={handleLogin} isDark={isDark} onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSignedUp={handleLogin} isDark={isDark} onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div
      className="relative flex flex-col overflow-hidden transition-all duration-500"
      style={{
        width: '100%',
        maxWidth: '430px',
        height: '100dvh',
        maxHeight: '932px',
        background: isDark
          ? 'linear-gradient(160deg, #0f0a1a 0%, #150d2b 50%, #0d0820 100%)'
          : 'linear-gradient(160deg, #cfc3e8 0%, #d8cdf0 50%, #c8bde4 100%)',
      }}
    >
      {/* Decorative background orbs */}
      <AmbientOrbs />

      {/* Wordmark + theme toggle */}
      <Header isDark={isDark} onToggleTheme={() => setIsDark((d) => !d)} onLogout={handleLogout} shopName={vendor.shop_name} />

      {/* Quick stats */}
      <StatsStrip
        listed={products.length}
        negotiable={negotiableCount}
        dealsToday={7}
      />

      {/* Scrollable product cards */}
      {loadingProducts ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading products…</span>
        </div>
      ) : (
        <ProductList
          products={products}
          onToggle={toggleNegotiable}
          onExpand={toggleExpand}
          onUpdateFloor={handleUpdateFloor}
          onUpdatePersona={handleUpdatePersona}
        />
      )}

      {/* Glassmorphism pill navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
      />

      {/* ── Full-screen page overlays ── */}
      <AnimatePresence>
        {activeTab === 'add' && (
          <AddListing
            key="add"
            isDark={isDark}
            vendorId={vendor.id}
            onBack={() => setActiveTab('products')}
            onCreated={handleProductCreated}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsLoader key="analytics" isDark={isDark} onBack={() => setActiveTab('products')} />
        )}
        {activeTab === 'settings' && (
          <SettingsLoader key="settings" isDark={isDark} onBack={() => setActiveTab('products')} />
        )}
      </AnimatePresence>
    </div>
  );
}
