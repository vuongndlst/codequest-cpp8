import { gradeCheckpointAnswers } from '../_shared/grader.generated.js';
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { corsHeaders, json, safeErrorMessage } from '../_shared/http.ts';

interface RequestBody {
  lessonId?: string;
  answers?: Record<string, unknown>;
  reflection?: string;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const user = await requireUser(request);
    const body = await request.json() as RequestBody;
    const lessonId = String(body.lessonId ?? '');
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const reflection = String(body.reflection ?? '').slice(0, 1000);
    if (JSON.stringify(answers).length > 20_000) throw new Error('DAP_AN_QUA_DAI');

    const db = serviceClient();
    const { data: quotaAllowed, error: quotaError } = await db.rpc('consume_submission_quota', {
      p_user_id: user.id,
      p_scope: 'checkpoint',
      p_limit: 10,
      p_window_seconds: 300,
    });
    if (quotaError) throw new Error(quotaError.message);
    if (!quotaAllowed) throw new Error('QUA_NHIEU_YEU_CAU');

    const grade = gradeCheckpointAnswers(lessonId, answers as never);
    const { data, error } = await db.rpc('record_authoritative_checkpoint', {
      p_user_id: user.id,
      p_lesson_id: lessonId,
      p_answers: answers,
      p_score: grade.percent,
      p_reflection: reflection,
    });
    if (error) throw new Error(error.message);

    return json(request, { grade, persistence: data });
  } catch (error) {
    const message = safeErrorMessage(error);
    const status = message === 'CAN_DANG_NHAP'
      ? 401
      : message === 'QUA_NHIEU_YEU_CAU'
        ? 429
        : message === 'CHUA_HOAN_THANH_NHIEM_VU'
          ? 403
          : message === 'KHONG_THE_XU_LY_YEU_CAU' ? 500 : 400;
    return json(request, { error: message }, status);
  }
});
