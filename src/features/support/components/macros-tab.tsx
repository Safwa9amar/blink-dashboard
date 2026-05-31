import { SearchBox, Button, Card } from "@/components/ui";
import { MACROS } from "../data";
import type { TFn } from "../types";


export function MacrosTab({ t }: { t: TFn }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("mac.search")} />
        <Button icon="plus" className="ms-auto">
          {t("mac.new")}
        </Button>
      </div>
      <Card title={t("mac.title")} description={t("mac.desc")}>
        {MACROS.map((m, i) => (
          <div key={i} className="flex gap-3.5 items-start py-3.5 border-t border-border first:border-t-0">
            <div className="flex-1">
              <b className="block text-sm font-bold text-text">{m.t}</b>
              <p className="text-[12.5px] text-subtext mt-1 leading-normal">{m.b}</p>
            </div>
            <span className="text-[11.5px] text-subtext whitespace-nowrap">{t("mac.used", { n: m.used.toLocaleString() })}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
