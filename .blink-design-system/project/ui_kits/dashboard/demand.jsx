// demand.jsx — Demand dashboard (ops view: live order demand across the network)
const { useState: useDemandState } = React;

// hourly demand (orders) vs supply (online riders), 24h
const HOURS = [
  [6,18,30],[7,34,52],[8,72,88],[9,58,80],[10,40,70],[11,55,75],
  [12,128,120],[13,142,118],[14,96,110],[15,62,90],[16,70,95],[17,98,108],
  [18,150,124],[19,168,130],[20,140,128],[21,104,112],[22,66,84],[23,30,50],
];
const HMAX = 175;
const PEAK = 19; // 7pm

const SERVICES = [
  { name: 'Food', pct: 46, color: '#EE335F' },
  { name: 'Marketplace', pct: 28, color: '#3B82F6' },
  { name: 'Courier', pct: 16, color: '#FAAD14' },
  { name: 'Rides', pct: 10, color: '#10B981' },
];

const ZONES = [
  { z: 'Bab Ezzouar', area: 'Algiers Est', load: 96, tr: 14 },
  { z: 'Hydra', area: 'Algiers Centre', load: 88, tr: 9 },
  { z: 'El Harrach', area: 'Algiers Est', load: 74, tr: -4 },
  { z: 'Cheraga', area: 'Algiers Ouest', load: 67, tr: 6 },
  { z: 'Kouba', area: 'Algiers Centre', load: 58, tr: -2 },
  { z: 'Rouiba', area: 'Algiers Est', load: 41, tr: 11 },
];

// heatmap: rows = day parts, cols = zones, value 0-100 demand intensity
const HEAT_COLS = ['B.Ezz', 'Hydra', 'Harrach', 'Cheraga', 'Kouba', 'Rouiba'];
const HEAT_ROWS = [
  ['Morning', [60, 48, 40, 35, 30, 22]],
  ['Midday',  [85, 72, 60, 55, 48, 38]],
  ['Evening', [100, 92, 78, 70, 62, 45]],
  ['Late',    [54, 60, 44, 30, 26, 20]],
];
function heatColor(v) {
  // pink intensity ramp on dark
  const a = 0.12 + (v / 100) * 0.88;
  return `rgba(238,51,95,${a.toFixed(2)})`;
}

// map zones: x/y are % positions on the city canvas; full detail for the side panel
const MAP_ZONES = [
  { z: 'Bab Ezzouar', area: 'Algiers Est', x: 72, y: 44, load: 96, orders: 84, riders: 38, wait: '8.2m', unmet: 11 },
  { z: 'Hydra', area: 'Algiers Centre', x: 46, y: 52, load: 88, orders: 71, riders: 44, wait: '5.1m', unmet: 4 },
  { z: 'El Harrach', area: 'Algiers Est', x: 64, y: 64, load: 74, orders: 58, riders: 31, wait: '6.7m', unmet: 6 },
  { z: 'Cheraga', area: 'Algiers Ouest', x: 22, y: 46, load: 67, orders: 49, riders: 33, wait: '5.8m', unmet: 3 },
  { z: 'Kouba', area: 'Algiers Centre', x: 52, y: 70, load: 58, orders: 41, riders: 28, wait: '4.9m', unmet: 2 },
  { z: 'Rouiba', area: 'Algiers Est', x: 88, y: 56, load: 41, orders: 27, riders: 18, wait: '7.1m', unmet: 5 },
];
// scattered rider dots (decorative)
const RIDERS = [[68,40],[75,48],[44,56],[49,47],[60,60],[66,68],[25,42],[19,50],[55,66],[50,74],[85,52],[90,60],[58,52],[38,60],[71,58],[30,55],[63,38],[47,64]];

