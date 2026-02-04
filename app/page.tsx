import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">Voting System</h1>
            <div className="flex gap-4">
                <Link href="/vote" className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                    Go to Vote
                </Link>
                <Link href="/reveal" className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition">
                    Go to Reveal
                </Link>
            </div>
        </main>
    );
}
