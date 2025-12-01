import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import QuizPanel from '../components/QuizPanel';
import HistoryList from '../components/HistoryList';
import { vocabN2 } from '../data/vocabN2';
import { grammarN2 } from '../data/grammarN2';

const QUIZ_VOCAB_COUNT = 5;
const QUIZ_GRAMMAR_COUNT = 15;

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function loadProgress() {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('n2Progress');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    const blankToday = {
      date: '',
      vocabIds: [],
      grammarIds: [],
      completedIds: [],
      summary: { newVocab: 0, reviewVocab: 0, newGrammar: 0, reviewGrammar: 0 },
      studyDone: false,
      quizDone: false
    };
    return {
      ...parsed,
      vocabStatus: parsed.vocabStatus || {},
      grammarStatus: parsed.grammarStatus || {},
      today: { ...blankToday, ...(parsed.today || {}) },
      history: parsed.history || []
    };
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

function ensureHistory(progress, payload = {}) {
  const today = getTodayString();
  const historyList = progress.history ? [...progress.history] : [];
  const existingIndex = historyList.findIndex((item) => item.date === today);
  const base = existingIndex >= 0 ? historyList[existingIndex] : { date: today };
  const updated = {
    ...base,
    studyDone: payload.studyDone ?? base.studyDone ?? false,
    quizDone: payload.quizDone ?? base.quizDone ?? false,
    accuracy: payload.accuracy ?? base.accuracy
  };
  updated.completed = Boolean(updated.studyDone && updated.quizDone);

  if (existingIndex >= 0) {
    historyList[existingIndex] = updated;
  } else {
    historyList.unshift(updated);
  }

  return historyList;
}

function maskGrammarSentence(example, pattern) {
  const jp = example?.jp || '';
  // 去掉「〜」后尝试挖空，避免直接暴露正确答案
  const plain = pattern.replace(/[〜~]/g, '');
  if (plain && jp.includes(plain)) {
    return jp.replace(plain, '＿＿');
  }
  return `${jp}（请选择合适的语法填空）`;
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
  const prompt = maskGrammarSentence(example, item.pattern);
  return {
    id: `q_${item.id}`,
    type: 'grammar',
    prompt,
    extra: example.cn,
    options,
    answer: item.pattern
  };
}

export default function QuizPage() {
  const router = useRouter();
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
    const next = { ...stored, today: { ...(stored.today || {}) } };
    if (next.today?.date === getTodayString()) {
      next.today.quizDone = true;
    }
    const historyList = ensureHistory(next, {
      quizDone: true,
      studyDone: next.today?.studyDone,
      accuracy: payload.accuracy
    });
    next.history = historyList;
    saveProgress(next);
    setProgress(next);
  };

  const titleText = useMemo(() => {
    if (!result) return '完成全部题目后查看本次表现';
    if (result.accuracy >= 90) return '几乎全对，保持这份手感';
    if (result.accuracy >= 70) return '表现不错，巩固一下细节就好';
    return '记录一下错题，下一次就能更稳';
  }, [result]);

  return (
    <div className="container">
      <Head>
        <title>小雨的 N2 小测试</title>
        <meta name="description" content="为小雨设计的 JLPT N2 每日巩固小测" />
      </Head>
      <div className="section">
        <div className="section-title">小雨 N2 小测试</div>
        <div className="subtle-text">{titleText}</div>
        <div className="actionRow" style={{ marginTop: 10 }}>
          <button className="ghost-button" onClick={() => router.back()}>返回上一页</button>
          <button className="ghost-button" onClick={() => router.push('/')}>回到首页</button>
        </div>
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
