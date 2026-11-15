import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/** Custom Food icon (Mars hydroponic ration crate with sprout leaf), colored consistently green. */
export function FoodIcon({ className = '', ...props }: IconProps) {
  return (
    <svg
      className={`resource-icon resource-icon--food ${className}`.trim()}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="8" width="18" height="12" rx="3" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
      <path d="M3 12 H21" stroke="#14532D" strokeWidth="1.6" />
      <path
        d="M12 8 C12 4.5 15.2 2.5 18.5 3.2 C18.2 6.2 15.6 8 12 8 Z"
        fill="#4ADE80"
        stroke="#14532D"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 8 C12 5 9.2 3.2 6 3.8 C6.4 6.5 8.8 8 12 8 Z"
        fill="#16A34A"
        stroke="#14532D"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom Energy icon (insulated power bolt inside cell outline), colored consistently orange/amber. */
export function EnergyIcon({ className = '', ...props }: IconProps) {
  return (
    <svg
      className={`resource-icon resource-icon--energy ${className}`.trim()}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M13.5 2.5 L5.5 13.5 H11.5 L10 21.5 L18.5 10.5 H12.5 L13.5 2.5 Z"
        fill="#FF9500"
        stroke="#7C2D12"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom Radiation icon (crisp trefoil hazard emblem), colored consistently purple/currentColor. */
export function RadiationIcon({ className = '', ...props }: IconProps) {
  return (
    <svg
      className={`radiation-icon resource-icon resource-icon--rad ${className}`.trim()}
      viewBox="0 0 24 24"
      width="17"
      height="17"
      aria-hidden="true"
      fill="currentColor"
      {...props}
    >
      <circle cx="12" cy="12" r="2.3" />
      <path d="M12 2.4a9.6 9.6 0 0 0-8.31 4.8l4.8 2.77A4.1 4.1 0 0 1 12 7.9V2.4Zm8.31 4.8A9.6 9.6 0 0 0 12 2.4v5.5a4.1 4.1 0 0 1 3.51 2.07l4.8-2.77ZM12 16.1a4.1 4.1 0 0 1-3.51-2.07l-4.8 2.77a9.6 9.6 0 0 0 16.62 0l-4.8-2.77A4.1 4.1 0 0 1 12 16.1Z" />
    </svg>
  );
}

/** Custom Health icon (medical cross/heart badge), colored consistently red. */
export function HealthIcon({ className = '', ...props }: IconProps) {
  return (
    <svg
      className={`resource-icon resource-icon--hp ${className}`.trim()}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="4.5" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" />
      <path d="M12 7.2 V16.8 M7.2 12 H16.8" stroke="#FFFDF7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
