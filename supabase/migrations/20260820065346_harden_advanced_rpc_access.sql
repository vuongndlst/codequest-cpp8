-- Supabase Advisors: hai RPC SECURITY DEFINER này chỉ dành cho học sinh đã
-- đăng nhập. Thu hồi rõ ràng cả quyền kế thừa từ PUBLIC lẫn role anon.

revoke execute on function public.award_challenge_gems(text) from public;
revoke execute on function public.award_challenge_gems(text) from anon;
grant execute on function public.award_challenge_gems(text) to authenticated;

revoke execute on function public.ensure_area_certificate(uuid, text) from public;
revoke execute on function public.ensure_area_certificate(uuid, text) from anon;
grant execute on function public.ensure_area_certificate(uuid, text) to authenticated;
