import { useEffect, useMemo, useState } from 'react';

export default function StudySession({ cards, onRate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const remainingCards = useMemo(() => cards.filter((c) => !c.completed), [cards]);
  const currentCard = remainingCards[currentIndex] || null;

  useEffect(() => {
    // 当剩余卡片数量变少且当前索引超出范围时，重置到第一张，避免误判已完成
    if (currentIndex >= remainingCards.length && remainingCards.length > 0) {
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  }, [currentIndex, remainingCards.length]);

  const encouragements = [
    '保持稳稳的节奏，小雨也能轻松拿下 N2',
    '10 分钟就好，把今天的积累完成',
    '专心看一张卡片，感受自己的进展'
  ];
  const hint = encouragements[Math.floor(Math.random() * encouragements.length)];

  const handleRate = (level) => {
    onRate(currentCard, level);
    setShowAnswer(false);
    if (currentIndex + 1 < remainingCards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (!cards || cards.length === 0) {
    return <div className="section">今日没有需要学习的内容，可以留一点时间给自己放松。</div>;
  }

  if (!currentCard) {
    return (
      <div className="section">
        <div className="section-title">今日任务已完成</div>
        <div className="subtle-text">恭喜收工，可以去做个小测试检验一下。</div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-title">学习卡片</div>
      <div className="subtle-text">{hint}</div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="badge-row">
          <span className="tag">{currentCard.type === 'vocab' ? '单词' : '语法'}</span>
          <span className="tag">{currentIndex + 1}/{remainingCards.length}</span>
        </div>
        {currentCard.type === 'vocab' ? (
          <div>
            <h3 style={{ marginBottom: 4 }}>{currentCard.word}（{currentCard.reading}）</h3>
            {!showAnswer && <p className="subtle-text">点击「显示答案」看看意思和例句</p>}
            {showAnswer && (
              <div>
                <p style={{ fontWeight: 700 }}>{currentCard.meaning}</p>
                {currentCard.examples.map((ex, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <div>{ex.jp}</div>
                    <div className="subtle-text">{ex.cn}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: 4 }}>{currentCard.pattern}</h3>
            {!showAnswer && (
              <div>
                <p className="subtle-text">想想看这个语法怎么用？</p>
                <p>{currentCard.examples[0].jp.replace(currentCard.pattern, '＿＿')}</p>
              </div>
            )}
            {showAnswer && (
              <div>
                <p style={{ fontWeight: 700 }}>{currentCard.meaning}</p>
                {currentCard.examples.map((ex, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <div>{ex.jp}</div>
                    <div className="subtle-text">{ex.cn}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showAnswer ? (
          <div className="actionRow" style={{ marginTop: 12 }}>
            <button className="primary-button" onClick={() => setShowAnswer(true)}>显示答案</button>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="subtle-text">今天的感觉是？（会影响下次复习时间）</div>
            <div className="button-row" style={{ marginTop: 8 }}>
              <button className="primary-button" onClick={() => handleRate('fail')}>完全不会</button>
              <button className="primary-button" onClick={() => handleRate('so-so')}>有点印象</button>
              <button className="primary-button" onClick={() => handleRate('easy')}>已经掌握</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
