// WebIcons.jsx — shared icon set + brand mark for the website
const WI = {
  food: '<path d="M3 2v7a3 3 0 0 0 6 0V2"/><path d="M6 9v13"/><path d="M18 2a3 3 0 0 0-3 3v7h3"/><path d="M18 2v20"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  courier: '<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  ride: '<path d="M5 17H3v-5l2-5h11l3 5h2v5h-2"/><path d="M9 17h6"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  apple: '<path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.93-.03-.01-2.71-1.04-2.74-4.13zM14.6 4.5c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.3-.58 3.02-1.44z" fill="currentColor" stroke="none"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  store: '<path d="M2 7l1.5-4h17L22 7"/><path d="M4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M2 7h20"/><path d="M9 21v-6h6v6"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  chart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/>',
  truck: '<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  headset: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/>',
  money: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  tiktok: '<path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.09v12.4a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 0 1-.77-5.07v-3.16a5.7 5.7 0 0 0 .77 11.33 5.69 5.69 0 0 0 5.69-5.7V8.01a7.35 7.35 0 0 0 4.3 1.38v-3.1s-1.88.09-3.24-1.47Z" fill="currentColor" stroke="none"/>',
  insta: '<rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  twitter: '<path d="M23 4.5a8.4 8.4 0 0 1-2.36.65A4.13 4.13 0 0 0 22.45 2.9a8.25 8.25 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.74A11.65 11.65 0 0 1 3.4 3.36a4.1 4.1 0 0 0 1.27 5.47A4.07 4.07 0 0 1 2.8 8.3v.05a4.1 4.1 0 0 0 3.29 4.02 4.1 4.1 0 0 1-1.85.07 4.11 4.11 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 16.97a11.62 11.62 0 0 0 6.29 1.84c7.55 0 11.67-6.25 11.67-11.67l-.01-.53A8.3 8.3 0 0 0 23 4.5Z"/>',
};

function WIcon({ name, size = 24, color = 'currentColor', sw = 2, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: WI[name] || '' }} />
  );
}

function Mark({ size = 30, color = 'var(--blink-500)', style = {} }) {
  return (
    <svg viewBox="0 0 23.5 26.8" width={size * (23.5 / 26.8)} height={size} style={{ display: 'block', ...style }}>
      <path fill={color} fillRule="nonzero" d="M 18 10.5 L 18 10.2 C 20 10.2 22 9.3 22 6.2 C 22 2.8 19.3 0 13.6 0 C 8.3 0 5.2 1.7 4.1 5.3 L 0 18.7 L 4.6 18.7 L 4.2 22 L 3.6 26.8 L 6.4 22 L 7.8 19.5 L 8.5 18.3 L 9.6 16.4 L 9.9 15.8 L 10.6 14.6 L 8.5 14.6 L 6.4 14.6 L 8.3 7.2 L 8.4 6.7 C 9 4.8 10.7 4.1 13.4 4.1 C 16.4 4.1 17.7 5.1 17.7 6.5 C 17.7 8.5 15.2 8.7 13.9 8.7 L 11.4 8.7 C 11.2 8.7 11.1 8.8 11 9 L 10.1 12.1 C 10 12.3 10.2 12.6 10.5 12.6 L 15.2 12.6 C 16.6 12.6 19.3 12.7 19.3 15.1 C 19.3 17.4 16.8 18 14.8 18 C 13.5 18 12.3 17.8 11.3 17.4 L 10.6 18.6 C 9.9 19.8 10.5 21.4 11.8 21.8 C 12.7 22.1 13.7 22.2 14.8 22.2 C 21 22.2 23.5 18.9 23.5 15.5 C 23.5 11.1 20.1 10.5 18 10.5 Z"/>
    </svg>
  );
}

function Wordmark({ size = 24, dark = 'var(--slate-900)' }) {
  return (
    <span className="logo">
      <Mark size={size * 1.25} />
      <b><span style={{ color: dark }}>LINK</span><span style={{ color: 'var(--blink-500)' }}>.</span></b>
    </span>
  );
}

Object.assign(window, { WIcon, Mark, Wordmark, WI });
