import { useMemo, useState } from 'react';

export default function QuizPanel({ questions, onFinish }) {
  const [selected, setSelected] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);

  const currentQuestion = questions[currentIndex];

  const accuracy = useMemo(() => {
    if (!result) return null;
    const correct = result.correctCount;
    const total = questions.length;
    return Math.round((correct / total) * 100);
  }, [result, questions]);

  const handleSubmit = () => {
    const wrong = [];
    let correctCount = 0;
    questions.forEach((q) => {
      if (selected[q.id] === q.answer) {
        correctCount += 1;
      } else {
        wrong.push({ ...q, userAnswer: selected[q.id] });
      }
    });
    const final = { correctCount, wrong };
    setResult(final);
    if (onFinish) {
      onFinish({ accuracy: Math.round((correctCount / questions.length) * 100), wrong });
    }
  };

  const handleSelect = (questionId, opt) => {
    if (result) return;
    const nextSelected = { ...selected, [questionId]: opt };
    setSelected(nextSelected);

    // 选完立即前进到下一题，最后一题则保持在原位等待提交
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    }
  };

  const answeredCount = Object.keys(selected).length;

  const typeLabel = {
    'vocab-meaning': '单词释义',
    'vocab-sentence': '例句填空',
    grammar: '语法填空'
  };

  return (
    <div className="section">
      <div className="section-title">今日小测</div>
      <div className="subtle-text">优先覆盖今日学习+复习的全部条目，若无任务再随机补充</div>

      {currentQuestion && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="badge-row">
            <span className="tag">{typeLabel[currentQuestion.type] || '选择题'}</span>
            <span className="tag">第 {currentIndex + 1} / {questions.length} 题</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700 }}>{currentQuestion.prompt}</div>
            {currentQuestion.extra && <div className="subtle-text">{currentQuestion.extra}</div>}
          </div>
          <div className="card-stack" style={{ marginTop: 10 }}>
            {currentQuestion.options.map((opt) => (
              <button
                key={opt}
                className={`test-option ${selected[currentQuestion.id] === opt ? 'selected' : ''}`}
                onClick={() => handleSelect(currentQuestion.id, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="actionRow" style={{ marginTop: 14, justifyContent: 'space-between' }}>
            <button className="ghost-button" onClick={goPrev} disabled={currentIndex === 0}>上一题</button>
            <div className="subtle-text">已答 {answeredCount} / {questions.length}</div>
            {currentIndex < questions.length - 1 ? (
              <button className="ghost-button" onClick={goNext}>下一题</button>
            ) : (
              <button className="primary-button" onClick={handleSubmit}>提交测试</button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="result-box">
          <div style={{ fontWeight: 700 }}>正确率 {accuracy}%</div>
          <div className="subtle-text">不完美也没关系，把薄弱点记下来就好。</div>
          {result.wrong.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="section-title">错题复盘</div>
              {result.wrong.map((item) => (
                <div key={item.id} style={{ marginTop: 8 }}>
                  <div>{item.prompt}</div>
                  <div className="subtle-text">你的选择：{item.userAnswer || '未作答'}</div>
                  <div className="subtle-text">正确答案：{item.answer}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
