"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, ShoppingBag } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import JugaadWordmark from "@/components/JugaadWordmark";
import ProductCarousel from "@/components/ProductCarousel";
import HomeBanner from "@/components/HomeBanner";
import { getProducts } from "@/lib/api";
import { getSession } from "@/lib/auth";
import ProductCard from "../../components/ProductCard";

const CATEGORIES = [
  { label: "All",         image: "/home/all.jpeg" },
  { label: "Men",         image: "/home/men.jpeg" },
  { label: "Women",       image: "/home/women.jpeg" },
  { label: "Kids",        image: "/home/kids.jpeg" },
  { label: "Books",       image: "/home/books.jpeg" },
  { label: "Footwear",    image: "/home/footwear.jpeg" },
  { label: "Bags",        image: "/home/bags.jpeg" },
  { label: "Electronics", image: "/home/electronics.jpeg" },
];

// glass helper — reused inline
const glass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.75)",
  borderRadius: 25,
};

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [activeCategory, setCategory] = useState("All");
  const [search, setSearch]           = useState("");
  const [buyer, setBuyer]             = useState(null);
  const [wishlist, setWishlist]       = useState([]);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push("/login"); return; }
    setBuyer(session);
    getProducts()
      .then((p) => { setProducts(p); setFiltered(p); })
      .catch(() => { setProducts([]); setFiltered([]); });
  }, []);

  useEffect(() => {
    let r = products;
    if (activeCategory !== "All")
      r = r.filter((p) => p.gender === activeCategory || p.category === activeCategory);
    if (search.trim())
      r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(r);
  }, [activeCategory, search, products]);

  const toggleWishlist = (id) =>
    setWishlist((w) => w.includes(id) ? w.filter((x) => x !== id) : [...w, id]);

  const handleNegotiate = (product) => router.push(`/product/${product.id}`);

  return (
    /* Full-screen lavender gradient background */
    <div
      className="min-h-dvh"
      style={{ background: "linear-gradient(160deg, #e4d9f5 0%, #ede6fa 50%, #d8cdf0 100%)" }}
    >
      {/* Scrollable content with safe padding */}
      <div className="px-4 pt-14 pb-32">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5">
          <JugaadWordmark />
          <div className="flex gap-2 pt-1">
            <button
              className="-mt-12 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ ...glass, borderRadius: "50%", boxShadow: "0 2px 10px rgba(100,70,200,0.12)" }}
            >
              <Bell size={18} color="#4b5563" />
            </button>
            <button
              className="-mt-12 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ ...glass, borderRadius: "50%", boxShadow: "0 2px 10px rgba(100,70,200,0.12)" }}
            >
              <ShoppingBag size={18} color="#4b5563" />
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div
          className="-mt-3 flex items-center gap-3 px-4 mb-5"
          style={{ ...glass, padding: "13px 18px", boxShadow: "0 4px 16px rgba(100,70,200,0.1)" }}
        >
          <Search size={17} color="#7c3aed" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            style={{ background: "transparent", flex: 1, fontSize: 14, color: "#374151", outline: "none", border: "none" }}
          />
        </div>

        {/* ── Categories ── */}
        <div
          className="flex gap-4 mb-5 overflow-x-auto"
          style={{ scrollbarWidth: "none", paddingBottom: 4 }}
        >
          {CATEGORIES.map(({ label, image }) => {
            const active = activeCategory === label;
            return (
              <button
                key={label}
                onClick={() => setCategory(label)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className="w-[62px] h-[62px] rounded-full overflow-hidden transition-all duration-200"
                  style={active
                    ? { border: "3px solid #7c3aed", boxShadow: "0 0 0 2px #fff, 0 0 0 4.5px #7c3aed" }
                    : { border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }
                  }
                >
                  <img src={image} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: active ? "#7c3aed" : "#6b7280" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Banner ── */}
        <div className="mb-6">
          <HomeBanner onCta={() => router.push("/checkout")} />
        </div>

        {/* ── Popular — horizontal scroll row ── */}
        <ProductCarousel
          title="Popular"
          products={filtered}
          wishlist={wishlist}
          onWishlist={toggleWishlist}
          onNegotiate={handleNegotiate}
          layout="scroll"
          glass
        />


      </div>{/* end scrollable */}

      <div className="-mt-3 px-4 pb-4">
        <div className="rounded-[25px]">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
