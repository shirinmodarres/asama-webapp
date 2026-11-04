"use client";

import { useEffect, useMemo, useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { httpClient } from "@/lib/api/http-client";

type DivisionData = {
  provinces: { id: number; title: string }[];
  cities: { id: number; parentId: number; title: string }[];
};

// Options are always read from Asama's local geographic-area mirror. This
// component never calls Sepidar directly.
export function ProvinceCitySelector({ province = "", city = "", onChange = () => undefined }: { province?: string; city?: string; onChange?: (value: { province: string; city: string }) => void }) {
  const [data, setData] = useState<{ provinces: { id: number; title: string }[]; cities: { id: number; parentId: number; title: string }[] }>({ provinces: [], cities: [] });
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    httpClient.get<DivisionData>("/api/store-expert/administrative-divisions")
      .then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setData({ provinces: [], cities: [] }); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const cityOptions = useMemo(() => data.cities.filter((item) => String(item.parentId) === province).map((item) => ({ value: String(item.id), label: item.title })), [data.cities, province]);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="استان (اختیاری)">
        <SearchableSelect
          value={province}
          onValueChange={(value) => onChange({ province: value, city: "" })}
          options={data.provinces.map((item) => ({ value: String(item.id), label: item.title }))}
          placeholder={isLoading ? "در حال دریافت استان‌ها..." : "انتخاب استان"}
          disabled={isLoading}
        />
      </FormField>
      <FormField label="شهر (اختیاری)">
        <SearchableSelect
          value={city}
          onValueChange={(value) => onChange({ province, city: value })}
          options={cityOptions}
          disabled={!province || isLoading}
          placeholder={isLoading ? "در حال دریافت شهرها..." : "انتخاب شهر"}
        />
      </FormField>
    </div>
  );
}
