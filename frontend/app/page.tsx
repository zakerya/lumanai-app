import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-semibold">Luminai</h1>

      <Link
        href="/chat"
        className="inline-block mt-6 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition"
      >
        Go to Luminai Chat
      </Link>
    </div>
  );
}
