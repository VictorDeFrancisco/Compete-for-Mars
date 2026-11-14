import { memo, useId } from 'react';
import { COMPONENT_NAMES, type CircuitBoard, type ComponentKind, type ComponentState } from './circuit';

/** Illustrated symbols, not text readings. Both states of every symbol are visibly different. */
export function CircuitPart({ kind, state }: { kind: ComponentKind; state: ComponentState }) {
  switch (kind) {
    case 'resistor': return <>
      <path d="M-51 0H-34M34 0H51" stroke="#b7bbaf" strokeWidth="5" />
      <path d="M-34-13-26-18H26L34-13V13L26 18H-26L-34 13Z" fill={state ? '#3e2d24' : '#d6bd85'} stroke={state ? '#191412' : '#30291f'} strokeWidth="3" />
      {state
        ? <>
            <ellipse cx="0" cy="0" rx="22" ry="12" fill="#231915" />
            <path d="M-21-10-9 8 0-6 9 10 21-10" stroke="#fc3d21" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m-6-17 9 11-7 9 9 14" stroke="#facc15" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        : <>
            <path d="M-22-16V16M-8-17V17" stroke="#793e25" strokeWidth="6" />
            <path d="M6-17V17" stroke="#d27c32" strokeWidth="6" />
            <path d="M23-16V16" stroke="#aa924f" strokeWidth="4" />
          </>}
    </>;
    case 'lamp': return <>
      <path d="M-51 0H-32V27H-10V10M51 0H32V27H10V10" fill="none" stroke="#b7bbaf" strokeWidth="4" />
      {!state && <path d="M0-46V-39M-30-36-25-30M30-36 25-30M-37-13H-29M29-13H37" stroke="#ffc48c" strokeWidth="3" fill="none" />}
      <path d="M-19 10V-13A19 19 0 0 1 19-13V10Z" fill={state ? '#643d38' : '#ef735c'} stroke={state ? '#a58070' : '#ffc294'} strokeWidth="2.5" />
      <path d="M-10 10V-4H-3M10 10V-9H3" fill="none" stroke={state ? '#a99a83' : '#ffe1ab'} strokeWidth="3" />
      <path d="m-4-10 8 0 0 7-8 0Z" fill={state ? '#352b28' : '#fff0c1'} />
      <path d="M-11-16Q-10-24-3-25" fill="none" stroke={state ? '#8b6257' : '#ffe5c7'} strokeWidth="4" strokeLinecap="round" />
      <rect x="-23" y="8" width="46" height="8" rx="2" fill={state ? '#735047' : '#d35c46'} stroke="#af8b72" strokeWidth="2" />
    </>;
    case 'switch': return <>
      <path d="M-51 0H51" stroke="#a0ac9d" strokeWidth="5" />
      <rect x="-36" y="-22" width="72" height="44" rx="3" fill="#263c37" stroke="#a4ada0" strokeWidth="3" />
      <circle cx="-23" r="5" fill="#d4bf89" /><circle cx="23" r="5" fill="#d4bf89" />
      <path d={state ? 'M-23 0 22 0' : 'M-23 0 14-27'} stroke="#dfd7b2" strokeWidth="7" strokeLinecap="round" />
      <circle cx="-23" r="4" fill="#606b5d" />
    </>;
    case 'capacitor': return <>
      <path d="M-51 0H-12M12 0H51" stroke="#b7bbaf" strokeWidth="4" />
      <path d="M-12-29V29" stroke="#d4dfcf" strokeWidth="7" />
      <path d={state ? 'M12-29V-10M12 10V29' : 'M12-29V29'} stroke={state ? '#dfa784' : '#d4dfcf'} strokeWidth="7" />
      {state && <path d="m8-10 4-4 4 4m-8 20 4 4 4-4" stroke="#dfa784" strokeWidth="2" fill="none" />}
    </>;
    case 'diode': return <g transform={state ? 'rotate(180)' : undefined}>
      <path d="M-51 0H-30M30 0H51" stroke="#b7bbaf" strokeWidth="4" />
      <rect x="-30" y="-15" width="60" height="30" rx="7" fill="#252d2c" stroke="#738b7f" strokeWidth="2.5" />
      <path d="M19-13V13" stroke="#d7d3b9" strokeWidth="7" /><path d="M-20-8H8" stroke="#54665c" strokeWidth="2" />
    </g>;
    case 'fuse': return <>
      <path d="M-51 0H51" stroke="#bac4af" strokeWidth="4" />
      <rect x="-32" y="-15" width="64" height="30" rx="4" fill="#183b35" stroke="#839e8e" strokeWidth="2" />
      <path d={state ? 'M-25 0H-11L-5-7M6 7 13 0H25' : 'M-25 0H25'} stroke={state ? '#df9c76' : '#c6c9ab'} strokeWidth="4" fill="none" />
      <path d="M-35-15H-22V15H-35ZM22-15H35V15H22Z" fill="#a3ae9a" stroke="#566b5b" strokeWidth="2" />
      <path d="M-16-9H15" stroke="#5c8071" strokeWidth="2" />
    </>;
    case 'coil': return <>
      <path d="M-51 0H-36M36 0H51" stroke="#b7bbaf" strokeWidth="5" />
      <path d={state ? 'M-36 0h12c-8-40 32-40 24 0c-8-40 32-40 24 0h12' : 'M-36 0c-6-37 24-37 18 0c-6-37 24-37 18 0c-6-37 24-37 18 0c-6-37 24-37 18 0'} fill="none" stroke="#c89a66" strokeWidth="6" strokeLinecap="round" />
      <path d="M-28 15H28M-28 22H28" stroke="#799480" strokeWidth="3" />
    </>;
    case 'meter': return <>
      <path d="M-51 0H-32M32 0H51" stroke="#b7bbaf" strokeWidth="5" />
      <circle r="34" fill="#b7bfa4" stroke="#152f29" strokeWidth="4" /><circle r="28" fill="#e1dbc1" />
      <path d="M-22 5A23 23 0 0 1 22 5" fill="none" stroke="#657767" strokeWidth="4" />
      <path d="M-20-4-15-1M-11-14-8-9M0-17V-12M11-14 8-9M20-4 15-1" stroke="#4b5d4e" strokeWidth="2" />
      <path d={state ? 'M0 12 17-10' : 'M0 12-17-10'} stroke="#a34d35" strokeWidth="3.5" strokeLinecap="round" /><circle cy="12" r="4" fill="#3a4e43" />
      <text y="25" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#46554a">A</text>
    </>;
    case 'battery': return <g transform={state ? 'rotate(180)' : undefined}>
      <path d="M-51 0H-34M34 0H51" stroke="#b7bbaf" strokeWidth="4" />
      <rect x="-34" y="-22" width="68" height="44" rx="4" fill="#3b5550" stroke="#b0baa0" strokeWidth="2.5" />
      <path d="M20-21H33V21H20Z" fill="#bf9d63" /><rect x="34" y="-9" width="6" height="18" fill="#c2c8ae" />
      <path d="M-28 0H-18M22 0H31M26-5V5" stroke="#eee2b7" strokeWidth="2.5" />
      <path d="M-9-10V10M1-10V10M11-10V10" stroke="#88aa83" strokeWidth="5" />
    </g>;
  }
}

