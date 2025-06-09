import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-3xl font-bold mb-8">Sign In to Your Account</h1>
      <LoginForm />
    </div>
  )
} 