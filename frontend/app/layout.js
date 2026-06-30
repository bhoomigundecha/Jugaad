import "./globals.css";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: "Jugaad — Mol Karo, Save Karo",
  description: "India's first AI negotiation engine for smarter shopping",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className={`h-full ${playfair.variable}`}>
      <body className="min-h-full bg-gray-100 antialiased">
        <div className="phone-shell bg-white shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
