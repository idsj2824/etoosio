import styles from './CombinationReference.module.css';

const combinations = [
  { type: 'SINGLE', name: '싱글', description: '한 장' },
  { type: 'PAIR', name: '페어', description: '같은 숫자 두 장' },
  { type: 'TRIPLE', name: '트리플', description: '같은 숫자 세 장' },
  { type: 'STRAIGHT', name: '스트레이트', description: '연속된 숫자 다섯 장' },
  { type: 'FLUSH', name: '플러시', description: '같은 등급 다섯 장' },
  { type: 'FULL_HOUSE', name: '풀하우스', description: '세 장 + 두 장' },
  { type: 'FOUR_OF_A_KIND', name: '포카드', description: '같은 숫자 네 장' },
  { type: 'STRAIGHT_FLUSH', name: '스트레이트 플러시', description: '연속된 숫자 다섯 장 + 같은 등급' },
];

const rankOrder = [
  { name: '사원', icon: '▣' },
  { name: '대리', icon: '💼' },
  { name: '과장', icon: '📊' },
  { name: '부장', icon: '👔' },
];

const numberOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1, 2];

export function CombinationReference() {
  return (
    <div className={styles.reference}>
      <h3>족보 참조</h3>
      <div className={styles.list}>
        {combinations.map((combo) => (
          <div key={combo.type} className={styles.item}>
            <div className={styles.name}>{combo.name}</div>
            <div className={styles.description}>{combo.description}</div>
          </div>
        ))}
      </div>
      
      <div className={styles.section}>
        <h4>직급 순서</h4>
        <div className={styles.orderList}>
          {rankOrder.map((rank, index) => (
            <div key={index} className={styles.orderItem}>
              <span className={styles.icon}>{rank.icon}</span>
              <span className={styles.label}>{rank.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h4>숫자 순서</h4>
        <div className={styles.orderList}>
          {numberOrder.map((num, index) => (
            <div key={index} className={styles.orderItem}>
              <span className={styles.number}>{num}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
