"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { CheckCircle, Smartphone, CreditCard, Banknote } from "lucide-react";
import { submitCheckout } from "@/lib/api";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const price = searchParams.get("price");
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  const methods = [
    { id: "prepaid", label: "UPI / Card", sub: "Get ₹20 cashback!", icon: Smartphone, highlight: true },
    { id: "prepaid", label: "Credit / Debit Card", sub: "All cards accepted", icon: CreditCard, highlight: false },
    { id: "cod",     label: "Cash on Delivery", sub: "Pay when delivered", icon: Banknote, highlight: false },
  ];

  const handlePay = async () => {
    if (!selected) return;
    await submitCheckout(sessionId, selected);
    setDone(true);
  };

  if (done) return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #0f0f1a, #1a0a2e)" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}>
        <CheckCircle size={40} className="text-white" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Order Placed! 🎉</h2>
      <p className="text-purple-300 text-sm mb-8 text-center">
        Your negotiated price of <span className="text-white font-bold">₹{price}</span> has been confirmed.
      </p>
      <button onClick={() => router.push("/home")}
        className="w-full py-4 rounded-2xl text-white font-bold"
        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
        Continue Shopping
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "linear-gradient(135deg, #0f0f1a, #1a0a2e)" }}>
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-black text-white mb-1">Checkout</h1>
        <p className="text-purple-300 text-sm">Your negotiated price</p>
        <p className="text-5xl font-black mt-2" style={{
          background: "linear-gradient(135deg, #a855f7, #ec4899)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>₹{price}</p>
      </div>

      <div className="flex-1 px-5">
        <p className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wide">Payment Method</p>
        <div className="flex flex-col gap-3">
          {methods.map((m, i) => {
            const Icon = m.icon;
            return (
              <button key={i} onClick={() => setSelected(m.id)}
                className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                style={{
                  background: selected === m.id && i === methods.indexOf(m)
                    ? "rgba(124,58,237,0.3)"
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${selected === m.id ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"}`,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: m.highlight ? "linear-gradient(135deg,#7c3aed,#ec4899)" : "rgba(255,255,255,0.1)" }}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{m.label}</p>
                  <p className="text-purple-300 text-xs">{m.sub}</p>
                </div>
                {m.highlight && (
                  <span className="text-[10px] bg-yellow-400 text-black font-bold px-2 py-0.5 rounded-full">
                    CASHBACK
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-10 pt-6">
        <button onClick={handlePay} disabled={!selected}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-40 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
          Pay ₹{price} →
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0f0f1a" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
