import { AuthForm } from '@/components/product/AuthForm'
import { safeNextPath } from '@/lib/safe-next'

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <AuthForm mode="sign-up" next={safeNextPath(next)} />
}
