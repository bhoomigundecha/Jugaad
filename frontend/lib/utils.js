/**
 * Merge class names — lightweight cn() without the shadcn dependency.
 * Filters falsy values so you can write: cn("base", condition && "extra")
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
