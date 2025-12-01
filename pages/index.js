import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import DashboardSummary from '../components/DashboardSummary';
import StudySession from '../components/StudySession';
import { vocabN2 } from '../data/vocabN2';
import { grammarN2 } from '../data/grammarN2';

// 可以在这里修改每日新单词和新语法数量
const DAILY_NEW_VOCAB = 3;
const DAILY_NEW_GRAMMAR = 2;

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function addDays(baseDate, days) {
  // 如果想调整 1 天 / 3 天 / 7 天 的间隔，可以修改这里的逻辑
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function prepareBlankProgress() {
  return {
    vocabStatus: {},
    grammarStatus: {},
    today: {
      date: '',
      vocabIds: [],
      grammarIds: [],
      completedIds: [],
      summary: { newVocab: 0, reviewVocab: 0, newGrammar: 0, reviewGrammar: 0 }
    },
    history: []
  };
}

function loadProgress() {
  if (typeof window === 'undefined') return prepareBlankProgress();
  const saved = localStorage.getItem('n2Progress');
  if (!saved) return prepareBlankProgress();
  try {
    return { ...prepareBlankProgress(), ...JSON.parse(saved) };
  } catch (e) {
    return prepareBlankProgress();
  }
}

function saveProgress(progress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('n2Progress', JSON.stringify(progress));
}

function buildMap(list) {
  const map = {};
  list.forEach((item) => {
    map[item.id] = item;
  });
  return map;
}

function ensureHistory(progress, completed) {
  const today = getTodayString();
  const historyList = progress.history ? [...progress.history] : [];
  const existingIndex = historyList.findIndex((item) => item.date === today);
  const base = existingIndex >= 0 ? historyList[existingIndex] : { date: today };
  const updated = { ...base, completed };
  if (existingIndex >= 0) {
    historyList[existingIndex] = updated;
  } else {
    historyList.unshift(updated);
  }
  return historyList;
}

function prepareToday(progress) {
  const today = getTodayString();

  if (progress.today.date === today && progress.today.vocabIds.length > 0) {
    return progress;
  }

  const dueVocab = Object.entries(progress.vocabStatus)
    .filter(([, value]) => value.nextReviewDate && value.nextReviewDate <= today)
    .map(([id]) => id);
  const dueGrammar = Object.entries(progress.grammarStatus)
    .filter(([, value]) => value.nextReviewDate && value.nextReviewDate <= today)
    .map(([id]) => id);

  const newVocab = vocabN2.filter((item) => !progress.vocabStatus[item.id]).slice(0, DAILY_NEW_VOCAB);
  const newGrammar = grammarN2.filter((item) => !progress.grammarStatus[item.id]).slice(0, DAILY_NEW_GRAMMAR);

  const todayVocab = [...dueVocab, ...newVocab.map((item) => item.id)];
  const todayGrammar = [...dueGrammar, ...newGrammar.map((item) => item.id)];

  const updatedStatus = { ...progress };
  newVocab.forEach((item) => {
    updatedStatus.vocabStatus[item.id] = { lastReviewedAt: null, nextReviewDate: today, ease: 'new' };
  });
  newGrammar.forEach((item) => {
    updatedStatus.grammarStatus[item.id] = { lastReviewedAt: null, nextReviewDate: today, ease: 'new' };
  });

  updatedStatus.today = {
    date: today,
    vocabIds: todayVocab,
    grammarIds: todayGrammar,
    completedIds: [],
    summary: {
      newVocab: newVocab.length,
      reviewVocab: dueVocab.length,
      newGrammar: newGrammar.length,
      reviewGrammar: dueGrammar.length
    }
  };

  updatedStatus.history = ensureHistory(updatedStatus, false);
  saveProgress(updatedStatus);
  return updatedStatus;
}

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [encouragement, setEncouragement] = useState('');

  useEffect(() => {
    const encourages = [
      '今天留一点时间给小雨的日语旅程吧',
      '再忙也能轻松学 10 分钟，稳稳向前',
      '保持节奏，每天一点点就能看见进步'
    ];
    setEncouragement(encourages[Math.floor(Math.random() * encourages.length)]);
  }, []);

  useEffect(() => {
    const loaded = loadProgress();
    const prepared = prepareToday(loaded);
    setProgress(prepared);
  }, []);

  const vocabMap = useMemo(() => buildMap(vocabN2), []);
  const grammarMap = useMemo(() => buildMap(grammarN2), []);

  const studyCards = useMemo(() => {
    if (!progress) return [];
    const { today } = progress;
    const vocabCards = today.vocabIds.map((id) => ({ ...vocabMap[id], type: 'vocab', completed: today.completedIds.includes(id) })).filter(Boolean);
    const grammarCards = today.grammarIds.map((id) => ({ ...grammarMap[id], type: 'grammar', completed: today.completedIds.includes(id) })).filter(Boolean);
    return [...vocabCards, ...grammarCards];
  }, [progress, vocabMap, grammarMap]);

  const progressPercent = useMemo(() => {
    if (!progress) return 0;
    const total = progress.today.vocabIds.length + progress.today.grammarIds.length;
    if (total === 0) return 0;
    return Math.round((progress.today.completedIds.length / total) * 100);
  }, [progress]);

  const handleRate = (card, level) => {
    const today = getTodayString();
    const updated = { ...progress };
    const targetKey = card.type === 'vocab' ? 'vocabStatus' : 'grammarStatus';
    const status = updated[targetKey][card.id] || {};

    let days = 1;
    if (level === 'so-so') days = 3;
    if (level === 'easy') days = 7;
    const nextReviewDate = addDays(today, days);

    updated[targetKey] = {
      ...updated[targetKey],
      [card.id]: {
        ...status,
        lastReviewedAt: today,
        nextReviewDate,
        ease: level
      }
    };

    if (!updated.today.completedIds.includes(card.id)) {
      updated.today.completedIds = [...updated.today.completedIds, card.id];
    }

    const total = updated.today.vocabIds.length + updated.today.grammarIds.length;
    const completedAll = updated.today.completedIds.length >= total && total > 0;
    updated.history = ensureHistory(updated, completedAll);

    setProgress(updated);
    saveProgress(updated);
  };

  if (!progress) {
    return <div className="container">加载中...</div>;
  }

  const summary = progress.today.summary;

  return (
    <div className="container">
      <Head>
        <title>小雨的 N2 学习桌</title>
        <meta name="description" content="为小雨准备的 JLPT N2 轻量学习与测试工具" />
      </Head>

      <DashboardSummary
        summary={summary}
        progressPercent={progressPercent}
        encouragement={encouragement}
        onStartStudy={() => {
          const studyBlock = document.getElementById('study');
          if (studyBlock) studyBlock.scrollIntoView({ behavior: 'smooth' });
        }}
        onStartQuiz={() => {
          window.location.href = '/quiz';
        }}
        history={progress.history || []}
      />

      <div id="study">
        <StudySession cards={studyCards} onRate={handleRate} />
      </div>
    </div>
  );
}
