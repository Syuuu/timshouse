export default function HistoryList({ history = [] }) {
  if (!history.length) {
    return <div className="subtle-text">暂无历史记录</div>;
  }

  return (
    <div className="card-stack">
      {history.slice(0, 10).map((item) => (
        <div key={item.date} className="card">
          <div style={{ fontWeight: 700 }}>{item.date}</div>
          <div className="subtle-text">完成情况：{item.completed ? '已完成' : '未完成'}</div>
          <div className="subtle-text">测试正确率：{item.accuracy ? `${item.accuracy}%` : '暂无'}</div>
        </div>
      ))}
    </div>
  );
}
