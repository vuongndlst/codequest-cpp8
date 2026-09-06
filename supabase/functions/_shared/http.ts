const ALLOWED_ORIGINS = new Set(['https://vuongndlst.github.io']);

/*
  Vite khong co dinh o 5173: cong ban thi no nhay sang 5174, 5175...
  Danh sach cong cung truoc day khien moi bai nop tu cong du phong bi trinh
  duyet chan vi lech CORS. Client coi do la loi mang -> xep hang doi im lang ->
  hoc sinh thay "Da hoan thanh" con may chu khong nhan duoc gi.

  Cho phep moi cong tren may cuc bo. Day khong phai lop bao mat: JWT cua hoc
  sinh moi la thu quyet dinh, va requireUser() van kiem tra tung yeu cau.
  Neu can chay thu qua LAN (http://192.168.x.x) thi them origin do vao
  ALLOWED_ORIGINS mot cach tuong minh, dung noi long them regex.
*/
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/;

function isAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin);
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': isAllowed(origin)
      ? origin
      : 'https://vuongndlst.github.io',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const known = new Set([
    'CAN_DANG_NHAP',
    'NHIEM_VU_KHONG_TON_TAI',
    'KHU_VUC_KHONG_TON_TAI',
    'CODE_KHONG_HOP_LE',
    'CODE_QUA_DAI',
    'DAP_AN_QUA_DAI',
    'NHIEM_VU_CHUA_MO',
    'CHUA_HOAN_THANH_NHIEM_VU',
    'QUA_NHIEU_YEU_CAU',
  ]);
  return known.has(message) ? message : 'KHONG_THE_XU_LY_YEU_CAU';
}
