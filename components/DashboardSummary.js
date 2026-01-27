import styles from '../styles/Home.module.css';

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function DashboardSummary({
  summary,
  progressPercent,
  streakDays,
  streakLevel,
  examCountdown,
  todayCompleted,
  studyDone,
  quizDone,
  onStartStudy,
  onStartQuiz,
  history
}) {
  const completionText = todayCompleted
    ? '今日学习完成，进度已记录。'
    : '今日学习尚未完成（需完成学习卡片与小测试）。';

  return (
    <div className="section" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className={styles.heroCard}>
        <div className={styles.heroHeader}>
          <span className={styles.heroBadge}>JLPT N2 ・ 小雨的练习桌</span>
          <span className={`${styles.datePill} ${styles.datePillAccent}`}>
            距离 2026/7/6 考试还有 {examCountdown} 天
          </span>
        </div>

          <div className={styles.heroTextBlock}>
          <div className={styles.greeting}>小雨的 N2 学习桌</div>
          <div className={styles.heroNote}>每日 10 分钟，词汇・短句・语法同步巩固，稳步接近 N2 目标。</div>
          <div className={styles.ctaPanel}>
            <div className={styles.ctaLegend}>完成学习卡片 + 小测试，即可记录为今日完成</div>
            <div className={styles.ctaButtons}>
              <button className={`${styles.ctaAction} ${styles.ctaPrimary}`} onClick={onStartStudy}>开始学习</button>
              <button className={`${styles.ctaAction} ${styles.ctaSecondary}`} onClick={onStartQuiz}>开始测试</button>
            </div>
          </div>
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
            <div className={styles.taskLabel}><span className={styles.taskIcon}>📘</span>新单词</div>
            <div className={styles.taskNumber}>{summary.newVocab}</div>
          </div>
          <div className={styles.taskCard}>
            <div className={styles.taskLabel}><span className={styles.taskIcon}>🧭</span>复习单词</div>
            <div className={styles.taskNumber}>{summary.reviewVocab}</div>
          </div>
          <div className={styles.taskCard}>
            <div className={styles.taskLabel}><span className={styles.taskIcon}>💬</span>新短句</div>
            <div className={styles.taskNumber}>{summary.newPhrase}</div>
          </div>
          <div className={styles.taskCard}>
            <div className={styles.taskLabel}><span className={styles.taskIcon}>🪄</span>复习短句</div>
            <div className={styles.taskNumber}>{summary.reviewPhrase}</div>
          </div>
          <div className={styles.taskCard}>
            <div className={styles.taskLabel}><span className={styles.taskIcon}>✨</span>新语法</div>
            <div className={styles.taskNumber}>{summary.newGrammar}</div>
          </div>
          <div className={styles.taskCard}>
            <div className={styles.taskLabel}><span className={styles.taskIcon}>🧠</span>复习语法</div>
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
        <div className={styles.completionNote}>{completionText}</div>
        {!todayCompleted && (
          <div className={styles.completionTagRow}>
            <span className={`${styles.tag} ${studyDone ? styles.tagDone : styles.tagTodo}`}>
              学习卡片 {studyDone ? '已完成' : '未完成'}
            </span>
            <span className={`${styles.tag} ${quizDone ? styles.tagDone : styles.tagTodo}`}>
              小测试 {quizDone ? '已完成' : '未完成'}
            </span>
          </div>
        )}
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
