import type { Metadata } from "next";
import Signup from "@/views/Signup";

export const metadata: Metadata = {
  title: "Sign up | ICUBE Media Studio",
  description: "Create an account",
  robots: "noindex, nofollow",
};

export default function SignupPage() {
  return <Signup />;
}
