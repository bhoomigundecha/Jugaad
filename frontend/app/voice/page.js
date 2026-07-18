"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import VoiceModeScreen from "@/components/VoiceModeScreen";

export default function VoicePage() {
  const router = useRouter();

  useEffect(() => {
    if (!getSession()) router.push("/login");
  }, []);

  return <VoiceModeScreen />;
}
