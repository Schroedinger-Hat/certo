import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] items-center max-w-3xl text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold sm:text-5xl">Certo</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Secure Digital Credentials Management Platform
          </p>
        </div>
        
        <p className="text-lg text-gray-700 dark:text-gray-200 max-w-2xl">
          Certo provides a secure and verifiable way to issue, manage, and verify digital credentials using blockchain technology.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/login"
          >
            Sign In
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/register"
          >
            Create Account
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Issue Credentials</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and issue verifiable digital credentials to recipients
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Manage Certificates</h3>
            <p className="text-gray-600 dark:text-gray-300">
              View, export, and manage your issued and received certificates
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Verify Authenticity</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Instantly verify the authenticity of any certificate
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
