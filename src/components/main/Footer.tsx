import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center pt-6">
      <div className="holo-line mb-5" />
      <p className="font-[family-name:var(--font-share-tech)] text-[10px] text-gray-600 tracking-[0.3em] uppercase">
        Neon Court System &copy; 2026 &mdash; All judgments are AI-generated
      </p>
      <div className="flex justify-center gap-4 mt-3 font-[family-name:var(--font-share-tech)] text-[9px] text-gray-700 tracking-[0.15em]">
        <Link href="/terms" className="transition hover:text-cyan-400">이용약관</Link>
        <span>|</span>
        <Link href="/privacy" className="transition hover:text-cyan-400">개인정보처리방침</Link>
        <span>|</span>
        <Link href="/legal" className="transition hover:text-red-400">저작권 보호 및 법적 고지</Link>
      </div>
    </footer>
  );
}
