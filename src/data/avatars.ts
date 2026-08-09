/**
 * Bộ avatar nhân vật.
 *
 * Mục 22: avatar mặc định là hình minh hoạ, KHÔNG yêu cầu học sinh tải ảnh thật.
 * Toàn bộ hình được vẽ bằng SVG gốc trong `components/game/AvatarIcon.tsx`,
 * không dùng tài sản có bản quyền của sản phẩm khác.
 */

export type AvatarShape = 'visor' | 'hood' | 'antenna' | 'crest';

export interface AvatarDef {
  id: string;
  name: string;
  shape: AvatarShape;
  /** Màu chính (thân/áo) */
  primary: string;
  /** Màu phụ (kính/viền) */
  accent: string;
}

export const AVATARS: AvatarDef[] = [
  { id: 'guardian-cyan', name: 'Vệ Binh Lam', shape: 'visor', primary: '#0891b2', accent: '#67e8f9' },
  { id: 'guardian-violet', name: 'Vệ Binh Tím', shape: 'visor', primary: '#7c3aed', accent: '#c4b5fd' },
  { id: 'mage-emerald', name: 'Pháp Sư Ngọc', shape: 'hood', primary: '#059669', accent: '#6ee7b7' },
  { id: 'mage-amber', name: 'Pháp Sư Hổ Phách', shape: 'hood', primary: '#d97706', accent: '#fcd34d' },
  { id: 'bot-sky', name: 'Trợ Thủ Thiên Thanh', shape: 'antenna', primary: '#0284c7', accent: '#7dd3fc' },
  { id: 'bot-rose', name: 'Trợ Thủ Hồng Ngọc', shape: 'antenna', primary: '#be185d', accent: '#f9a8d4' },
  { id: 'scout-lime', name: 'Trinh Sát Lục', shape: 'crest', primary: '#4d7c0f', accent: '#bef264' },
  { id: 'scout-indigo', name: 'Trinh Sát Chàm', shape: 'crest', primary: '#4338ca', accent: '#a5b4fc' },
];

export const DEFAULT_AVATAR_ID = 'guardian-cyan';

export function getAvatar(id: string | null | undefined): AvatarDef {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}
