import { LoginForm } from "./login-form";
import { urlErrorKey } from "./errors";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return <LoginForm urlError={urlErrorKey(error)} next={next ?? null} />;
}