interface CircuitDiagramProps {
  board: CircuitBoard; side: 'reference' | 'inspected'; found: readonly number[]; lastMistake: number | null;
  disabled: boolean; onInspect: (index: number) => void;
}
export const CircuitDiagram = memo(function CircuitDiagram({ board, side, found, lastMistake, disabled, onInspect }: CircuitDiagramProps) {
  const patternId = useId().replace(/:/g, '');
  return <svg className="anomaly-circuit" viewBox="0 0 600 650" role="group" aria-label={side === 'reference' ? 'Circuito de referencia' : 'Circuito de inspección'}>
    <defs><pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r=".8" fill="#6b9580" opacity=".2" /></pattern></defs>
    <rect width="600" height="650" fill="#153c32" /><rect x="14" y="14" width="572" height="622" fill={`url(#${patternId})`} stroke="#4c7661" strokeWidth="2" />
    {[28, 572].flatMap(x => [28, 622].map(y => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="7" fill="#172d27" stroke="#6c8870" strokeWidth="2" /><path d={`M${x - 3} ${y - 3}l6 6`} stroke="#78917a" strokeWidth="2" /></g>))}
    <g stroke="#a7a16c" strokeWidth="4" fill="none" strokeLinejoin="round" strokeLinecap="square">
      {board.wires.map((wire, index) => <polyline key={index} points={wire.points.map(point => point.join(',')).join(' ')} />)}
      {board.junctions.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#d5c68d" stroke="#7a825d" strokeWidth="2" />)}
    </g>
    <text x="300" y="40" textAnchor="middle" fill="#9fb49b" fontFamily="monospace" fontSize="12">{board.voltage} V DC</text>
    <g transform={`translate(${board.ground[0]} ${board.ground[1]})`} stroke="#a7a16c" strokeWidth="3"><path d="M0 0V24M-15 24H15M-9 32H9M-3 40H3" /></g>
    <text x="300" y="627" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#7c9c80">ARES / POWER DISTRIBUTION</text>
    {board.components.map((part, index) => {
      const selected = found.includes(index), wrong = lastMistake === index, inactive = disabled || selected;
      return <g key={part.id} transform={`translate(${part.x} ${part.y})`} className={`anomaly-part${selected ? ' anomaly-part--found' : ''}${wrong ? ' anomaly-part--wrong' : ''}`}
        role="button" tabIndex={inactive ? -1 : 0} aria-disabled={inactive} aria-pressed={selected}
        aria-label={`${COMPONENT_NAMES[part.kind]} ${part.id}, ${side === 'reference' ? 'referencia' : 'inspección'}${selected ? ', encontrada' : ''}`}
        onClick={() => { if (!inactive) onInspect(index); }}
        onKeyDown={event => { if (!event.repeat && !inactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onInspect(index); } }}>
        <rect className="anomaly-part-target" x={part.rotation ? -43 : -63} y={part.rotation ? -73 : -48} width={part.rotation ? 86 : 126} height={part.rotation ? 146 : 103} rx="3" />
        <g pointerEvents="none"><g transform={`rotate(${part.rotation})`}><CircuitPart kind={part.kind} state={part[side]} /></g>
          <text x={part.rotation ? 36 : 0} y={part.rotation ? -53 : 48} textAnchor="middle" fontFamily="monospace" fontSize="12" fill="#8bab91">{part.id}</text>
          {selected && <><rect x={part.rotation ? -43 : -65} y={part.rotation ? -69 : -44} width={part.rotation ? 86 : 130} height={part.rotation ? 138 : 95} rx="3" fill="none" stroke="#e1d29b" strokeWidth="3" /><circle cx={part.rotation ? 33 : 55} cy={part.rotation ? -59 : -34} r="13" fill="#e1d29b" /><path d={part.rotation ? 'm27-59 4 4 8-9' : 'm49-34 4 4 8-9'} stroke="#1a382c" strokeWidth="3" fill="none" /></>}
          {wrong && <path d="m-10-10 20 20m0-20-20 20" stroke="#e8a184" strokeWidth="4" />}
        </g>
      </g>;
    })}
  </svg>;
});
