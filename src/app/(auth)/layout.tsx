export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            📖 VocabFlow
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Master English vocabulary, one word at a time
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
