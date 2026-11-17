import { AuthForm } from '@/components/product/AuthForm'
import { safeNextPath } from '@/lib/safe-next'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <AuthForm mode="sign-in" next={safeNextPath(next)} />
}
