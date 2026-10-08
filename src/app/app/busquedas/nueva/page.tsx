import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { PayRuleFields } from "@/components/forms/pay-rule-fields";
import { PlatformField } from "@/components/forms/platform-field";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "@/lib/actions/jobs";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Publicar búsqueda" };

export default async function NewJobPage() {
  await requireUser("hirer");

  return (
    <>
      <PageHeader back={{ href: "/app/busquedas", label: "Búsquedas" }} title="Publicar búsqueda" />

      <ActionForm action={createJob} className="flex max-w-2xl flex-col gap-5">
        <Panel>
          <div className="flex flex-col gap-5">
            <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
              <Field label="Título">
                <Input name="title" required minLength={5} maxLength={120} placeholder="Ej. Subir recortes del podcast" />
              </Field>
              <Field label="Cupos">
                <Input name="slots" type="number" min="1" max="200" step="1" defaultValue="1" inputMode="numeric" />
              </Field>
            </div>
            <Field label="Descripción" hint="Qué material das y cuántos videos esperas.">
              <Textarea name="description" required minLength={20} rows={4} />
            </Field>
            <PlatformField />
            <PayRuleFields />
          </div>
        </Panel>

        <div>
          <FormSubmit pendingLabel="Publicando…">
            Publicar búsqueda
          </FormSubmit>
        </div>
      </ActionForm>
    </>
  );
}
