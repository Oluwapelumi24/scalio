import { AuthForm } from '@/components/product/AuthForm'

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const safe = next?.startsWith('/app') ? next : '/app'
  return <AuthForm mode="sign-up" next={safe} />
}
