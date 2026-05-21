
import Link from "next/link";
import AuthButton from "../components/AuthButton";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] gap-10 px-4">
      <div className="flex flex-col items-center gap-4">
        <img src="/steam.png" alt="Steam Backlog" className="w-20 h-20 mb-2 drop-shadow-lg" />
        <h1 className="text-4xl font-extrabold text-[#66c0f4] drop-shadow">Steam Backlog</h1>
        <p className="text-lg text-[#c7d5e0] max-w-xl text-center">
          Gestiona tu biblioteca de juegos de Steam, tu backlog y tus juegos completados de forma visual, rápida y sencilla.<br />
          Arrastra y suelta tus juegos, guarda tu progreso y accede desde cualquier lugar.
        </p>
      </div>
      <AuthButton />
      <nav className="flex gap-6 mt-6">
        <Link
          href="/backlog"
          className="px-8 py-3 rounded-lg bg-[#66c0f4] text-[#171a21] font-bold text-lg shadow hover:bg-[#417a9b] transition-colors border-2 border-[#23262e]"
        >
          Ver Backlog
        </Link>
      </nav>
      <footer className="mt-12 text-[#8f98a0] text-sm text-center opacity-80">
        Proyecto TFG &copy; {new Date().getFullYear()}<br />
        No afiliado a Valve/Steam
      </footer>
    </main>
  );
}