function DemandMap({ zones, selected, onSelect }) {
  const sel = zones.find(z => z.z === selected) || zones[0];
  const bubbleSize = (load) => 30 + (load / 100) * 54; // 30..84px
  return (
    <div className="map-grid">
      <div className="map-card">
        <div className="map-canvas">
          {/* stylized coastal city backdrop */}
          <svg className="map-bg" viewBox="0 0 800 550" preserveAspectRatio="xMidYMid slice">
            <rect width="800" height="550" fill="var(--muted)" />
            {/* Mediterranean bay along the top */}
            <path d="M0 0 H800 V92 C620 150 460 70 300 118 C190 150 90 110 0 140 Z" fill="color-mix(in srgb, var(--info) 16%, var(--muted))" />
            <path d="M0 140 C90 110 190 150 300 118 C460 70 620 150 800 92" fill="none" stroke="color-mix(in srgb, var(--info) 40%, transparent)" strokeWidth="2" />
            {/* roads */}
            <g stroke="var(--border)" strokeWidth="6" fill="none" opacity="0.9">
              <path d="M60 150 L360 300 L760 250" />
              <path d="M120 520 L300 320 L520 360 L720 180" />
              <path d="M400 540 L420 320 L520 150" />
              <path d="M40 360 L300 320 L640 460" />
              <path d="M700 540 L620 300 L760 120" />
            </g>
            <g stroke="var(--border)" strokeWidth="2.5" fill="none" opacity="0.5">
              <path d="M200 180 L240 420" /><path d="M520 200 L480 500" /><path d="M120 280 L700 300" />
              <path d="M300 130 L340 520" /><path d="M600 160 L560 520" />
            </g>
          </svg>

          {/* rider dots */}
          {RIDERS.map(([x, y], i) => <div key={i} className="map-rider" style={{ left: `${x}%`, top: `${y}%` }} />)}

          {/* zone demand bubbles */}
          {zones.map(z => {
            const s = bubbleSize(z.load);
            const isHot = z.load >= 90;
            const isSel = z.z === sel.z;
            return (
              <React.Fragment key={z.z}>
                <div className="map-bubble" onClick={() => onSelect(z.z)}
                  style={{ left: `${z.x}%`, top: `${z.y}%`, width: s, height: s, background: heatColor(z.load),
                    borderColor: isSel ? '#fff' : 'rgba(255,255,255,0.6)', boxShadow: isSel ? '0 0 0 3px var(--primary)' : 'none' }}>
                  {isHot && <span className="pulse"></span>}
                  <span className="v" style={{ fontSize: s > 56 ? 18 : 13 }}>{z.orders}</span>
                </div>
                <div className="map-label" style={{ left: `${z.x}%`, top: `calc(${z.y}% + ${s / 2 + 4}px)` }}>{z.z}</div>
              </React.Fragment>
            );
          })}

          <div className="map-legend">
            <span className="t">Demand</span>
            <div className="row"><span className="bub" style={{ width: 10, height: 10 }}></span>Light</div>
            <div className="row"><span className="bub" style={{ width: 18, height: 18 }}></span>Heavy</div>
            <div className="row"><span className="rdot"></span>Online rider</div>
          </div>
        </div>
      </div>

      <div className="map-side">
        <div className="card sel-zone">
          <div className="nm">{sel.z}</div>
          <div className="area">{sel.area}</div>
          <div className="sel-row"><span className="k">Live orders</span><span className="v">{sel.orders}</span></div>
          <div className="sel-row"><span className="k">Online riders</span><span className="v">{sel.riders}</span></div>
          <div className="sel-row"><span className="k">Demand load</span><span className="v" style={{ color: 'var(--primary)' }}>{sel.load}%</span></div>
          <div className="sel-row"><span className="k">Avg wait</span><span className="v">{sel.wait}</span></div>
          <div className="sel-row"><span className="k">Unmet demand</span><span className="v" style={{ color: sel.unmet > 6 ? 'var(--danger)' : 'var(--text)' }}>{sel.unmet}</span></div>
          <p className="hint">Click any bubble to inspect a zone. Bubble size &amp; colour scale with live demand.</p>
        </div>
        <div className="card">
          <div className="chart-head" style={{ marginBottom: 12 }}><div className="lt"><h3>Surge suggestion</h3></div></div>
          <div className="sel-row" style={{ borderTop: 'none' }}><span className="k">Status</span>
            <span className="badge" style={{ background: sel.unmet > 6 ? 'var(--danger-light)' : 'var(--success-light)', color: sel.unmet > 6 ? 'var(--danger)' : 'var(--success)' }}>
              {sel.unmet > 6 ? 'Rebalance riders' : 'Balanced'}</span></div>
          <p className="hint">{sel.unmet > 6
            ? `${sel.z} has ${sel.unmet} unmet orders — consider a +${Math.ceil(sel.unmet/2)} rider incentive.`
            : `${sel.z} supply is keeping up with demand.`}</p>
        </div>
      </div>
    </div>
  );
}

