import clsx, { type ClassValue } from 'clsx';

/** Gộp danh sách class name có điều kiện. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
