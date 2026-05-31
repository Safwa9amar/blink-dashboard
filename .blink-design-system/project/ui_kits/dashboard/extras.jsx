// extras.jsx — Live Ops (real-time feed & counters)
const { useState: useX, useEffect: useXE, useRef: useXR } = React;

/* ---------------- Live Ops ---------------- */
const EVENTS = [
  { ic: 'package', v: 'info', tt: ['Order ', '#4821', ' placed at ', 'Le Gourmet'], mt: 'Bab Ezzouar · 2,450 DA' },
  { ic: 'bike', v: 'success', tt: ['Rider ', 'Yacine H.', ' accepted a trip'], mt: 'El Harrach → Centre' },
  { ic: 'card', v: 'primary', tt: ['Deposit ', '5,000 DA', ' via agent QR'], mt: 'Superette El Baraka' },
  { ic: 'support', v: 'danger', tt: ['Dispute ', 'TK-3391', ' opened'], mt: 'Wrong address · urgent' },
  { ic: 'store', v: 'info', tt: ['New merchant ', 'Pizza Roma', ' went live'], mt: 'Rouiba · marketplace' },
  { ic: 'trending', v: 'success', tt: ['Order ', '#4815', ' delivered'], mt: 'Hydra · 18 min · ★ 5' },
  { ic: 'users', v: 'info', tt: ['New rider ', 'Riad M.', ' verified'], mt: 'Blida · motorcycle' },
  { ic: 'fire', v: 'warning', tt: ['Surge triggered in ', 'Bab Ezzouar'], mt: 'Demand 1.4× supply' },
];
const EV_BG = { info:'var(--info-light)', success:'var(--success-light)', primary:'var(--soft-pink)', danger:'var(--danger-light)', warning:'var(--warning-light)' };
const EV_FG = { info:'var(--info)', success:'var(--success)', primary:'var(--primary)', danger:'var(--danger)', warning:'var(--warning)' };

function LiveOps() {
  const [feed, setFeed] = useX(() => EVENTS.map((e, i) => ({ ...e, key: i, t: 2 + i * 3 })));
  const [kpi, setKpi] = useX({ active: 128, enroute: 86, online: 214, agents: 47 });
  const tick = useXR(0);

  useXE(() => {
    const id = setInterval(() => {
      tick.current += 1;
      // age the feed + occasionally prepend a new event
      setFeed(f => {
        const aged = f.map(e => ({ ...e, t: e.t + 4 }));
        if (tick.current % 2 === 0) {
          const src = EVENTS[Math.floor(Math.random() * EVENTS.length)];
          return [{ ...src, key: Date.now(), t: 1 }, ...aged].slice(0, 9);
        }
        return aged;
      });
      setKpi(k => ({
        active: Math.max(90, k.active + (Math.random() * 14 - 7) | 0),
        enroute: Math.max(60, k.enroute + (Math.random() * 10 - 5) | 0),
        online: Math.max(180, k.online + (Math.random() * 8 - 4) | 0),
        agents: k.agents,
      }));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const fmtT = s => s < 60 ? `${s}s ago` : `${Math.floor(s/60)}m ago`;
  const cov = Math.round((kpi.online / (kpi.active + kpi.enroute)) * 100);

  return (
    <div>
      <PageHeader title="Live Ops" description="Real-time activity across the network"
        actions={<span className="live-pill"><span className="dot"></span>Live</span>} />
      <div className="ops-grid">
        <div className="card">
          <div className="chart-head"><div className="lt"><h3>Activity feed</h3><p>Orders, trips, deposits, disputes &amp; signups — as they happen</p></div></div>
          <div className="feed">
            {feed.map(e => (
              <div className="feed-item" key={e.key}>
                <div className="feed-ic" style={{ background: EV_BG[e.v], color: EV_FG[e.v] }}><DIcon name={e.ic} style={{ width: 18, height: 18 }} /></div>
                <div className="feed-bd">
                  <div className="tt">{e.tt.map((p, i) => i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>)}</div>
                  <div className="mt">{e.mt}</div>
                </div>
                <span className="feed-time">{fmtT(e.t)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="map-side">
          <div className="card">
            <div className="chart-head" style={{ marginBottom: 8 }}><div className="lt"><h3>Live counters</h3></div></div>
            <div className="ops-kpi"><span className="k">Active deliveries</span><span className="v">{kpi.active}</span></div>
            <div className="ops-kpi"><span className="k">Riders en route</span><span className="v">{kpi.enroute}</span></div>
            <div className="ops-kpi"><span className="k">Riders online</span><span className="v">{kpi.online}</span>
              <div className="ops-bar"><i style={{ width: `${Math.min(100,cov)}%`, background: cov < 80 ? 'var(--warning)' : 'var(--success)' }}></i></div>
              <span className="k" style={{ fontSize: 11 }}>{cov}% demand coverage</span>
            </div>
            <div className="ops-kpi"><span className="k">Agents open now</span><span className="v">{kpi.agents}</span></div>
          </div>
          <div className="card">
            <div className="chart-head" style={{ marginBottom: 8 }}><div className="lt"><h3>System health</h3></div></div>
            <div className="sel-row" style={{ borderTop: 'none' }}><span className="k">API</span><Badge variant="success">operational</Badge></div>
            <div className="sel-row"><span className="k">Payments</span><Badge variant="success">operational</Badge></div>
            <div className="sel-row"><span className="k">Maps &amp; routing</span><Badge variant="warning">degraded</Badge></div>
            <div className="sel-row"><span className="k">Notifications</span><Badge variant="success">operational</Badge></div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LiveOps });
