import { createContext, useContext, type ReactNode } from 'react';

export interface PipesCrewMember { id: string; name: string; isSelf?: boolean; hasSubmitted?: boolean }
interface PipesSceneContext {
  crew: readonly PipesCrewMember[];
  onExit?: () => void;
  onRestart?: () => void;
}
const SceneContext = createContext<PipesSceneContext>({ crew: [{ id: 'local', name: 'Tú', isSelf: true }] });
export function PipesSceneProvider({ children, ...value }: PipesSceneContext & { children: ReactNode }) {
  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}
export const usePipesScene = () => useContext(SceneContext);

export function Astronaut({ active }: { active: boolean }) {
  return <svg viewBox="0 0 76 82" fill="none" aria-hidden="true">
    {active && <g stroke="#eed17b" strokeWidth="2" strokeLinejoin="round">
      <path d="M23 16 18 3 29 10 36 0 43 10 55 3 50 17Z" fill="#e3b85e" />
      <path d="M24 19H49" strokeWidth="4" />
    </g>}
    <path d="M13 43 8 46 8 59 15 62M61 43 67 46 67 59 60 62" fill="var(--suit-dark)" stroke="var(--suit)" strokeWidth="2" />
    <path d="M18 66C14 74 22 79 38 79S62 74 57 66" fill="var(--suit-dark)" stroke="var(--suit)" strokeWidth="2" />
    <ellipse cx="38" cy="51" rx="26" ry="25" fill="var(--suit-dark)" stroke="var(--suit)" strokeWidth="3" />
    <ellipse cx="38" cy="51" rx="20" ry="19" fill="var(--visor)" stroke="var(--suit)" strokeWidth="2" />
    <path d="M25 46Q28 39 35 38M23 51V54" stroke="#d8f1f4" strokeOpacity=".65" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 68Q38 77 54 68" stroke="var(--suit)" strokeWidth="2" />
  </svg>;
}

/** Decorative vector scenery keeps the interface crisp at any viewport size. */
export function LunarBackdrop() {
  return <svg className="pipes-landscape" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="pipes-sky" x2="0" y2="1"><stop stopColor="#171b29" /><stop offset=".55" stopColor="#1c242e" /><stop offset="1" stopColor="#101421" /></linearGradient>
      <radialGradient id="pipes-haze"><stop stopColor="#42616a" stopOpacity=".21" /><stop offset="1" stopColor="#263444" stopOpacity="0" /></radialGradient>
      <linearGradient id="pipes-ground" x2="0" y2="1"><stop stopColor="#141925" /><stop offset="1" stopColor="#0b0f1b" /></linearGradient>
      <linearGradient id="pipes-dome" x2="1" y2="1"><stop stopColor="#63707a" /><stop offset="1" stopColor="#2c3642" /></linearGradient>
      <filter id="pipes-grain"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" stitchTiles="stitch" /></filter>
    </defs>
    <path fill="url(#pipes-sky)" d="M0 0H1440V900H0Z" />
    {Array.from({ length: 110 }, (_, i) => <circle key={i} cx={(i * 173.37 + 23) % 1440} cy={(i * 97.73 + 35) % 660} r={i % 9 === 0 ? .9 : .55} fill="#d9e2e9" opacity={.15 + (i % 5) * .08} />)}
    <ellipse cx="720" cy="400" rx="1000" ry="290" fill="url(#pipes-haze)" />
    <path d="M0 524 48 520 88 533 130 526 171 545 218 540 256 516 274 528 291 519 318 540 367 559 413 573 465 568 526 582 616 566 689 590 755 568 814 576 873 552 927 553 981 537 1016 540 1059 551 1108 539 1172 546 1232 536 1307 540 1361 535 1440 547V900H0Z" fill="#0d1220" />
    <path d="M890 569 965 534 1005 540 1058 567 1118 548 1190 555 1235 544 1284 549 1339 541 1399 550 1440 545V685L884 657Z" fill="#313c47" />
    <g opacity=".7">
      <path d="M1100 594Q1111 510 1165 505 1249 499 1295 598Z" fill="url(#pipes-dome)" />
      <g stroke="#111b27" strokeWidth="1.6" fill="none">
        <path d="M1100 594Q1111 510 1165 505 1249 499 1295 598ZM1106 570 1278 568M1116 545 1257 543M1135 522 1219 521M1100 594 1135 522 1195 594 1219 521 1254 596M1106 570 1165 505 1228 595 1257 543 1281 596M1116 545 1181 568 1219 521M1135 522 1234 543 1278 568M1135 522 1146 570 1169 595M1146 570 1181 568 1210 543M1181 568 1195 594M1234 543 1228 568 1254 596" />
      </g>
      <path d="M1058 601Q1070 539 1117 525L1100 594Z" fill="#232b36" />
    </g>
    <path d="M0 633 122 612 242 637 364 642 493 620 610 664 749 644 898 629 1020 624 1136 646 1279 629 1440 644V900H0Z" fill="url(#pipes-ground)" />
    <path d="M0 708Q220 639 471 712T921 701Q1172 665 1440 717M0 785Q291 727 557 780T1127 781 1440 788" fill="none" stroke="#26303c" strokeOpacity=".25" strokeWidth="2" />
    <g fill="#101622" stroke="#101622" strokeLinejoin="round">
      <path d="M1262 591 1341 591 1361 601 1357 618 1301 627 1262 616Z" />
      <path d="M1275 617 1271 633 1335 634 1344 617M1309 593V557M1304 574H1314" strokeWidth="4" />
      <circle cx="1284" cy="635" r="13" /><circle cx="1331" cy="636" r="13" />
      <path d="M1402 643V618M1398 624H1406" strokeWidth="3" />
    </g>
    <path fill="#a9b9be" filter="url(#pipes-grain)" opacity=".045" d="M0 0H1440V900H0Z" />
  </svg>;
}
