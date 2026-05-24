"use client";

// TODO: remove this page in production

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldPlus, Smartphone, UserRound } from "lucide-react";
import { AsamaLogo } from "@/components/branding/asama-logo";
import { FieldError } from "@/components/shared/field-error";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import { getPanelRouteForRole } from "@/lib/domain/roles";
import { bootstrapSupport, login } from "@/lib/services/auth.service";
import {
  isRequired,
  isValidPhone,
  PHONE_MESSAGE,
  REQUIRED_MESSAGE,
} from "@/lib/utils/form-validation";
import { normalizePhone } from "@/lib/utils/number-format";

const DEFAULT_PHONE = "09912776057";
const DEFAULT_PASSWORD = "modarres@1379";
const DEFAULT_FULL_NAME = "پشتیبان";

export default function SetupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState(DEFAULT_FULL_NAME);
  const [bootstrapPhone, setBootstrapPhone] = useState(DEFAULT_PHONE);
  const [bootstrapPassword, setBootstrapPassword] = useState(DEFAULT_PASSWORD);
  const [loginPhone, setLoginPhone] = useState(DEFAULT_PHONE);
  const [loginPassword, setLoginPassword] = useState(DEFAULT_PASSWORD);
  const [bootstrapMessage, setBootstrapMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [bootstrapErrors, setBootstrapErrors] = useState<Record<string, string>>({});
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [bootstrapType, setBootstrapType] = useState<"success" | "error">("success");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleBootstrap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBootstrapMessage("");
    setBootstrapType("success");
    const nextErrors: Record<string, string> = {};
    if (!isRequired(fullName)) nextErrors.fullName = REQUIRED_MESSAGE;
    if (!isRequired(bootstrapPhone)) {
      nextErrors.bootstrapPhone = REQUIRED_MESSAGE;
    } else if (!isValidPhone(bootstrapPhone)) {
      nextErrors.bootstrapPhone = PHONE_MESSAGE;
    }
    if (!isRequired(bootstrapPassword)) nextErrors.bootstrapPassword = REQUIRED_MESSAGE;
    setBootstrapErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsBootstrapping(true);

    try {
      await bootstrapSupport({
        fullName: fullName.trim(),
        phone: normalizePhone(bootstrapPhone),
        password: bootstrapPassword,
      });
      setBootstrapMessage("پشتیبان با موفقیت ساخته شد");
    } catch (error) {
      if (error instanceof ApiError && /already exists/i.test(error.message)) {
        setBootstrapType("success");
        setBootstrapMessage("پشتیبان قبلاً ساخته شده است، لطفاً وارد شوید");
      } else {
        setBootstrapType("error");
        setBootstrapMessage(getErrorMessage(error));
      }
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginMessage("");
    const nextErrors: Record<string, string> = {};
    if (!isRequired(loginPhone)) {
      nextErrors.loginPhone = REQUIRED_MESSAGE;
    } else if (!isValidPhone(loginPhone)) {
      nextErrors.loginPhone = PHONE_MESSAGE;
    }
    if (!isRequired(loginPassword)) nextErrors.loginPassword = REQUIRED_MESSAGE;
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsLoggingIn(true);

    try {
      const response = await login(normalizePhone(loginPhone), loginPassword);
      router.replace(getPanelRouteForRole(response.user.role));
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        setLoginMessage("شماره موبایل یا رمز عبور اشتباه است.");
      } else {
        setLoginMessage(getErrorMessage(error));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,58,95,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(108,174,117,0.1),transparent_26%)]" />

      <main className="relative mx-auto w-full max-w-[1080px] space-y-6">
        <div className="rounded-[30px] border border-[#D7E0E8] bg-white/95 p-6 shadow-[0_34px_90px_rgba(15,23,42,0.1)] backdrop-blur xl:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <AsamaLogo href="/" />
            <span className="rounded-full border border-[#D7E0E8] bg-[#F8FBFD] px-4 py-2 text-sm font-semibold text-[#526274]">
              راه‌اندازی اولیه سیستم
            </span>
          </div>
          <div className="mt-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-[#102034]">صفحه موقت راه‌اندازی اولیه</h1>
            <p className="mt-3 text-sm leading-8 text-[#6B7280]">
              این صفحه فقط برای محیط توسعه است تا بدون استفاده از curl یا Postman،
              پشتیبان اولیه ساخته شود و اولین ورود به سامانه انجام شود.
            </p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[24px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-[16px] border border-[#D6E8DA] bg-[#F3FAF4] text-[#6CAE75]">
                  <ShieldPlus className="size-5" />
                </span>
                <div>
                  <CardTitle>ساخت پشتیبان اولیه</CardTitle>
                  <CardDescription>
                    برای راه‌اندازی اولیه، اولین کاربر پشتیبان را ثبت کنید.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form noValidate className="space-y-4" onSubmit={handleBootstrap}>
                <InputField label="نام" value={fullName} onChange={(value) => { setFullName(value); setBootstrapErrors((current) => ({ ...current, fullName: "" })); }} icon={UserRound} error={bootstrapErrors.fullName} />
                <InputField label="شماره موبایل" value={bootstrapPhone} onChange={(value) => { setBootstrapPhone(value); setBootstrapErrors((current) => ({ ...current, bootstrapPhone: "" })); }} icon={Smartphone} inputMode="numeric" error={bootstrapErrors.bootstrapPhone} />
                <InputField label="رمز عبور" value={bootstrapPassword} onChange={(value) => { setBootstrapPassword(value); setBootstrapErrors((current) => ({ ...current, bootstrapPassword: "" })); }} icon={KeyRound} type="password" error={bootstrapErrors.bootstrapPassword} />

                {bootstrapMessage ? (
                  bootstrapType === "error" ? (
                    <InlineErrorMessage message={bootstrapMessage} />
                  ) : (
                    <div className="rounded-xl border border-[#D6E8DA] bg-[#F3FAF4] px-4 py-3 text-sm leading-7 text-[#315D3D]">
                      {bootstrapMessage}
                    </div>
                  )
                ) : null}

                <Button type="submit" variant="success" fullWidth disabled={isBootstrapping}>
                  {isBootstrapping ? "در حال ساخت پشتیبان..." : "ساخت پشتیبان"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[24px]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-[16px] border border-[#DDE7F0] bg-[#F5F8FB] text-[#1F3A5F]">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <CardTitle>ورود به سیستم</CardTitle>
                  <CardDescription>
                    پس از ساخت کاربر اولیه، با همان اطلاعات وارد سامانه شوید.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form noValidate className="space-y-4" onSubmit={handleLogin}>
                <InputField label="شماره موبایل" value={loginPhone} onChange={(value) => { setLoginPhone(value); setLoginErrors((current) => ({ ...current, loginPhone: "" })); }} icon={Smartphone} inputMode="numeric" error={loginErrors.loginPhone} />
                <InputField label="رمز عبور" value={loginPassword} onChange={(value) => { setLoginPassword(value); setLoginErrors((current) => ({ ...current, loginPassword: "" })); }} icon={KeyRound} type="password" error={loginErrors.loginPassword} />

                {loginMessage ? <InlineErrorMessage message={loginMessage} /> : null}

                <Button type="submit" fullWidth disabled={isLoggingIn}>
                  {isLoggingIn ? "در حال ورود..." : "ورود"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  inputMode,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#334155]">
      <span>{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-10"
          type={type}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
        />
      </div>
      <FieldError message={error} />
    </label>
  );
}
