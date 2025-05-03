"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Якщо користувач авторизований, перенаправляємо на головну сторінку чату
    if (status === "authenticated") {
      router.push("/chat");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Next.js DDD Chat
        </h1>
        <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-2xl">
          Сучасний чат-додаток з підтримкою особистих та групових чатів, медіа-файлів та вбудовування на інші сайти
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {status === "unauthenticated" && (
            <>
              <Button asChild size="lg">
                <Link href="/login">Увійти</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Зареєструватись</Link>
              </Button>
            </>
          )}
          
          {status === "authenticated" && (
            <Button asChild size="lg">
              <Link href="/chat">Перейти до чату</Link>
            </Button>
          )}
          
          {status === "loading" && (
            <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
          )}
        </div>
      </div>
    </main>
  );
}