import { notFound } from "next/navigation";
import { TombolaShell } from "@/components/custom/tombola/tombola-shell";
import { isAdminRole } from "@/lib/admin-auth";
import { getServerAuthContext } from "@/lib/admin-guard";
import {
  getRaffleByIdService,
  getRaffleVerificationPayloadService,
  listPublicRaffleParticipantsService,
  listRaffleNumbersService
} from "@/lib/raffles-service";
import styles from "./live-page.module.css";

interface SorteoLivePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SorteoLivePage({ params }: SorteoLivePageProps) {
  const { id } = await params;
  const [raffle, verification, participants, auth] = await Promise.all([
    getRaffleByIdService(id),
    getRaffleVerificationPayloadService(id),
    listPublicRaffleParticipantsService(id),
    getServerAuthContext()
  ]);

  if (!raffle || raffle.status === "draft") {
    notFound();
  }

  const allNumbers = await listRaffleNumbersService(id, { limit: raffle.numberPoolSize });
  const eligibleNumbers = (
    verification?.eligibleNumbers && verification.eligibleNumbers.length > 0
      ? verification.eligibleNumbers
      : allNumbers
          .filter((item) => item.status === "sold" || item.status === "winner")
          .map((item) => item.numberValue)
  )
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => a - b);

  const winnerDisplayName =
    typeof raffle.winnerNumber === "number"
      ? participants.find((item) => item.chosenNumber === raffle.winnerNumber)?.displayName ?? null
      : null;

  return (
    <main className={styles.liveRoot}>
      <div className={styles.liveCanvas}>
        <TombolaShell
          raffleId={raffle.id}
          title={raffle.title}
          drawAt={raffle.drawAt}
          drawnAt={raffle.drawnAt}
          winnerNumber={raffle.winnerNumber}
          winnerDisplayName={winnerDisplayName}
          eligibleNumbers={eligibleNumbers}
          verification={verification}
          canRunDraw={isAdminRole(auth.role)}
          variant="fullscreen"
        />
      </div>
    </main>
  );
}
