export default function ExamLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
