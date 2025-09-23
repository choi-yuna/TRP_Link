import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get(process.env.AUTH_COOKIE ?? "access_token")?.value;
  redirect(token ? "/dashboard" : "/login");
}
