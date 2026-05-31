// Cash.jsx — Blink Cash / Dues wallet (spec page 7) with PIN gate
const { useState: useStateC } = React;

function PinGate({ onUnlock }) {
  const [pin, setPin] = useStateC('');
  const press = (d) => {
    if (d === 'del') { setPin(p => p.slice(0, -1)); return; }
    setPin(p => {
      if (p.length >= 4) return p;
      const next = p + d;
      if (next.length === 4) setTimeout(onUnlock, 220);
      return next;
    });
  };
  const keys = ['1','2','3','4','5','6','7','8','9','reset','0','del'];
  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 30px 30px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--blink-tint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="wallet" size={30} color="var(--blink-500)" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--slate-900)', marginTop: 18 }}>Enter your PIN</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--slate-500)', marginTop: 4, textAlign: 'center' }}>Secure access to Blink Cash</div>
      <div style={{ display: 'flex', gap: 16, margin: '34px 0 30px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 99, background: i < pin.length ? 'var(--blink-500)' : 'var(--slate-200)', transition: 'background .15s' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 18, justifyContent: 'center' }}>
        {keys.map(k => {
          if (k === 'reset') return <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--blink-500)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setPin('')}>Reset</div>;
          if (k === 'del') return <button key={k} onClick={() => press('del')} style={{ ...iconBtn, justifySelf: 'center' }}><Icon name="arrowLeft" size={24} color="var(--slate-500)" /></button>;
          return <button key={k} onClick={() => press(k)} style={{ width: 72, height: 72, borderRadius: 99, border: 'none', background: 'var(--slate-50)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--slate-900)', cursor: 'pointer' }}>{k}</button>;
        })}
      </div>
      <div style={{ marginTop: 'auto', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--blink-500)', fontWeight: 600 }}>Reset Password</div>
    </div>
  );
}

function StoreDues({ name, profit, dues, fees, open, onToggle, onPay }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="store" size={20} color="var(--blink-500)" /></div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--slate-900)' }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--blink-600)', fontWeight: 600 }}>{dues} DZD due</div>
        </div>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={20} color="var(--slate-400)" />
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <Row label="Total profit" value={`${profit} DZD`} />
          <Row label="Dues payable" value={`${dues} DZD`} color="var(--blink-600)" />
          <Row label="Fees" value={`${fees} DZD`} />
          <button onClick={onPay} className="blink-btn blink-btn--primary" style={{ width: '100%', marginTop: 12, padding: '13px' }}>Pay Dues</button>
        </div>
      )}
    </div>
  );
}

function BlinkCash({ go, openSheet }) {
  const [unlocked, setUnlocked] = useStateC(false);
  const [hide, setHide] = useStateC(false);
  const [open, setOpen] = useStateC(0);
  if (!unlocked) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Blink Cash" right={<button style={iconBtn} onClick={() => go('home')}><Icon name="x" size={22} color="var(--slate-500)" /></button>} />
      <PinGate onUnlock={() => setUnlocked(true)} />
    </div>
  );
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--warm-bg)' }}>
      <TopBar title="Blink Cash" right={<button style={iconBtn} onClick={() => go('home')}><Icon name="home" size={21} color="var(--slate-500)" /></button>} />
      <div style={{ padding: '18px 22px 0' }}>
        {/* total dues */}
        <div style={{ borderRadius: 24, background: 'var(--grad-hero)', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: 99, background: 'rgba(255,255,255,0.07)', right: -50, top: -60 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>Total Dues to Blink</span>
            <button onClick={() => setHide(h => !h)} style={iconBtn}><Icon name={hide ? 'eyeOff' : 'eye'} size={21} color="#fff" /></button>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, marginTop: 8, letterSpacing: '0.01em' }}>{hide ? '••••••' : '12,500'} <span style={{ fontSize: 20, opacity: 0.85 }}>DZD</span></div>
          <button onClick={() => openSheet('pay')} style={{ width: '100%', marginTop: 18, background: '#fff', color: 'var(--blink-600)', border: 'none', borderRadius: 99, padding: '15px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: '0.02em' }}>Pay Dues</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 12px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', letterSpacing: '0.02em' }}>Dues Per Store</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--blink-500)', background: 'var(--blink-tint-100)', borderRadius: 99, padding: '4px 11px', whiteSpace: 'nowrap' }}>2 stores</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StoreDues name="Karim Électro" profit="142,000" dues="9,200" fees="320" open={open===0} onToggle={() => setOpen(open===0?-1:0)} onPay={() => openSheet('pay')} />
          <StoreDues name="Karim Mobile" profit="58,400" dues="3,300" fees="180" open={open===1} onToggle={() => setOpen(open===1?-1:1)} onPay={() => openSheet('pay')} />
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--slate-900)', letterSpacing: '0.02em', margin: '24px 0 8px' }}>Transactions</div>
        {[
          { t: 'Dues Payment · Karim Électro', d: '24 Oct · 11:45', a: '−3,000.00', s: 'Completed' },
          { t: 'Dues Payment · Karim Mobile', d: '12 Oct · 09:30', a: '−1,500.00', s: 'Completed' },
        ].map((x, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < 1 ? '1px solid var(--slate-100)' : 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 99, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="withdrawOut" size={19} color="var(--blink-500)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>{x.t}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>{x.d}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--blink-600)' }}>{x.a}</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: 'var(--credit)', background: 'var(--credit-bg)', borderRadius: 99, padding: '2px 8px', display: 'inline-block', marginTop: 3 }}>{x.s}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 110 }} />
    </div>
  );
}

function PaySheetContent({ onClose }) {
  const methods = [
    { n: 'CIB / Edahabia Card', i: 'cash' },
    { n: 'BaridiMob', i: 'phone' },
    { n: 'Blink Wallet Balance', i: 'wallet' },
  ];
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 7 }}>Amount</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, background: 'var(--slate-50)', border: '1px solid var(--gray-200)', borderRadius: 14, padding: '14px 16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--slate-900)' }}>9,200</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--slate-500)' }}>DZD</span>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-500)', marginBottom: 12 }}>Choose a payment method</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {methods.map((m, i) => (
          <button key={i} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--blink-tint-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={m.i} size={20} color="var(--blink-500)" /></div>
            <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--slate-900)' }}>{m.n}</span>
            <Icon name="chevronRight" size={20} color="var(--slate-300)" />
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BlinkCash, PaySheetContent });
