export default function AdminLoading() {
  return <div aria-busy="true" aria-label="Loading dashboard">
    <div className="head"><div className="skeleton loading-title" /></div>
    <div className="grid g4 loading-stats">{Array.from({ length: 6 }, (_, index) => <div className="card stat" key={index}><div className="skeleton loading-label" /><div className="skeleton loading-value" /></div>)}</div>
    <div className="grid g2 loading-lists">{Array.from({ length: 2 }, (_, index) => <div className="card" key={index}><div className="skeleton loading-heading" />{Array.from({ length: 4 }, (_, row) => <div className="skeleton loading-row" key={row} />)}</div>)}</div>
  </div>;
}