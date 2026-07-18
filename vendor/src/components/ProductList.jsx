import ProductCard from './ProductCard';

/**
 * ProductList — renders the scrollable list of ProductCard items.
 * Owns no state itself; receives products and callbacks from App.
 */
export default function ProductList({ products, onToggle, onExpand, onUpdateFloor, onUpdatePersona }) {
  if (products.length === 0) {
    return (
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 pb-4">
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No products yet — add your first listing.</p>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-5 space-y-3 pb-4">
      {products.map((product, idx) => (
        <ProductCard
          key={product.id}
          product={product}
          index={idx}
          onToggle={onToggle}
          onExpand={onExpand}
          onUpdateFloor={onUpdateFloor}
          onUpdatePersona={onUpdatePersona}
        />
      ))}
    </main>
  );
}
