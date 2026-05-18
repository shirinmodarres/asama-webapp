export type NajaCenterStatus = "active" | "inactive";

export interface NajaCenter {
  objectId: string;
  id: string;
  name: string;
  responsibleName: string;
  phone: string;
  secondaryPhone: string | null;
  landlinePhone: string | null;
  province: string;
  city: string;
  county: string;
  centerCode: string;
  fullAddress: string;
  status: NajaCenterStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNajaCenterPayload {
  name: string;
  responsibleName: string;
  phone: string;
  secondaryPhone?: string | null;
  landlinePhone?: string | null;
  province: string;
  city: string;
  county: string;
  centerCode: string;
  fullAddress: string;
  status: NajaCenterStatus;
}

export type UpdateNajaCenterPayload = Partial<CreateNajaCenterPayload>;
