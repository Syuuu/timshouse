import { useEffect, useMemo, useState } from 'react';
import QuizPanel from '../components/QuizPanel';
import HistoryList from '../components/HistoryList';
import { vocabN2 } from '../data/vocabN2';
import { grammarN2 } from '../data/grammarN2';

const QUIZ_VOCAB_COUNT = 4;
const QUIZ_GRAMMAR_COUNT = 3;

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function loadProgress() {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('n2Progress');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

function saveProgress(progress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('n2Progress', JSON.stringify(progress));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(list, count) {
  return shuffle(list).slice(0, count);
}

function buildVocabQuestion(item, pool) {
  const wrongOptions = pickRandom(pool.filter((v) => v.id !== item.id).map((v) => v.meaning), 3);
  const options = shuffle([item.meaning, ...wrongOptions]);
  return {
    id: `q_${item.id}`,
    type: 'vocab',
    prompt: `${item.word}（${item.reading}）是什么意思？`,
    options,
    answer: item.meaning
  };
}

function buildGrammarQuestion(item, pool) {
  const wrongOptions = pickRandom(pool.filter((g) => g.id !== item.id).map((g) => g.pattern), 3);
  const options = shuffle([item.pattern, ...wrongOptions]);
  const example = item.examples[0] || { jp: '', cn: '' };
  return {
    id: `q_${item.id}`,
    type: 'grammar',
    prompt: `${example.jp.replace(item.pattern, '＿＿')}`,
    extra: example.cn,
    options,
    answer: item.pattern
  };
}

export default function QuizPage() {
  const [progress, setProgress] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = loadProgress();
    setProgress(stored);
  }, []);

  useEffect(() => {
    if (!progress) return;
    const today = progress.today?.date === getTodayString() ? progress.today : null;
    const vocabPool = today ? today.vocabIds.map((id) => vocabN2.find((v) => v.id === id)).filter(Boolean) : [];
    const grammarPool = today ? today.grammarIds.map((id) => grammarN2.find((g) => g.id === id)).filter(Boolean) : [];

    const vocabSource = vocabPool.length ? vocabPool : pickRandom(vocabN2, QUIZ_VOCAB_COUNT);
    const grammarSource = grammarPool.length ? grammarPool : pickRandom(grammarN2, QUIZ_GRAMMAR_COUNT);

    const vocabQuestions = vocabSource.slice(0, QUIZ_VOCAB_COUNT).map((item) => buildVocabQuestion(item, vocabN2));
    const grammarQuestions = grammarSource.slice(0, QUIZ_GRAMMAR_COUNT).map((item) => buildGrammarQuestion(item, grammarN2));
    setQuestions([...vocabQuestions, ...grammarQuestions]);
  }, [progress]);

  const handleFinish = (payload) => {
    setResult(payload);
    const stored = loadProgress();
    if (!stored) return;
    const historyList = stored.history ? [...stored.history] : [];
    const today = getTodayString();
    const existingIndex = historyList.findIndex((item) => item.date === today);
    const base = existingIndex >= 0 ? historyList[existingIndex] : { date: today };
    const updated = { ...base, accuracy: payload.accuracy, completed: base.completed || false };
    if (existingIndex >= 0) {
      historyList[existingIndex] = updated;
    } else {
      historyList.unshift(updated);
    }
    const next = { ...stored, history: historyList };
    saveProgress(next);
    setProgress(next);
  };

  const titleText = useMemo(() => {
    if (!result) return '加油，答完看看自己的进步！';
    if (result.accuracy >= 90) return '几乎全对，好厉害！';
    if (result.accuracy >= 70) return '表现很好，保持哦';
    return '没关系，错的地方再看看就好';
  }, [result]);

  return (
    <div className="container">
      <div className="section">
        <div className="section-title">甜甜 N2 小测试</div>
        <div className="subtle-text">{titleText}</div>
      </div>

      {questions.length > 0 ? (
        <QuizPanel questions={questions} onFinish={handleFinish} />
      ) : (
        <div className="section">题目准备中...</div>
      )}

      <div className="section">
        <div className="section-title">历史记录</div>
        <HistoryList history={progress?.history || []} />
      </div>
    </div>
  );
}
