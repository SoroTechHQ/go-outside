"use client";

import dynamic from "next/dynamic";
import { MessagesPreviewShell } from "../../../components/messages/MessagesPreviewShell";

const MessagesClient = dynamic(() => import("./MessagesClient"), {
  ssr: false,
  loading: () => <MessagesPreviewShell />,
});

export default function MessagesPage() {
  return <MessagesClient />;
}
