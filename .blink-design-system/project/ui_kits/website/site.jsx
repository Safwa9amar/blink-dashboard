// site.jsx — Blink marketing landing page
const { useState } = React;

const STORE_BADGES = ({ dark }) => (
  <div className="store-badges">
    <a className="store-badge" href="#download">
      <WIcon name="apple" size={24} color="currentColor" />
      <div><div className="s">Download on the</div><div className="n">App Store</div></div>
    </a>
    <a className="store-badge" href="#download">
      <WIcon name="play" size={22} color="currentColor" />
      <div><div className="s">GET IT ON</div><div className="n">Google Play</div></div>
    </a>
  </div>
);

function Nav() {
  return (
    <nav className="bar">
      <div className="wrap">
        <div className="row">
          <a href="#top"><Wordmark size={24} /></a>
          <div className="links">
            <a href="#services">Services</a>
            <a href="#customers">For You</a>
            <a href="#merchants">For Merchants</a>
            <a href="#riders">For Riders</a>
            <a href="#coverage">Coverage</a>
          </div>
          <div className="right">
            <a className="signin" href="#">Sign in</a>
            <a className="bd-btn bd-btn--primary" href="#download">Get the app</a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function PhoneMock() {
  const svc = [['food','Food'],['bag','Market'],['courier','Courier'],['ride','Rides']];
  return (
    <div className="phone-mock">
      <div className="pm-head">
        <div className="pm-status"><span>9:41</span><span>●●● ⌃ ▮</span></div>
        <div className="pm-loc" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div className="loc">Deliver to</div>
            <div className="addr"><WIcon name="pin" size={14} color="#fff" />Bab Ezzouar ▾</div>
          </div>
          <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.2)'}}></div>
        </div>
        <div className="pm-search"><WIcon name="search" size={16} color="var(--slate-400)" />Search "shawarma"…</div>
      </div>
      <div className="pm-body">
        <div className="pm-deal">
          <div className="b" style={{width:90,height:90,right:-20,top:-24}}></div>
          <div className="b" style={{width:34,height:34,right:54,bottom:-8}}></div>
          <div className="big">30% Off</div><div className="sub">First 3 orders</div>
        </div>
        <div className="pm-svc">
          {svc.map(([ic,l]) => (
            <div className="s" key={l}><div className="ic"><WIcon name={ic} size={24} color="var(--blink-500)" /></div><span className="lb">{l}</span></div>
          ))}
        </div>
        <div className="pm-sec">Popular near you</div>
        <div className="pm-rest">
          <div className="pm-card"><div className="img" style={{background:'linear-gradient(135deg,#FFB088,#FF6C4A)'}}></div><div className="t"><div className="nm">Le Gourmet</div><div className="mt">★ 4.8 · 20 min</div></div></div>
          <div className="pm-card"><div className="img" style={{background:'linear-gradient(135deg,#FFD66B,#F5A623)'}}></div><div className="t"><div className="nm">Pizza Roma</div><div className="mt">★ 4.6 · 25 min</div></div></div>
        </div>
      </div>
      <div className="pm-nav">
        <WIcon name="home" size={21} color="var(--blink-500)" />
        <WIcon name="cart" size={21} color="var(--slate-400)" />
        <WIcon name="receipt" size={21} color="var(--slate-400)" />
        <WIcon name="user" size={21} color="var(--slate-400)" />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <div className="grid">
          <div>
            <span className="pill-tag"><span className="d"></span>Live in 18 cities across Algeria</span>
            <h1>Everything you need,<br/>just a <span className="pink">blink</span> away.</h1>
            <p className="lead">Food, groceries, parcels and rides — one app for your whole city. Fast delivery, fair prices, paid in dinars.</p>
            <StoreBadges />
            <div className="trust">
              <span className="stars">★★★★★</span>
              <span>4.8 · 250k+ downloads</span>
            </div>
          </div>
          <div className="phone-wrap"><PhoneMock /></div>
        </div>
      </div>
    </header>
  );
}
const StoreBadges = STORE_BADGES;

function Services() {
  const items = [
    ['food','Food delivery','Your favourite restaurants, delivered hot in 30 minutes or less.'],
    ['bag','Marketplace','Groceries, electronics and essentials from local stores.'],
    ['courier','Courier','Send a parcel across town with a tap. Same-day, tracked.'],
    ['ride','Rides','Affordable trips around the city, anytime you need one.'],
  ];
  return (
    <section className="services" id="services">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">One app, four services</span>
          <h2>The whole city in your pocket</h2>
          <p>Blink connects you to local merchants, independent riders and everything in between.</p>
        </div>
        <div className="svc-grid">
          {items.map(([ic,t,d]) => (
            <div className="svc" key={t}>
              <div className="ic"><WIcon name={ic} size={28} color="var(--blink-500)" /></div>
              <h3>{t}</h3><p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({ items }) {
  return (
    <div className="feat-list">
      {items.map(([b,s]) => (
        <div className="feat" key={b}>
          <div className="ck"><WIcon name="check" size={16} color="var(--blink-500)" sw={3} /></div>
          <div className="tx"><b>{b}</b><span>{s}</span></div>
        </div>
      ))}
    </div>
  );
}

function Customers() {
  return (
    <section className="aud" id="customers">
      <div className="wrap"><div className="split">
        <div className="phone-wrap" style={{display:'flex',justifyContent:'center'}}><PhoneMock /></div>
        <div>
          <span className="eyebrow">For customers</span>
          <h2>Order in seconds,<br/>track every step.</h2>
          <p className="body">From the first tap to your doorbell, Blink keeps it simple — live tracking, saved addresses, and one wallet for everything.</p>
          <Feature items={[
            ['Live order tracking','Watch your rider approach on the map in real time.'],
            ['Save your favourites','Reorder from loved spots in two taps.'],
            ['One wallet, every service','Blink Cash pays for food, parcels and rides alike.'],
            ['Deals every day','Student discounts, free delivery days and first-order offers.'],
          ]} />
          <div className="cta-row"><a className="bd-btn bd-btn--primary bd-btn--lg" href="#download">Start ordering</a></div>
        </div>
      </div></div>
    </section>
  );
}

function Merchants() {
  return (
    <section className="aud alt" id="merchants">
      <div className="wrap"><div className="split">
        <div>
          <span className="eyebrow">For merchants</span>
          <h2>Grow your store<br/>with Blink.</h2>
          <p className="body">Reach thousands of nearby customers, manage your menu and stock from your phone, and get paid reliably — with a dashboard that shows exactly how you're doing.</p>
          <Feature items={[
            ['Reach more customers','Get discovered by everyone ordering nearby.'],
            ['Manage stock & pricing live','Update products and prices from the Merchant app.'],
            ['Transparent dues & payouts','See commissions, dues and earnings, clearly.'],
            ['Sales insights','A dashboard with revenue, orders and top products.'],
          ]} />
          <div className="cta-row">
            <a className="bd-btn bd-btn--dark bd-btn--lg" href="../merchant/index.html">Open Merchant app</a>
            <a className="bd-btn bd-btn--ghost bd-btn--lg" href="../dashboard/index.html">View dashboard</a>
          </div>
        </div>
        <div className="panel merch">
          <div className="mini-dash">
            <div className="md-top"><span className="ttl">Karim Électro · This week</span><span className="av"></span></div>
            <div className="md-stat-row">
              <div className="md-stat"><div className="l">Revenue</div><div className="v">207K <span style={{fontSize:11,color:'var(--slate-400)'}}>DZD</span></div><div className="up">▲ 12% vs last week</div></div>
              <div className="md-stat"><div className="l">Orders</div><div className="v">248</div><div className="up">▲ 8%</div></div>
            </div>
            <div className="md-chart"><div className="bars">{[42,60,38,75,88,54,96].map((h,i)=><div key={i} style={{height:h+'%'}}></div>)}</div></div>
          </div>
          <div className="floaty" style={{left:-22,bottom:54}}>
            <div className="ic" style={{background:'var(--success-bg)'}}><WIcon name="money" size={18} color="var(--success)" /></div>
            <div><div className="l">Paid out today</div><div className="v">64,200 DZD</div></div>
          </div>
        </div>
      </div></div>
    </section>
  );
}

function Riders() {
  return (
    <section className="aud" id="riders">
      <div className="wrap"><div className="split">
        <div className="panel rider">
          <div className="rider-card">
            <div className="lab">Today's earnings</div>
            <div className="amt">4,850 <span style={{fontSize:20,opacity:.85}}>DZD</span></div>
            <div className="sub">14 trips · 6h 20m online</div>
          </div>
          <div className="rider-trips">
            <div className="rt"><div className="ic"><WIcon name="food" size={18} color="var(--blink-500)" /></div><div className="m"><b>Food · Le Gourmet</b><span>Bab Ezzouar → Rouiba</span></div><span className="amt2">+320</span></div>
            <div className="rt"><div className="ic"><WIcon name="courier" size={18} color="var(--blink-500)" /></div><div className="m"><b>Courier · Parcel</b><span>El Harrach → Centre</span></div><span className="amt2">+450</span></div>
          </div>
        </div>
        <div>
          <span className="eyebrow">For riders</span>
          <h2>Drive with Blink.<br/>Earn on your terms.</h2>
          <p className="body">Go online whenever you want, accept the trips that suit you, and watch your earnings add up in real time. Cash out through the Blink agent network across the city.</p>
          <Feature items={[
            ['Flexible hours','Start and stop your shift whenever you like.'],
            ['Real-time earnings','Every trip and bonus, tracked to the dinar.'],
            ['Weekly challenges','Hit targets for extra rewards.'],
            ['Cash out anywhere','Withdraw through any Blink agent, instantly.'],
          ]} />
          <div className="cta-row"><a className="bd-btn bd-btn--primary bd-btn--lg" href="#download">Become a rider</a></div>
        </div>
      </div></div>
    </section>
  );
}

function Stats() {
  const s = [['18','Cities live'],['250k+','App downloads'],['3,200','Active riders'],['1,800','Partner stores']];
  return (
    <section className="stats">
      <div className="wrap"><div className="row">
        {s.map(([k,l])=><div key={l}><div className="k">{k}</div><div className="l">{l}</div></div>)}
      </div></div>
    </section>
  );
}

function Coverage() {
  const cities = ['Algiers','Oran','Constantine','Annaba','Blida','Sétif','Batna','Béjaïa','Tlemcen','Djelfa','Biskra','Tizi Ouzou'];
  return (
    <section className="coverage" id="coverage">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">Coverage</span>
          <h2>Now delivering across Algeria</h2>
          <p>From the capital to the coast — and adding new cities every month.</p>
        </div>
        <div className="cities">{cities.map(c=><span className="city" key={c}>{c}</span>)}</div>
      </div>
    </section>
  );
}

function Download() {
  return (
    <section className="download" id="download">
      <div className="wrap">
        <div className="dl-box">
          <div className="inner">
            <h2>Get everything, in a blink.</h2>
            <p>Download the Blink app and order your first meal, parcel or ride in minutes. Free to join.</p>
            <StoreBadges />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ['Company',['About us','Careers','Press','Blog']],
    ['Services',['Food delivery','Marketplace','Courier','Rides']],
    ['Partners',['Sell on Blink','Drive with Blink','Become an agent','Merchant dashboard']],
  ];
  return (
    <footer className="site">
      <div className="wrap">
        <div className="top">
          <div className="brand">
            <Wordmark size={26} />
            <p>Blink Technologies Inc. — everything your city needs, delivered in a blink. Built for Algeria, paid in dinars.</p>
          </div>
          {cols.map(([h,items])=>(
            <div key={h}><h4>{h}</h4><ul>{items.map(i=><li key={i}><a href="#">{i}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="legal">
          <span>© 2026 Blink Technologies Inc. All rights reserved.</span>
          <div className="socials">
            <a href="#"><WIcon name="tiktok" size={20} /></a>
            <a href="#"><WIcon name="insta" size={20} /></a>
            <a href="#"><WIcon name="facebook" size={20} color="currentColor" /></a>
            <a href="#"><WIcon name="twitter" size={20} color="currentColor" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Site() {
  return (
    <React.Fragment>
      <Nav /><Hero /><Services /><Customers /><Merchants /><Riders /><Stats /><Coverage /><Download /><Footer />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<Site />);
