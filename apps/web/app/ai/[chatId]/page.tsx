import { Suspense } from "react";
import AIDashboardClient from "../../dashboard/ai/AIDashboardClient";

type Props = {
  params: Promise<{ chatId: string }>;
};

export default async function AIChatPage({ params }: Props) {
  const { chatId } = await params;
  return (
    <Suspense fallback={null}>
      <AIDashboardClient initialChatId={chatId} />
    </Suspense>
  );
}
