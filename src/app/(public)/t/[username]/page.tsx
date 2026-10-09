import { notFound } from "next/navigation";
import { ActivityCalendar } from "@/components/domain/activity-calendar";
import { BadgeList } from "@/components/domain/badge-list";
import { ReviewItem } from "@/components/domain/review-item";
import { TrackRecord } from "@/components/domain/track-record";
import { CopyField } from "@/components/forms/copy-field";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Num } from "@/components/ui/num";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { baseUrl } from "@/lib/base-url";
import { BRAND } from "@/lib/brand";
import { getWorkerActivity, getWorkerByUsername } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/t/[username]">) {
  const { username } = await params;
  const worker = await getWorkerByUsername(username);
  return { title: worker ? `${worker.user.name} (@${worker.user.username})` : "Perfil" };
}

export default async function WorkerProfilePage({ params }: PageProps<"/t/[username]">) {
  const { username } = await params;
  const worker = await getWorkerByUsername(username);
  if (!worker) notFound();
  const [me, origin, activity] = await Promise.all([getSessionUser(), baseUrl(), getWorkerActivity(worker.user.id)]);
  const { user, profile, stats, history, reviews } = worker;
  const firstName = user.name.split(" ")[0];
  const isOwner = me?.id === user.id;

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      {/* Quién es y sus cuatro números: lo que se ve cuando alguien comparte su perfil. */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-[1.75rem] leading-9 font-semibold tracking-[-0.025em] break-words">{user.name}</h1>
            <p className="mt-0.5 text-sm text-ink-2">
              <span className="text-ink-3">@{user.username}</span>
              {profile.headline ? <> · {profile.headline}</> : null}
            </p>
          </div>
        </div>
        {isOwner ? (
          <div className="w-full sm:max-w-sm">
            <CopyField value={`${origin}/t/${user.username}`} label="Link a tu perfil" />
          </div>
        ) : me?.role === "hirer" ? (
          <ButtonLink href="/app/equipo/invitar">Invitar a {firstName} a mi equipo</ButtonLink>
        ) : me ? null : (
          <ButtonLink href="/registro?rol=contratador">Contratar a {firstName}</ButtonLink>
        )}
      </header>

      <div className="flex flex-col gap-2.5">
        <TrackRecord
          totalViews={stats.totalViews}
          avgViews={stats.avgViews}
          approvedDeliverables={stats.approvedDeliverables}
          completedContracts={stats.completedContracts}
        />
        <p className="text-[0.8125rem] text-ink-3">
          {stats.approvedDeliverables > 0 ? `Calculado con trabajo aprobado y pagado en ${BRAND.name}.` : `Todavía no tiene trabajo aprobado en ${BRAND.name}.`}
        </p>
      </div>

      <BadgeList badges={activity.badges} />

      {activity.calendar.total > 0 ? (
        <Panel
          title="Actividad"
          description={`${activity.calendar.total} ${activity.calendar.total === 1 ? "video aprobado" : "videos aprobados"} en los últimos 6 meses`}
        >
          <ActivityCalendar calendar={activity.calendar} />
        </Panel>
      ) : null}

      {history.length > 0 ? (
        <Panel title="Trabajos" padded={false}>
          <Table caption={`Trabajos de ${user.name} en la plataforma`} minWidth={0}>
            <THead>
              <TR>
                <TH>Trabajo</TH>
                <TH numeric className="w-20 sm:w-36">
                  Videos
                </TH>
                <TH numeric className="w-24 sm:w-36">
                  Vistas
                </TH>
              </TR>
            </THead>
            <TBody>
              {history.map((item) => (
                <TR key={item.id}>
                  <TH scope="row">
                    {item.title}
                    <span className="block text-[0.8125rem] font-normal text-ink-3">{item.brandName}</span>
                  </TH>
                  <TD numeric>
                    <Num value={item.approved} compact={false} />
                  </TD>
                  <TD numeric>
                    <Num value={item.views} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      ) : null}

      {reviews.length > 0 ? (
        <Panel title="Reseñas" padded={false}>
          <div className="divide-y divide-line px-4 sm:px-5">
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                authorName={review.authorBrand}
                authorContext={review.contractTitle}
                rating={review.rating}
                comment={review.comment}
                date={review.createdAt}
              />
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
