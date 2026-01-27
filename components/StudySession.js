import { useEffect, useMemo, useState } from 'react';
import { playTts } from '../lib/tts';

export default function StudySession({ cards, onRate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  const handleSpeak = (text) => {
    if (!currentCard || !text) return;
    playTts(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    }).catch(() => setIsSpeaking(false));
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
          <span className="tag">
            {currentCard.type === 'vocab' ? '单词' : currentCard.type === 'phrase' ? '短句' : '语法'}
          </span>
          <span className="tag">{currentIndex + 1}/{remainingCards.length}</span>
        </div>
        {currentCard.type === 'vocab' ? (
          <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>{currentCard.word}（{currentCard.reading}）</h3>
                <p className="subtle-text" style={{ marginTop: 2 }}>点击「显示答案」看看意思和例句</p>
              </div>
              <button
                className={`icon-button ${isSpeaking ? 'active' : ''}`}
                onClick={() => handleSpeak(currentCard.word)}
                aria-label="播放单词发音"
                title="播放发音"
              >
                <span className={`sound-wave ${isSpeaking ? 'active' : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 10.5v3c0 .3.2.5.5.5h2.3c.2 0 .3 0 .4.2l2.6 2.6c.3.3.7.1.7-.3V7.5c0-.4-.4-.6-.7-.3l-2.6 2.6c-.1.1-.2.2-.4.2H4.5c-.3 0-.5.2-.5.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M15 9.5c.6.6.6 1.4 0 2-.6.6-.6 1.4 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path
                      d="M17.2 7.7c1.3 1.2 1.3 2.9 0 4.1-1.3 1.2-1.3 2.9 0 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
            {showAnswer && (
              <div>
                <p style={{ fontWeight: 700 }}>{currentCard.meaning}</p>
                {currentCard.examples.map((ex, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                      <div>{ex.jp}</div>
                      <button
                        className={`icon-button small ${isSpeaking ? 'active' : ''}`}
                        onClick={() => handleSpeak(ex.jp)}
                        aria-label="播放例句发音"
                        title="播放例句"
                      >
                        <span className={`sound-wave ${isSpeaking ? 'active' : ''}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M4 10.5v3c0 .3.2.5.5.5h2.3c.2 0 .3 0 .4.2l2.6 2.6c.3.3.7.1.7-.3V7.5c0-.4-.4-.6-.7-.3l-2.6 2.6c-.1.1-.2.2-.4.2H4.5c-.3 0-.5.2-.5.5Z"
                              fill="currentColor"
                            />
                            <path
                              d="M15 9.5c.6.6.6 1.4 0 2-.6.6-.6 1.4 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path
                              d="M17.2 7.7c1.3 1.2 1.3 2.9 0 4.1-1.3 1.2-1.3 2.9 0 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div className="subtle-text">{ex.cn}</div>
                  </div>
                ))}
                <div className="subtle-text" style={{ marginTop: 10 }}>
                  已升级 OpenAI TTS，若失败会自动切换到基础语音。
                </div>
              </div>
            )}
          </div>
        ) : currentCard.type === 'phrase' ? (
          <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>{currentCard.phrase}</h3>
                <p className="subtle-text" style={{ marginTop: 2 }}>常用短句，一起记住语感。</p>
              </div>
              <button
                className={`icon-button ${isSpeaking ? 'active' : ''}`}
                onClick={() => handleSpeak(currentCard.phrase)}
                aria-label="播放短句发音"
                title="播放短句"
              >
                <span className={`sound-wave ${isSpeaking ? 'active' : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 10.5v3c0 .3.2.5.5.5h2.3c.2 0 .3 0 .4.2l2.6 2.6c.3.3.7.1.7-.3V7.5c0-.4-.4-.6-.7-.3l-2.6 2.6c-.1.1-.2.2-.4.2H4.5c-.3 0-.5.2-.5.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M15 9.5c.6.6.6 1.4 0 2-.6.6-.6 1.4 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path
                      d="M17.2 7.7c1.3 1.2 1.3 2.9 0 4.1-1.3 1.2-1.3 2.9 0 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
            {showAnswer && (
              <div>
                <p style={{ fontWeight: 700 }}>{currentCard.meaning}</p>
                <div style={{ marginTop: 8 }}>
                  <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                    <div>{currentCard.conversation.jp1}</div>
                    <button
                      className={`icon-button small ${isSpeaking ? 'active' : ''}`}
                      onClick={() => handleSpeak(currentCard.conversation.jp1)}
                      aria-label="播放对话第一句"
                      title="播放第一句"
                    >
                      <span className={`sound-wave ${isSpeaking ? 'active' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M4 10.5v3c0 .3.2.5.5.5h2.3c.2 0 .3 0 .4.2l2.6 2.6c.3.3.7.1.7-.3V7.5c0-.4-.4-.6-.7-.3l-2.6 2.6c-.1.1-.2.2-.4.2H4.5c-.3 0-.5.2-.5.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M15 9.5c.6.6.6 1.4 0 2-.6.6-.6 1.4 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          <path
                            d="M17.2 7.7c1.3 1.2 1.3 2.9 0 4.1-1.3 1.2-1.3 2.9 0 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="subtle-text">{currentCard.conversation.cn1}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                    <div>{currentCard.conversation.jp2}</div>
                    <button
                      className={`icon-button small ${isSpeaking ? 'active' : ''}`}
                      onClick={() => handleSpeak(currentCard.conversation.jp2)}
                      aria-label="播放对话第二句"
                      title="播放第二句"
                    >
                      <span className={`sound-wave ${isSpeaking ? 'active' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M4 10.5v3c0 .3.2.5.5.5h2.3c.2 0 .3 0 .4.2l2.6 2.6c.3.3.7.1.7-.3V7.5c0-.4-.4-.6-.7-.3l-2.6 2.6c-.1.1-.2.2-.4.2H4.5c-.3 0-.5.2-.5.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M15 9.5c.6.6.6 1.4 0 2-.6.6-.6 1.4 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          <path
                            d="M17.2 7.7c1.3 1.2 1.3 2.9 0 4.1-1.3 1.2-1.3 2.9 0 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="subtle-text">{currentCard.conversation.cn2}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ marginBottom: 4 }}>{currentCard.pattern}</h3>
              <button
                className={`icon-button ${isSpeaking ? 'active' : ''}`}
                onClick={() => handleSpeak(currentCard.examples[0]?.jp || currentCard.pattern)}
                aria-label="播放语法例句发音"
                title="播放发音"
              >
                <span className={`sound-wave ${isSpeaking ? 'active' : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 10.5v3c0 .3.2.5.5.5h2.3c.2 0 .3 0 .4.2l2.6 2.6c.3.3.7.1.7-.3V7.5c0-.4-.4-.6-.7-.3l-2.6 2.6c-.1.1-.2.2-.4.2H4.5c-.3 0-.5.2-.5.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M15 9.5c.6.6.6 1.4 0 2-.6.6-.6 1.4 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path
                      d="M17.2 7.7c1.3 1.2 1.3 2.9 0 4.1-1.3 1.2-1.3 2.9 0 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
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
