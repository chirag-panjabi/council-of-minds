import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <h2 className="text-2xl font-bold">Page or Session Not Found</h2>
      <p className="text-gray-500">The session you are looking for does not exist or the mode is incorrect.</p>
      <Link 
        href="/" 
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Return to Home
      </Link>
    </div>
  );
}
