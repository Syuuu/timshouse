import Head from 'next/head';
import { useEffect, useState } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem('n2NoticeSeen');
    if (!seen) {
      setShowNotice(true);
    }
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('n2NoticeSeen', 'true');
    }
    setShowNotice(false);
  };

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" />
      </Head>
      {showNotice && (
        <div className="notice-overlay">
          <div className="notice-card">
            <div className="notice-title">给小昕</div>
            <div className="notice-text">
              回去之后也要好好照顾好自己，好好学习日语哦，不许偷懒！我们明年见！
            </div>
            <button className="primary-button" onClick={handleClose}>收到啦</button>
          </div>
        </div>
      )}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
