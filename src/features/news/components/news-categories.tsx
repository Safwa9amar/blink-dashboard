"use client";

import { useTranslations } from "next-intl";
import { SearchBox, Button, Card, Badge } from "@/components/ui";
import { N_CATS } from "../data";

export function NewsCategories() {
  const t = useTranslations("news");
  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("form.search_categories")} />
        <Button icon="plus" className="ms-auto">
          {t("form.new_category")}
        </Button>
      </div>
      <Card>
        {N_CATS.map((c, i) => (
          <div key={c.name} className={`flex items-center gap-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
            <div className="w-3.5 h-3.5 rounded-[5px] shrink-0" style={{ background: c.color }} />
            <div className="flex-1">
              <div className="text-[14.5px] font-bold text-text">{c.name}</div>
              <div className="text-xs text-subtext mt-0.5">{t("form.posts", { n: c.count })}</div>
            </div>
            <Badge variant="default">{c.count}</Badge>
          </div>
        ))}
      </Card>
    </>
  );
}
