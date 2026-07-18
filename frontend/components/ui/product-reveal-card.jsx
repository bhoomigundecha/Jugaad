"use client";

import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Star, Heart, Mic, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * ProductRevealCard
 * ──────────────────
 * Drop-in replacement for ProductCard — same `product` shape and callback
 * props, hover/tap reveals a details panel with description + actions.
 *
 * Props:
 *   product      – { id, name, mrp, originalPrice?, discount?, category?,
 *                     imageUrl?, description?, vendor?, stock?, rating?,
 *                     reviewCount? }
 *   wishlisted   – boolean
 *   onWishlist   – (id) => void
 *   onNegotiate  – (product) => void   (optional — falls back to /product/:id)
 *   enableAnimations – boolean (default true)
 *   className    – string
 */
export function ProductRevealCard({
  product,
  wishlisted = false,
  onWishlist,
  onNegotiate,
  enableAnimations = true,
  className,
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(wishlisted);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  if (!product) return null;

  const {
    id,
    name,
    mrp,
    originalPrice,
    discount,
    category,
    imageUrl,
    description,
    vendor,
    stock,
    rating,
    reviewCount,
  } = product;

  const price = `₹${mrp}`;
  const originalPriceLabel = originalPrice ? `₹${originalPrice}` : null;
  const discountLabel =
    discount ||
    (originalPrice && mrp
      ? `${Math.round(((originalPrice - mrp) / originalPrice) * 100)}% OFF`
      : null);

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onWishlist?.(id);
  };

  const handleNegotiate = (e) => {
    e.stopPropagation();
    if (onNegotiate) onNegotiate(product);
    else router.push(`/product/${id}`);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    router.push(`/product/${id}`);
  };

  const containerVariants = {
    rest: {
      scale: 1,
      y: 0,
    },
    hover: shouldAnimate
      ? {
          scale: 1.03,
          y: -8,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          },
        }
      : {},
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.04 },
  };

  const overlayVariants = {
    rest: {
      y: "100%",
      opacity: 0,
    },
    hover: {
      y: "0%",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const contentVariants = {
    rest: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    hover: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  };

  const buttonMotionVariants = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate
      ? {
          scale: 1.05,
          y: -2,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }
      : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  };

  const favoriteVariants = {
    rest: { scale: 1, rotate: 0 },
    favorite: {
      scale: [1, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      data-slot="product-reveal-card"
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      onClick={handleBuyNow}
      className={cn(
        "relative w-full rounded-2xl border border-border/50 bg-card text-card-foreground overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group",
        className,
      )}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <motion.img
          src={imageUrl}
          alt={name}
          className="h-40 w-full object-cover bg-muted"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Favorite Button */}
        <motion.button
          onClick={handleFavorite}
          variants={favoriteVariants}
          animate={isFavorite ? "favorite" : "rest"}
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm border border-white/20",
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-white/20 text-white hover:bg-white/30",
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
        </motion.button>

        {/* Discount Badge */}
        {discountLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-3 left-3 bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-bold"
          >
            {discountLabel}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Rating — only shown if we actually have real rating data */}
        {typeof rating === "number" && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < Math.floor(rating)
                      ? "text-yellow-400 fill-current"
                      : "text-muted-foreground",
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {rating}
              {reviewCount ? ` (${reviewCount})` : ""}
            </span>
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-0.5">
          <motion.h3
            className="text-sm font-bold leading-tight tracking-tight line-clamp-2 min-h-[2.2rem]"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {name}
          </motion.h3>

          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-primary">{price}</span>
            {originalPriceLabel && (
              <span className="text-xs text-muted-foreground line-through">
                {originalPriceLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reveal Overlay */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 rounded-2xl bg-background/96 backdrop-blur-xl flex flex-col justify-end overflow-hidden"
      >
        <div className="p-3 space-y-2.5">
          {/* Product Description */}
          <motion.div variants={contentVariants}>
            <h4 className="font-semibold mb-1 text-xs">Product Details</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
              {description || `${category || "Product"} from ${vendor || "our sellers"}.`}
            </p>
          </motion.div>

          {/* Info chips */}
          <motion.div variants={contentVariants}>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                <div className="font-semibold truncate">{category || "—"}</div>
                <div className="text-muted-foreground">Category</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                <div className="font-semibold">
                  {typeof stock === "number" ? (stock > 0 ? `${stock} left` : "Out of stock") : "In stock"}
                </div>
                <div className="text-muted-foreground">Availability</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={contentVariants} className="space-y-2">
            <motion.button
              onClick={handleBuyNow}
              variants={buttonMotionVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-[100px] w-full h-10 font-medium text-xs bg-black text-white hover:bg-black/90",
              )}
              style={{ background: "#000000", color: "#fff" }}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
              Buy Now
            </motion.button>

            <motion.button
              onClick={handleNegotiate}
              variants={buttonMotionVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default", size: "rounded-[100px]" }),
                "w-full h-10 rounded-full font-medium text-xs",
              )}
              style={{ background: "#7C3AED", color: "#fff" }}
            >
              <Mic className="w-3.5 h-3.5 mr-1.5" />
              Negotiate
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
