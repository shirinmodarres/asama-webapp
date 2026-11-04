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
  const [provinces, setProvinces] = useState<DivisionData["provinces"]>([]);
  const [cities, setCities] = useState<DivisionData["cities"]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  useEffect(() => {
    let active = true;
    httpClient.get<DivisionData>("/api/store-expert/administrative-divisions")
      .then((value) => { if (active) setProvinces(value.provinces); })
      .catch(() => { if (active) setProvinces([]); })
      .finally(() => { if (active) setIsLoadingProvinces(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!province) {
      setCities([]);
      setIsLoadingCities(false);
      return undefined;
    }
    let active = true;
    setIsLoadingCities(true);
    httpClient.get<DivisionData>(`/api/store-expert/administrative-divisions?provinceId=${encodeURIComponent(province)}`)
      .then((value) => { if (active) setCities(value.cities); })
      .catch(() => { if (active) setCities([]); })
      .finally(() => { if (active) setIsLoadingCities(false); });
    return () => { active = false; };
  }, [province]);
  const cityOptions = useMemo(() => cities.map((item) => ({ value: String(item.id), label: item.title })), [cities]);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="استان (اختیاری)">
        <SearchableSelect
          value={province}
          onValueChange={(value) => onChange({ province: value, city: "" })}
          options={provinces.map((item) => ({ value: String(item.id), label: item.title }))}
          placeholder={isLoadingProvinces ? "در حال دریافت استان‌ها..." : "انتخاب استان"}
          disabled={isLoadingProvinces}
        />
      </FormField>
      <FormField label="شهر (اختیاری)">
        <SearchableSelect
          value={city}
          onValueChange={(value) => onChange({ province, city: value })}
          options={cityOptions}
          disabled={!province || isLoadingCities}
          placeholder={isLoadingCities ? "در حال دریافت شهرها..." : "انتخاب شهر"}
        />
      </FormField>
    </div>
  );
}
