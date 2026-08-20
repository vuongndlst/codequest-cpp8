import { describe, expect, it } from 'vitest';
import { LESSONS_META } from '@/data/lessons.meta';
import { calculateLessonPercent, getLessonLockState, getNextLessonId, getTotalStars, isChallengeUnlocked, isLessonUnlocked, MAX_TOTAL_STARS } from './progression';
import type { LessonProgressRow, LessonStatus } from '@/types/database';
const progress=(id:string,status:LessonStatus,stars=0):LessonProgressRow=>({id:`p-${id}`,user_id:'u',lesson_id:id,status,progress_percent:status==='completed'?100:40,stars,xp:0,completed_challenges:[],started_at:null,completed_at:null,updated_at:new Date().toISOString()});

describe('progression Area 0–10',()=>{
  it('Area 0 luôn mở, Area sau cần hoàn thành Area trước',()=>{
    expect(isLessonUnlocked('a0',{progressByLesson:{}})).toBe(true);
    expect(isLessonUnlocked('a1',{progressByLesson:{}})).toBe(false);
    expect(isLessonUnlocked('a1',{progressByLesson:{a0:progress('a0','completed')}})).toBe(true);
    expect(isLessonUnlocked('a2',{progressByLesson:{a0:progress('a0','completed')}})).toBe(false);
  });
  it('giáo viên có thể mở mọi Area',()=>{ for(const lesson of LESSONS_META) expect(isLessonUnlocked(lesson.id,{progressByLesson:{},isTeacher:true})).toBe(true); });
  it('giáo viên có thể mở sớm hoặc tạm khóa khu vực cho lớp',()=>{
    expect(isLessonUnlocked('a3',{progressByLesson:{},teacherUnlockedLessons:['a3']})).toBe(true);
    expect(isLessonUnlocked('a1',{progressByLesson:{a0:progress('a0','completed')},teacherLockedLessons:['a1']})).toBe(false);
    expect(isLessonUnlocked('a0',{progressByLesson:{},teacherLockedLessons:['a0']})).toBe(false);
  });
  it('phân biệt lock state',()=>{ const ctx={progressByLesson:{a0:progress('a0','completed'),a1:progress('a1','in_progress')}}; expect(getLessonLockState('a0',ctx)).toBe('completed'); expect(getLessonLockState('a1',ctx)).toBe('unlocked'); expect(getLessonLockState('a2',ctx)).toBe('locked'); });
  it('node mở tuần tự, node optional không chặn',()=>{ const ids=['c1','c2','c3']; expect(isChallengeUnlocked(0,ids,[])).toBe(true); expect(isChallengeUnlocked(1,ids,[])).toBe(false); expect(isChallengeUnlocked(1,ids,['c1'])).toBe(true); expect(isChallengeUnlocked(2,ids,[],true)).toBe(true); });
  it('tính phần trăm theo nhiệm vụ bắt buộc',()=>{ expect(calculateLessonPercent(['c1','bonus'],['c1','c2'])).toBe(50); expect(calculateLessonPercent(['c1','c2'],['c1','c2'])).toBe(100); });
  it('chọn đúng Area tiếp theo',()=>{ expect(getNextLessonId({progressByLesson:{}})).toBe('a0'); expect(getNextLessonId({progressByLesson:{a0:progress('a0','completed')}})).toBe('a1'); expect(getNextLessonId({progressByLesson:{a0:progress('a0','completed'),a1:progress('a1','completed'),a2:progress('a2','completed')}})).toBe('a3'); expect(getNextLessonId({progressByLesson:{a0:progress('a0','completed'),a1:progress('a1','completed'),a2:progress('a2','completed'),a3:progress('a3','completed')}})).toBe('a4'); expect(getNextLessonId({progressByLesson:{a0:progress('a0','completed'),a1:progress('a1','completed'),a2:progress('a2','completed'),a3:progress('a3','completed'),a4:progress('a4','completed')}})).toBe('a5'); });
  it('tổng sao theo đúng mười một Area',()=>{ expect(getTotalStars({a0:progress('a0','completed',3),a1:progress('a1','in_progress',2)})).toBe(5); expect(MAX_TOTAL_STARS).toBe(33); });
});
