"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Mic, ShoppingBag, User } from "lucide-react";

const tabs = [
  { icon: Home,        label: "Home",    href: "/home" },
  { icon: Search,      label: "Search",  href: "/search" },
  { icon: Mic,         label: "Voice",   href: "/voice" },
  { icon: ShoppingBag, label: "Cart",    href: "/cart" },
  { icon: User,        label: "Profile", href: "/profile" },
];

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="mb-3 rounded-[25] fixed bottom-0 left-1/2 -translate-x-1/2 w-[360px] max-w-[430px] z-50"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.55)",
        boxShadow: "0 -2px 20px rgba(0,0,0,0.07)",
      }}
    >
      <div
        className="flex items-center justify-around"
        style={{ paddingTop: 7, paddingBottom: 7, paddingLeft: 12, paddingRight: 12 }}
      >
        {tabs.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");

          if (active) {
            return (
              /* Dark pill: [purple circle + icon] [label] */
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex items-center gap-2.5"
                style={{
                  background: "#1a0a2e",
                  borderRadius: 999,
                  paddingTop: 6,
                  paddingBottom: 6,
                  paddingLeft: 6,
                  paddingRight: 18,
                }}
              >
                {/* Purple icon circle */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#7c3aed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {label}
                </span>
              </button>
            );
          }

          /* Inactive: icon only */
          // homoscedacity heteroscadacity, GARCH family models 
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{ padding: 10 }}
            >
              <Icon size={22} color="#9ca3af" strokeWidth={1.8} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
