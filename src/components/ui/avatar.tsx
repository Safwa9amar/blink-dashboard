export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span className="w-[34px] h-[34px] rounded-full bg-soft-pink text-primary inline-flex items-center justify-center font-bold text-[13px] shrink-0">
      {initials}
    </span>
  );
}
