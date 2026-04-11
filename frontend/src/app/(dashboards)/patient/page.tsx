import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PatientDashboardClient from "./PatientDashboardClient";
import { redirect } from "next/navigation";

export default async function PatientDashboard() {
  const authSession = await getServerSession(authOptions);

  if (!authSession) {
     redirect("/login");
  }

  return <PatientDashboardClient email={authSession?.user?.email} />;
}
