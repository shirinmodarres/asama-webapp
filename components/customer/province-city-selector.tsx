"use client";

import { useEffect, useMemo, useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { httpClient } from "@/lib/api/http-client";

/** The Sepidar-backed options are intentionally introduced in phase 2. */
export function ProvinceCitySelector({ province = "", city = "", onChange = () => undefined }: { province?: string; city?: string; onChange?: (value: { province: string; city: string }) => void }) {
  const [data, setData] = useState<{ provinces: { id: number; title: string }[]; cities: { id: number; parentId: number; title: string }[] }>({ provinces: [], cities: [] });
  useEffect(() => { let active = true; httpClient.get<typeof data>("/api/store-expert/administrative-divisions").then((value) => { if (active) setData(value); }).catch(() => undefined); return () => { active = false; }; }, []);
  const cityOptions = useMemo(() => data.cities.filter((item) => String(item.parentId) === province).map((item) => ({ value: String(item.id), label: item.title })), [data.cities, province]);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="استان (اختیاری)">
        <SearchableSelect
          value={province}
          onValueChange={(value) => onChange({ province: value, city: "" })}
          options={data.provinces.map((item) => ({ value: String(item.id), label: item.title }))}
          placeholder="انتخاب استان"
        />
      </FormField>
      <FormField label="شهر (اختیاری)">
        <SearchableSelect
          value={city}
          onValueChange={(value) => onChange({ province, city: value })}
          options={cityOptions}
          disabled={!province}
          placeholder="انتخاب شهر"
        />
      </FormField>
    </div>
  );
}