function Demand() {
  const [view, setView] = useDemandState('analytics');
  const [zone, setZone] = useDemandState('Bab Ezzouar');
  // build conic-gradient for donut
  let acc = 0;
  const stops = SERVICES.map(s => {
    const start = acc; acc += s.pct;
    return `${s.color} ${start}% ${acc}%`;
  }).join(', ');

  return (
    <div>
      <PageHeader
        title="Demand"
        description="Live order demand across the network"
        actions={<>
          <div className="view-toggle">
            <button className={view === 'analytics' ? 'on' : ''} onClick={() => setView('analytics')}><DIcon name="grid" style={{ width: 15, height: 15 }} />Analytics</button>
            <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><DIcon name="map" style={{ width: 15, height: 15 }} />Map</button>
          </div>
          <span className="live-pill"><span className="dot"></span>Live · 12s ago</span>
        </>}
      />

      {/* stat row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label="Live Orders" value={342} variant="primary" icon="package" change="▲ 18% vs 1h ago" />
        <StatCard label="Demand Index" value="1.27" variant="warning" icon="trending" change="High — above supply" />
        <StatCard label="Unmet Demand" value={28} variant="danger" icon="fire" change="No rider within 8 min" />
        <StatCard label="Online Riders" value={214} variant="info" icon="bike" change="63% of demand covered" />
        <StatCard label="Avg Wait" value="6.4m" variant="success" icon="clock" change="▼ 1.1m vs yesterday" />
      </div>

      {view === 'map' ? (
        <DemandMap zones={MAP_ZONES} selected={zone} onSelect={setZone} />
      ) : (
      <React.Fragment>
      {/* hourly demand vs supply + service mix */}
      <div className="dem-grid">
        <div className="card">
          <div className="chart-head">
            <div className="lt"><h3>Demand vs Supply — today</h3><p>Orders placed against online riders, by hour</p></div>
            <div className="legend">
              <span className="lg"><span className="sw" style={{ background: 'var(--primary)' }}></span>Demand</span>
              <span className="lg"><span className="sw" style={{ background: 'color-mix(in srgb,var(--info) 55%,transparent)' }}></span>Riders</span>
            </div>
          </div>
          <div className="hours">
            {HOURS.map(([h, dem, sup]) => (
              <div className="col" key={h} title={`${h}:00 — ${dem} orders / ${sup} riders`}>
                {h === PEAK && <span className="peak-tag">Peak</span>}
                <div className="stack">
                  <div className="dem" style={{ height: `${(dem / HMAX) * 100}%` }}></div>
                </div>
                <span className="hr">{h}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="chart-head"><div className="lt"><h3>Service mix</h3><p>Share of live demand</p></div></div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
              <div className="ctr"><b>342</b><span>orders</span></div>
            </div>
            <div className="dleg">
              {SERVICES.map(s => (
                <div className="row" key={s.name}>
                  <span className="sw" style={{ background: s.color }}></span>
                  <span className="nm">{s.name}</span>
                  <span className="pc">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* heatmap + top zones */}
      <div className="dem-grid b">
        <div className="card">
          <div className="chart-head">
            <div className="lt"><h3>Demand heatmap</h3><p>Intensity by zone &amp; day-part</p></div>
            <div className="legend">
              <span className="lg">Low</span>
              <span className="sw" style={{ background: heatColor(20), width: 14, height: 10, borderRadius: 3 }}></span>
              <span className="sw" style={{ background: heatColor(60), width: 14, height: 10, borderRadius: 3 }}></span>
              <span className="sw" style={{ background: heatColor(100), width: 14, height: 10, borderRadius: 3 }}></span>
              <span className="lg">High</span>
            </div>
          </div>
          <div className="heat">
            <div className="corner"></div>
            {HEAT_COLS.map(c => <div className="colh" key={c}>{c}</div>)}
            {HEAT_ROWS.map(([row, vals]) => (
              <React.Fragment key={row}>
                <div className="rowh">{row}</div>
                {vals.map((v, i) => <div className="cell" key={i} style={{ background: heatColor(v) }} title={`${row} · ${HEAT_COLS[i]} — ${v}`}>{v}</div>)}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="chart-head"><div className="lt"><h3>Top demand zones</h3><p>Live load &amp; 1-hour trend</p></div></div>
          <div>
            {ZONES.map((z, i) => (
              <div className="zone" key={z.z}>
                <span className="rk">{i + 1}</span>
                <div className="zn"><b>{z.z}</b><span>{z.area}</span></div>
                <div className="bar"><i style={{ width: `${z.load}%` }}></i></div>
                <span className={`tr ${z.tr >= 0 ? 'up' : 'dn'}`}>{z.tr >= 0 ? '▲' : '▼'} {Math.abs(z.tr)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { Demand });
