import styles from "./RulesModal.module.css";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rules-title"
      >
        <div className={styles.header}>
          <h2 id="rules-title">게임 방법</h2>
          <button type="button" onClick={onClose} className={styles.close}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <section>
            <h3>목표</h3>
            <p>
              손패의 타일을 모두 내면 그 라운드에서 &quot;퇴근&quot;합니다.
              5라운드 후 누적 점수가 가장 높은 플레이어가 승리합니다.
            </p>
          </section>

          <section>
            <h3>숫자 강도</h3>
            <p>낮음 → 높음:</p>
            <p className={styles.highlight}>
              3 &lt; 4 &lt; 5 &lt; 6 &lt; 7 &lt; 8 &lt; 9 &lt; 10 &lt; 11 &lt; 12
              &lt; 13 &lt; 14 &lt; 15 &lt; 1 &lt; 2
            </p>
          </section>

          <section>
            <h3>직급 강도</h3>
            <p>같은 숫자일 때: 사원 &lt; 대리 &lt; 과장 &lt; 부장</p>
            <p>예: 사원 9는 부장 8보다 높습니다.</p>
          </section>

          <section>
            <h3>조합 종류</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>조합</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>싱글</td>
                  <td>타일 1장</td>
                </tr>
                <tr>
                  <td>페어</td>
                  <td>같은 숫자 2장</td>
                </tr>
                <tr>
                  <td>트리플</td>
                  <td>같은 숫자 3장</td>
                </tr>
                <tr>
                  <td>스트레이트</td>
                  <td>연속 숫자 5장 (2 불가)</td>
                </tr>
                <tr>
                  <td>플러시</td>
                  <td>같은 직급 5장</td>
                </tr>
                <tr>
                  <td>풀하우스</td>
                  <td>트리플 + 페어</td>
                </tr>
                <tr>
                  <td>포카드</td>
                  <td>같은 숫자 4장 + 1장</td>
                </tr>
                <tr>
                  <td>스트레이트 플러시</td>
                  <td>같은 직급 + 연속 숫자 5장</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.note}>
              5장 조합 강도 순서: 스트레이트 &lt; 플러시 &lt; 풀하우스 &lt; 포카드 &lt; 스트레이트 플러시
            </p>
          </section>

          <section>
            <h3>조합 제출 &amp; 족보 승부 규칙</h3>
            <ul>
              <li><strong>1장(싱글), 2장(페어), 3장(트리플):</strong> 오직 <strong>같은 장수의 똑같은 조합 타입</strong>으로만 낼 수 있습니다. (예: 싱글은 싱글로만, 페어는 페어로만)</li>
              <li><strong>5장 조합 (스트레이트~스트레이트 플러시):</strong> 같은 5장 조합뿐만 아니라 <strong>더 높은 상위 족보 5장 조합</strong>을 바로 낼 수 있습니다! (예: 스트레이트 위에 플러시, 풀하우스, 포카드, 스트레이트 플러시 제출 가능)</li>
            </ul>
          </section>

          <section>
            <h3>동일 조합 우열 비교 방식</h3>
            <ul>
              <li><strong>스트레이트:</strong> 가장 높은 숫자 비교 → 같으면 가장 높은 숫자의 직급(부장&gt;과장&gt;대리&gt;사원) 비교</li>
              <li><strong>플러시:</strong> 가장 높은 숫자부터 순서대로 비교 → 5개 숫자가 모두 같으면 직급 비교</li>
              <li><strong>풀하우스:</strong> 3장(트리플) 부분의 숫자가 더 높은 쪽이 승리 (페어 숫자 무관)</li>
              <li><strong>포카드:</strong> 4장(포카드) 부분의 숫자가 더 높은 쪽이 승리</li>
              <li><strong>스트레이트 플러시:</strong> 가장 높은 숫자 비교 → 같으면 직급 비교</li>
            </ul>
          </section>

          <section>
            <h3>숫자 1의 스트레이트 특수 규칙</h3>
            <p>숫자 1은 마지막 숫자 뒤에 이어지는 스트레이트에 사용됩니다.</p>
            <ul>
              <li>3명: 6-7-8-9-1</li>
              <li>4명: 10-11-12-13-1</li>
              <li>5명: 12-13-14-15-1</li>
            </ul>
            <p>13-14-15-1-2 같은 순환 조합은 불가합니다.</p>
          </section>

          <section>
            <h3>차례 규칙</h3>
            <ul>
              <li>사원 3을 가진 플레이어가 선입니다.</li>
              <li>1, 2, 3, 5장만 낼 수 있습니다 (4장 불가).</li>
              <li>이전 조합보다 높은 조합을 내야 합니다.</li>
              <li>패스해도 다음 차례에 다시 낼 수 있습니다.</li>
              <li>
                마지막 제출자를 제외한 모든 플레이어가 패스하면, 제출자가 새
                선이 됩니다.
              </li>
              <li>새 선일 때는 원하는 어떤 조합이든 자유롭게 낼 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h3>점수</h3>
            <p>
              라운드 종료 시 남은 타일 수를 비교해 점수를 계산합니다. 타일이
              적을수록 높은 점수를 얻습니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
