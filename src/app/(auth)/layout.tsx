import { getTranslations } from 'next-intl/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('auth')

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            📖 VocabFlow
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('tagline')}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
