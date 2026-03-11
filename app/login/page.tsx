import type { Metadata } from "next";
import Login from "@/views/Login";

export const metadata: Metadata = {
  title: "Sign in | ICUBE Media Studio",
  description: "Sign in to your account",
  robots: "noindex, nofollow",
};

export default function LoginPage() {
  return <Login />;
}
