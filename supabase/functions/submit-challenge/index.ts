import { gradeChallengeCode } from '../_shared/grader.generated.js';
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { corsHeaders, json, safeErrorMessage } from '../_shared/http.ts';

interface RequestBody {
  lessonId?: string;
  challengeId?: string;
  code?: string;
  hintLevelUsed?: number;
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
    const challengeId = String(body.challengeId ?? '');
    const code = String(body.code ?? '');
    if (code.length > 10_000) throw new Error('CODE_QUA_DAI');
    const hintLevelUsed = Number.isInteger(body.hintLevelUsed)
      ? Math.max(0, Math.min(10, Number(body.hintLevelUsed)))
      : 0;

    const db = serviceClient();
    const { data: quotaAllowed, error: quotaError } = await db.rpc('consume_submission_quota', {
      p_user_id: user.id,
      p_scope: 'challenge',
      p_limit: 20,
      p_window_seconds: 60,
    });
    if (quotaError) throw new Error(quotaError.message);
    if (!quotaAllowed) throw new Error('QUA_NHIEU_YEU_CAU');

    const grade = gradeChallengeCode(lessonId, challengeId, code);
    const { data, error } = await db.rpc('record_authoritative_attempt', {
      p_user_id: user.id,
      p_lesson_id: lessonId,
      p_challenge_id: challengeId,
      p_code: code,
      p_run_ok: grade.ok,
      p_is_correct: grade.isCorrect,
      p_passed_tests: grade.passedRequired,
      p_total_tests: grade.totalRequired,
      p_error_types: grade.errorCodes,
      p_hint_level: hintLevelUsed,
      p_clean_code_score: grade.cleanCode?.score ?? null,
    });
    if (error) throw new Error(error.message);

    return json(request, {
      grade: {
        ok: grade.ok,
        isCorrect: grade.isCorrect,
        passedRequired: grade.passedRequired,
        totalRequired: grade.totalRequired,
        errorCodes: grade.errorCodes,
      },
      persistence: data,
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    const status = message === 'CAN_DANG_NHAP'
      ? 401
      : message === 'QUA_NHIEU_YEU_CAU'
        ? 429
        : message === 'NHIEM_VU_CHUA_MO'
          ? 403
          : message === 'KHONG_THE_XU_LY_YEU_CAU' ? 500 : 400;
    return json(request, { error: message }, status);
  }
});
