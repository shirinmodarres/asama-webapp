"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Workflow,
} from "lucide-react";
import { AsamaLogo } from "@/components/branding/asama-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { ApiError, getErrorMessage } from "@/lib/api/api-error";
import { getPanelRouteForRole } from "@/lib/domain/roles";
import {
  getStoredCurrentUser,
  getStoredSessionToken,
  login,
} from "@/lib/services/auth.service";

const infoItems = [
  {
    title: "دسترسی متناسب با هر نقش سازمانی",
    icon: ShieldCheck,
  },
  {
    title: "گردش هماهنگ از سفارش تا صورتحساب",
    icon: Workflow,
  },
  {
    title: "متمرکز بر استفاده روزانه تیم های عملیاتی",
    icon: BriefcaseBusiness,
  },
];

export function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const sessionToken = getStoredSessionToken();
    const currentUser = getStoredCurrentUser();
    if (sessionToken && currentUser) {
      router.replace(getPanelRouteForRole(currentUser.role));
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await login(phone.trim(), password);
      router.replace(getPanelRouteForRole(response.user.role));
    } catch (submitError) {
      if (
        submitError instanceof ApiError &&
        submitError.code === "INVALID_CREDENTIALS"
      ) {
        setError("شماره موبایل یا رمز عبور اشتباه است.");
      } else {
        setError(getErrorMessage(submitError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,58,95,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(108,174,117,0.1),transparent_26%)]" />

      <main className="relative mx-auto grid w-full max-w-330 gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        <section className="rounded-[30px] border border-[#D7E0E8] bg-white/95 p-6 shadow-[0_34px_90px_rgba(15,23,42,0.1)] backdrop-blur xl:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <AsamaLogo href="/" />
            <Badge variant="neutral" dot>
              سامانه داخلی آساما
            </Badge>
          </div>

          <div className="mt-10 max-w-xl">
            <p className="text-sm font-semibold tracking-[0.16em] text-[#6B7280]">
              درگاه ورود سازمانی
            </p>
            <h1 className="mt-4 max-w-120 text-2xl font-bold leading-[1.8] text-[#102034] lg:text-[2rem]">
              دسترسی یکپارچه به عملیات سفارش، انبار، مالی و پشتیبانی
            </h1>
            <p className="mt-4 text-base leading-8 text-[#5F6E81]">
              این درگاه برای ورود کاربران سامانه داخلی آساما طراحی شده است تا هر
              کاربر پس از احراز هویت، مستقیماً وارد پنل متناسب با نقش سازمانی
              خود شود.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {infoItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-[20px] border border-[#DDEAE0] bg-white/90 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[#D6E8DA] bg-[#F3FAF4] text-[#6CAE75]">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#102034]">
                    {item.title}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-[#D7E0E8] bg-white/95 p-6 shadow-[0_34px_90px_rgba(15,23,42,0.1)] backdrop-blur xl:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="success">ورود به سامانه</Badge>
              <h2 className="mt-4 text-2xl font-bold text-[#102034]">
                ورود به حساب کاربری
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#6B7280]">
                شماره موبایل و رمز عبور خود را وارد کنید. دسترسی شما پس از ورود
                بر اساس نقش ثبت شده در سامانه تعیین می شود.
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[#D6E8DA] bg-[#F3FAF4] text-[#6CAE75]">
              <LockKeyhole className="size-5" />
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>شماره موبایل</span>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="pr-10"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155] relative">
              <span>رمز عبور</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#6CAE75]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10 pl-10"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#6B7280] transition hover:text-[#102034]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </label>

            {error ? <InlineErrorMessage message={error} /> : null}

            <Button
              type="submit"
              variant="success"
              fullWidth
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "در حال ورود..." : "ورود به سامانه"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
