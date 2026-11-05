import Ticket from "../../../components/Ticket";
export const metadata = {
  title: "Minha reserva | Epilação by Anny",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return <Ticket token={(await params).token} />;
}
