import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// combines class names safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
