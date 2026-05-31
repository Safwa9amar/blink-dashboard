export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-[26px] rounded-full relative transition-colors shrink-0 cursor-pointer ${
        on ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-[3px] start-[3px] w-5 h-5 rounded-full bg-white transition-transform ${
          on ? "translate-x-[18px] rtl:-translate-x-[18px]" : ""
        }`}
      />
    </button>
  );
}
