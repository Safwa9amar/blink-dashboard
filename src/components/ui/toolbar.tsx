import { Button } from "./button";
import { SearchBox } from "./search-box";

export function Toolbar({
  placeholder,
  onAdd,
  addLabel,
  filterLabel = "Filter",
  showFilter = true,
  showExport = false,
}: {
  placeholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  filterLabel?: string;
  showFilter?: boolean;
  showExport?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-[18px]">
      <SearchBox placeholder={placeholder} />
      {showFilter && (
        <Button variant="secondary" size="sm" icon="filter">
          {filterLabel}
        </Button>
      )}
      {showExport && (
        <Button variant="secondary" size="sm" icon="download">
          Export
        </Button>
      )}
      {onAdd && (
        <Button size="sm" icon="plus" onClick={onAdd} className="ms-auto">
          {addLabel}
        </Button>
      )}
    </div>
  );
}
