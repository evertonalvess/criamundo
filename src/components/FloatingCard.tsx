export default function FloatingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card backdrop-blur-md rounded-xl p-6 shadow-lg">
      {children}
    </div>
  );
} 