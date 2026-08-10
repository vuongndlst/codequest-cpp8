import { useMemo, useState } from 'react';
import { GameStage } from '@/components/game/GameStage';
import { TileSprite, TILE_COLS, TILE_COUNT } from '@/components/game/TileSprite';
import { Button } from '@/components/ui/Button';
import { analyzeChallenge } from '@/validators';
import { LESSONS } from '@/lessons';
import type { Challenge, WorldKind, WorldSpec } from '@/types/content';

/**
 * Trang xem trước sân khấu game — CHỈ tồn tại khi chạy `npm run dev`.
 *
 * Màn hình nhiệm vụ nằm sau đăng nhập nên không xem được sân khấu nếu không có
 * tài khoản học sinh. Trang này chạy code thật qua đúng trình thông dịch của
 * sản phẩm rồi đưa chuỗi sự kiện cho sân khấu, nên những gì thấy ở đây đúng
 * bằng những gì học sinh thấy.
 */

/**
 * Bản đồ BOSS thật của Khu vực 1, lấy nguyên từ nội dung bài học.
 *
 * Dùng bản đồ thật thay vì bản đồ bịa: xem trước mà không khớp với thứ học
 * sinh gặp thì xem để làm gì.
 *
 * Khai báo TRƯỚC `SAMPLES` vì `SAMPLES` dùng tới nó — `const` nằm trong vùng
 * chết tạm thời, đọc trước khi khai báo là ném lỗi ngay lúc nạp module.
 */
const BOSS = LESSONS.find((lesson) => lesson.id === 'l1')!.challenges.find(
  (challenge) => challenge.kind === 'boss',
)!;

const DEMO_MAP: WorldSpec = BOSS.world!;

const SAMPLES: Record<WorldKind, string> = {
  'signal-tower': `#include <iostream>
using namespace std;

int main() {
    int nangLuong = 100;
    cout << "Nang luong: " << nangLuong << endl;

    nangLuong = 45;
    cout << "Sau khi di chuyen: " << nangLuong << endl;

    return 0;
}`,
  workshop: `#include <iostream>
using namespace std;

void startFurnace() {
    cout << "Lo ren da nong" << endl;
}

void prepareAnvil() {
    cout << "De ren da san sang" << endl;
}

int addPower(int suc) {
    return suc + 10;
}

int main() {
    startFurnace();
    cout << addPower(5) << endl;
    return 0;
}`,
  path: `#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 4; i = i + 1) {
        moveForward();
    }
    return 0;
}`,
  map: BOSS.solution ?? '',
};

const BASE: Challenge = {
  id: 'preview',
  lessonId: 'l1',
  kind: 'mission',
  title: 'Xem trước sân khấu',
  story: '',
  instructions: [],
  starterCode: '',
  requiredPatterns: [],
  testCases: [],
  commonMistakes: [],
  hints: [],
  cleanCodeRules: [],
  xpReward: 0,
};

export function StagePreviewDevPage() {
  const [kind, setKind] = useState<WorldKind>('signal-tower');
  const [code, setCode] = useState(SAMPLES['signal-tower']);
  const [playKey, setPlayKey] = useState(0);

  const spec = useMemo<WorldSpec>(
    () =>
      kind === 'map'
        ? DEMO_MAP
        : { kind, cols: kind === 'path' ? 5 : 0, startCol: 0, goalCol: 4 },
    [kind],
  );

  const result = useMemo(
    () => analyzeChallenge(code, { ...BASE, world: spec }),
    [code, spec],
  );

  const pick = (next: WorldKind) => {
    setKind(next);
    setCode(SAMPLES[next]);
    setPlayKey((key) => key + 1);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-100">Xem trước sân khấu game</h1>
      <p className="text-sm text-slate-400">
        Trang này chỉ có khi chạy dev. Code được chạy qua đúng trình thông dịch của sản phẩm.
      </p>

      <div className="flex flex-wrap gap-2">
        {(['map', 'signal-tower', 'workshop', 'path'] as WorldKind[]).map((option) => (
          <Button
            key={option}
            variant={kind === option ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => pick(option)}
          >
            {option}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setPlayKey((key) => key + 1)}>
          Chạy lại
        </Button>
      </div>

      {/*
        Bảng tra chỉ số tile — chỉ có ở trang dev.
        Dựng cảnh cần biết ô nào là cỏ, ô nào là cổng; đoán mò thì sai cả buổi.
      */}
      {(['town', 'dungeon'] as const).map((sheet) => (
        <details key={sheet} className="cq-panel p-3">
          <summary className="text-sm text-slate-300 cursor-pointer">
            Bảng tra tile — {sheet} ({TILE_COUNT} ô)
          </summary>
          <div
            className="mt-3 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${TILE_COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: TILE_COUNT }, (_, index) => (
              <div key={index} className="flex flex-col items-center">
                <TileSprite index={index} sheet={sheet} scale={3} title={`${sheet} ${index}`} />
                <span className="text-[9px] text-slate-500 tabular-nums">{index}</span>
              </div>
            ))}
          </div>
        </details>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <textarea
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setPlayKey((key) => key + 1);
          }}
          rows={20}
          spellCheck={false}
          className="w-full font-mono text-sm rounded-xl bg-abyss-900 border border-abyss-600 text-slate-100 p-3"
        />

        <div className="min-w-0 space-y-3">
          <GameStage
            spec={spec}
            events={result.worldEvents}
            avatarId="guardian-cyan"
            playKey={playKey}
          />

          <details className="cq-panel p-3">
            <summary className="text-sm text-slate-300 cursor-pointer">
              Chuỗi sự kiện ({result.worldEvents.length})
            </summary>
            <pre className="font-mono text-xs text-slate-400 mt-2 overflow-x-auto">
              {result.worldEvents.map((event) => `${event.type}  ${event.message}`).join('\n')}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
