export function Butterfly({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M32 40C24 18 7 6 5 13c-2 12 3 22 17 26C5 35 13 57 24 50c4-2 6-6 8-10Zm0 0c8-22 25-34 27-27 2 12-3 22-17 26 17-4 9 18-2 11-4-2-6-6-8-10Z" />
      <path d="M32 46V31m0 4c-1-8-4-12-7-13m7 13c1-8 4-12 7-13M9 17c9 8 15 14 19 22m27-22c-9 8-15 14-19 22" />
    </svg>
  );
}
export function Brand() {
  return (
    <a href="/" className="brand">
      <span className="monogram">
        HC
        <Butterfly size={15} />
      </span>
      <span>
        Epilação <i>by Anny</i>
      </span>
    </a>
  );
}
