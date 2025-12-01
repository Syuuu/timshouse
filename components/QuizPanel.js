import { useMemo, useState } from 'react';

export default function QuizPanel({ questions, onFinish }) {
  const [selected, setSelected] = useState({});
  const [result, setResult] = useState(null);

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

  return (
    <div className="section">
      <div className="section-title">今日小测</div>
      <div className="subtle-text">题目以今日任务为主，数量不够会随机补充</div>
      {questions.map((q, idx) => (
        <div key={q.id} className="card" style={{ marginTop: 12 }}>
          <div className="badge-row">
            <span className="tag">{q.type === 'vocab' ? '单词四选一' : '语法选择题'}</span>
            <span className="tag">第 {idx + 1} 题</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700 }}>{q.prompt}</div>
            {q.extra && <div className="subtle-text">{q.extra}</div>}
          </div>
          <div className="card-stack" style={{ marginTop: 10 }}>
            {q.options.map((opt) => (
              <button
                key={opt}
                className={`test-option ${selected[q.id] === opt ? 'selected' : ''}`}
                onClick={() => setSelected({ ...selected, [q.id]: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="actionRow" style={{ marginTop: 14 }}>
        <button className="primary-button" onClick={handleSubmit}>提交测试</button>
      </div>

      {result && (
        <div className="result-box">
          <div style={{ fontWeight: 700 }}>正确率 {accuracy}%</div>
          <div className="subtle-text">不完美也没关系，我们在一起变强～</div>
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
