import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardSummary from '../components/DashboardSummary';
import StudySession from '../components/StudySession';
import { vocabN2 } from '../data/vocabN2';
import { grammarN2 } from '../data/grammarN2';
import { phrasesN2 } from '../data/phrasesN2';

// 可以在这里修改每日新单词和新语法数量
const DAILY_NEW_VOCAB = 12;
const DAILY_NEW_PHRASE = 5;
const DAILY_NEW_GRAMMAR = 3;
const MAX_DAILY_ITEMS = 20;
const MAX_DAILY_VOCAB = 12;
const MAX_DAILY_PHRASE = 5;
const MIN_DAILY_GRAMMAR = 3;

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

function daysUntilExam() {
  const today = new Date(getTodayString());
  const examDate = new Date('2026-07-06');
  const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function previousDateString(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function prepareBlankProgress() {
  return {
    vocabStatus: {},
    phraseStatus: {},
    grammarStatus: {},
    pending: {
      vocabIds: [],
      phraseIds: [],
      grammarIds: []
    },
    today: {
      date: '',
      vocabIds: [],
      phraseIds: [],
      grammarIds: [],
      completedIds: [],
      summary: { newVocab: 0, reviewVocab: 0, newPhrase: 0, reviewPhrase: 0, newGrammar: 0, reviewGrammar: 0 },
      studyDone: false,
      quizDone: false
    },
    history: []
  };
}

function loadProgress() {
  if (typeof window === 'undefined') return prepareBlankProgress();
  const saved = localStorage.getItem('n2Progress');
  if (!saved) return prepareBlankProgress();
  try {
    const parsed = JSON.parse(saved);
    const blank = prepareBlankProgress();
    return {
      ...blank,
      ...parsed,
      vocabStatus: parsed.vocabStatus || {},
      phraseStatus: parsed.phraseStatus || {},
      grammarStatus: parsed.grammarStatus || {},
      pending: { ...blank.pending, ...(parsed.pending || {}) },
      today: { ...blank.today, ...(parsed.today || {}) },
      history: parsed.history || []
    };
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

function getStreakLevel(days) {
  if (days >= 20) return '星光守护者';
  if (days >= 14) return '稳步达人';
  if (days >= 7) return '云上进阶';
  if (days >= 3) return '萌芽连击';
  if (days >= 1) return '起步之光';
  return '等待出发';
}

function calculateStreak(history = []) {
  if (!history.length) return { days: 0, level: getStreakLevel(0) };

  const completed = history
    .filter((item) => item.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!completed.length) return { days: 0, level: getStreakLevel(0) };

  let streak = 0;
  let expectedPrev = null;

  for (let i = 0; i < completed.length; i += 1) {
    const currentDate = completed[i].date;
    if (streak === 0) {
      streak = 1;
      expectedPrev = previousDateString(currentDate);
      continue;
    }

    if (currentDate === expectedPrev) {
      streak += 1;
      expectedPrev = previousDateString(currentDate);
    } else if (currentDate < expectedPrev) {
      break;
    }
  }

  return { days: streak, level: getStreakLevel(streak) };
}

function prepareToday(progress) {
  const today = getTodayString();

  const todayCount = progress.today.vocabIds.length + progress.today.phraseIds.length + progress.today.grammarIds.length;
  if (progress.today.date === today && todayCount > 0) {
    return progress;
  }

  const previousToday = progress.today || {};
  const shouldCarryOver = previousToday.date && previousToday.date !== today && !(previousToday.studyDone && previousToday.quizDone);
  const carryoverVocab = shouldCarryOver ? previousToday.vocabIds : [];
  const carryoverPhrase = shouldCarryOver ? previousToday.phraseIds : [];
  const carryoverGrammar = shouldCarryOver ? previousToday.grammarIds : [];

  const pending = progress.pending || { vocabIds: [], phraseIds: [], grammarIds: [] };

  const dueVocab = Object.entries(progress.vocabStatus)
    .filter(([, value]) => value.nextReviewDate && value.nextReviewDate <= today)
    .map(([id]) => id);
  const duePhrase = Object.entries(progress.phraseStatus)
    .filter(([, value]) => value.nextReviewDate && value.nextReviewDate <= today)
    .map(([id]) => id);
  const dueGrammar = Object.entries(progress.grammarStatus)
    .filter(([, value]) => value.nextReviewDate && value.nextReviewDate <= today)
    .map(([id]) => id);

  const newVocabCandidates = vocabN2.filter((item) => !progress.vocabStatus[item.id]).slice(0, DAILY_NEW_VOCAB * 3);
  const newPhraseCandidates = phrasesN2.filter((item) => !progress.phraseStatus[item.id]).slice(0, DAILY_NEW_PHRASE * 3);
  const newGrammarCandidates = grammarN2.filter((item) => !progress.grammarStatus[item.id]).slice(0, DAILY_NEW_GRAMMAR * 3);

  const queue = [];
  const pushUnique = (type, id) => {
    if (!queue.some((item) => item.type === type && item.id === id)) {
      queue.push({ type, id });
    }
  };

  pending.vocabIds.forEach((id) => pushUnique('vocab', id));
  pending.phraseIds.forEach((id) => pushUnique('phrase', id));
  pending.grammarIds.forEach((id) => pushUnique('grammar', id));
  carryoverVocab.forEach((id) => pushUnique('vocab', id));
  carryoverPhrase.forEach((id) => pushUnique('phrase', id));
  carryoverGrammar.forEach((id) => pushUnique('grammar', id));
  dueVocab.forEach((id) => pushUnique('vocab', id));
  duePhrase.forEach((id) => pushUnique('phrase', id));
  dueGrammar.forEach((id) => pushUnique('grammar', id));
  newVocabCandidates.forEach((item) => pushUnique('vocab', item.id));
  newPhraseCandidates.forEach((item) => pushUnique('phrase', item.id));
  newGrammarCandidates.forEach((item) => pushUnique('grammar', item.id));

  const vocabQueue = queue.filter((item) => item.type === 'vocab').map((item) => item.id);
  const phraseQueue = queue.filter((item) => item.type === 'phrase').map((item) => item.id);
  const grammarQueue = queue.filter((item) => item.type === 'grammar').map((item) => item.id);

  const todayGrammar = grammarQueue.slice(0, Math.min(MIN_DAILY_GRAMMAR, MAX_DAILY_ITEMS));
  const remainingSlots = Math.max(MAX_DAILY_ITEMS - todayGrammar.length, 0);
  const todayPhrases = phraseQueue.slice(0, Math.min(MAX_DAILY_PHRASE, remainingSlots));
  const vocabSlots = Math.max(remainingSlots - todayPhrases.length, 0);
  const todayVocab = vocabQueue.slice(0, Math.min(MAX_DAILY_VOCAB, vocabSlots));

  const grammarDeferred = grammarQueue.slice(todayGrammar.length);
  const phraseDeferred = phraseQueue.slice(todayPhrases.length);
  const vocabDeferred = vocabQueue.slice(todayVocab.length);

  const nextPending = {
    vocabIds: vocabDeferred,
    phraseIds: phraseDeferred,
    grammarIds: grammarDeferred
  };

  const newVocab = vocabN2.filter((item) => todayVocab.includes(item.id) && !progress.vocabStatus[item.id]);
  const newPhrase = phrasesN2.filter((item) => todayPhrases.includes(item.id) && !progress.phraseStatus[item.id]);
  const newGrammar = grammarN2.filter((item) => todayGrammar.includes(item.id) && !progress.grammarStatus[item.id]);

  const updatedStatus = { ...progress };
  newVocab.forEach((item) => {
    updatedStatus.vocabStatus[item.id] = { lastReviewedAt: null, nextReviewDate: today, ease: 'new' };
  });
  newPhrase.forEach((item) => {
    updatedStatus.phraseStatus[item.id] = { lastReviewedAt: null, nextReviewDate: today, ease: 'new' };
  });
  newGrammar.forEach((item) => {
    updatedStatus.grammarStatus[item.id] = { lastReviewedAt: null, nextReviewDate: today, ease: 'new' };
  });

  updatedStatus.today = {
    date: today,
    vocabIds: todayVocab,
    phraseIds: todayPhrases,
    grammarIds: todayGrammar,
    completedIds: [],
    studyDone: false,
    quizDone: false,
    summary: {
      newVocab: newVocab.length,
      reviewVocab: Math.max(todayVocab.length - newVocab.length, 0),
      newPhrase: newPhrase.length,
      reviewPhrase: Math.max(todayPhrases.length - newPhrase.length, 0),
      newGrammar: newGrammar.length,
      reviewGrammar: Math.max(todayGrammar.length - newGrammar.length, 0)
    }
  };
  updatedStatus.pending = nextPending;

  updatedStatus.history = ensureHistory(updatedStatus, { studyDone: false, quizDone: false });
  saveProgress(updatedStatus);
  return updatedStatus;
}

export default function Home() {
  const [progress, setProgress] = useState(null);

  const examCountdown = useMemo(() => daysUntilExam(), []);

  const refreshProgress = useCallback(() => {
    const loaded = loadProgress();
    const prepared = prepareToday(loaded);
    setProgress(prepared);
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  useEffect(() => {
    // 返回首页或标签页重新聚焦时，重新读取进度，确保「最近几天」和连续天数即时更新
    const handleFocus = () => refreshProgress();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshProgress();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleFocus);
    };
  }, [refreshProgress]);

  const vocabMap = useMemo(() => buildMap(vocabN2), []);
  const phraseMap = useMemo(() => buildMap(phrasesN2), []);
  const grammarMap = useMemo(() => buildMap(grammarN2), []);

  const studyCards = useMemo(() => {
    if (!progress) return [];
    const { today } = progress;
    const vocabCards = today.vocabIds.map((id) => ({ ...vocabMap[id], type: 'vocab', completed: today.completedIds.includes(id) })).filter(Boolean);
    const phraseCards = today.phraseIds.map((id) => ({ ...phraseMap[id], type: 'phrase', completed: today.completedIds.includes(id) })).filter(Boolean);
    const grammarCards = today.grammarIds.map((id) => ({ ...grammarMap[id], type: 'grammar', completed: today.completedIds.includes(id) })).filter(Boolean);
    return [...vocabCards, ...phraseCards, ...grammarCards];
  }, [progress, vocabMap, phraseMap, grammarMap]);

  const progressPercent = useMemo(() => {
    if (!progress) return 0;
    const total = progress.today.vocabIds.length + progress.today.phraseIds.length + progress.today.grammarIds.length;
    if (total === 0) return 0;
    return Math.round((progress.today.completedIds.length / total) * 100);
  }, [progress]);

  const streakInfo = useMemo(() => calculateStreak(progress?.history || []), [progress]);

  const studyDone = progress?.today?.studyDone || false;
  const quizDone = progress?.today?.quizDone || false;
  const todayCompleted = studyDone && quizDone;

  const handleRate = (card, level) => {
    const today = getTodayString();
    const updated = { ...progress };
    const targetKey = card.type === 'vocab' ? 'vocabStatus' : card.type === 'phrase' ? 'phraseStatus' : 'grammarStatus';
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

    const total = updated.today.vocabIds.length + updated.today.phraseIds.length + updated.today.grammarIds.length;
    const completedAll = updated.today.completedIds.length >= total && total > 0;
    updated.today.studyDone = completedAll || updated.today.studyDone;
    updated.history = ensureHistory(updated, {
      studyDone: updated.today.studyDone,
      quizDone: updated.today.quizDone
    });

    setProgress(updated);
    saveProgress(updated);
  };

  if (!progress) {
    return <div className="container">加载中...</div>;
  }

  const summary = progress.today.summary;

  const shareTitle = '小雨的 N2 学习桌';
  const shareDescription = '为小雨准备的 JLPT N2 轻量学习与测试工具，包含间隔复习、卡片练习与轻量测试。';
  const shareImage = '/share-card.svg';

  return (
    <div className="container">
      <Head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        {/* 微信/朋友圈分享时的展示信息 */}
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
      </Head>

      <DashboardSummary
        summary={summary}
        progressPercent={progressPercent}
        streakDays={streakInfo.days}
        streakLevel={streakInfo.level}
        examCountdown={examCountdown}
        todayCompleted={todayCompleted}
        studyDone={studyDone}
        quizDone={quizDone}
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

      <footer className="app-footer">By Xixi · v3.0.3</footer>
    </div>
  );
}
