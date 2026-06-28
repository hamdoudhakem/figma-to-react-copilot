import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirection immédiate côté serveur vers l'espace tableau de bord
  redirect("/dashboard");
}
