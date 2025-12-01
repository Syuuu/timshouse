import styles from '../styles/Home.module.css';

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function DashboardSummary({
  summary,
  progressPercent,
  encouragement,
  streakDays,
  streakLevel,
  onStartStudy,
  onStartQuiz,
  history
}) {
  return (
    <div className="section">
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>小雨的 N2 学习桌</div>
          <div className={styles.encourage}>{encouragement}</div>
        </div>
        <div className="flex-row">
          <button className="primary-button" onClick={onStartStudy}>开始学习</button>
          <button className="primary-button" onClick={onStartQuiz}>开始测试</button>
        </div>
      </div>

      <div className={styles.streakArea}>
        <div className={styles.streakCard}>
          <div className={styles.streakLabel}>连续学习</div>
          <div className={styles.streakValue}><span>{streakDays}</span> 天</div>
          <div className={styles.streakLevel}>段位：{streakLevel}</div>
          <div className="subtle-text">保持节奏，每天 10 分钟累积成就。</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="section-title">今日任务</div>
        <div className={styles.taskGrid}>
          <div className={styles.taskCard}>
            <div className="subtle-text">新单词</div>
            <div className={styles.taskNumber}>{summary.newVocab}</div>
          </div>
          <div className={styles.taskCard}>
            <div className="subtle-text">复习单词</div>
            <div className={styles.taskNumber}>{summary.reviewVocab}</div>
          </div>
          <div className={styles.taskCard}>
            <div className="subtle-text">新语法</div>
            <div className={styles.taskNumber}>{summary.newGrammar}</div>
          </div>
          <div className={styles.taskCard}>
            <div className="subtle-text">复习语法</div>
            <div className={styles.taskNumber}>{summary.reviewGrammar}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="subtle-text">今日完成度</div>
        <div className="progress-bar">
          <div className="progress-inner" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="subtle-text" style={{ marginTop: 4 }}>{progressPercent}% 完成</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="section-title">最近几天</div>
        {history.length === 0 && <div className={styles.emptyHint}>还没有记录，今天开始第一天吧</div>}
        {history.slice(0, 5).map((item) => (
          <div key={item.date} className="history-item">
            <div>
              <div style={{ fontWeight: 700 }}>{formatDate(item.date)}</div>
              <div className="subtle-text">{item.completed ? '任务已完成' : '任务未完成'}</div>
            </div>
            <div className="subtle-text">测试正确率：{item.accuracy ? `${item.accuracy}%` : '暂无'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
