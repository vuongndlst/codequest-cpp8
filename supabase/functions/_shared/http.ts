const ALLOWED_ORIGINS = new Set([
  'https://vuongndlst.github.io',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
]);

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin)
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
