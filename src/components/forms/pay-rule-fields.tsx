import { Disclosure } from "@/components/ui/disclosure";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { MAX_TIERS } from "@/lib/payrules/form";

// Sin JavaScript: se muestran solo los campos del tipo elegido. El fijo queda a la vista
// cuando es el único pago; si no, aparece al abrir "Más opciones". Los campos ocultos se envían igual.
const typeChecked = (type: string) => `:has(input[name="variableType"][value="${type}"]:checked)`;
const RULES = [
  ...["cpm", "tiers"].map((type) => `.pay-rule:not(${typeChecked(type)}) [data-rule="${type}"]{display:none}`),
  `.pay-rule${typeChecked("none")} [data-more]{display:none}`,
  `.pay-rule:not(${typeChecked("none")}):not(:has([data-more] details[open])) [data-fixed]{display:none}`,
].join("");

const TIER_COLUMNS = "sm:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)]";

/** Campos para definir cómo se paga. Los lee `payRuleFromForm`. */
export function PayRuleFields() {
  return (
    <div className="pay-rule flex flex-col gap-5">
      <style>{RULES}</style>

      <RadioCards
        name="variableType"
        legend="¿Cómo pagás?"
        defaultValue="cpm"
        columns={3}
        options={[
          { value: "cpm", title: "Por cada 1.000 vistas" },
          { value: "tiers", title: "Por escalones de vistas" },
          { value: "none", title: "Fijo por video" },
        ]}
      />

      <div data-rule="cpm" className="sm:max-w-56">
        <Field label="Pago cada 1.000 vistas">
          <Input name="cpmRate" type="number" min="0" step="0.01" inputMode="decimal" leading="$" />
        </Field>
      </div>

      {/* Escalones como una tabla chica: los rótulos van una vez arriba, no en cada fila. */}
      <div data-rule="tiers" className="flex flex-col gap-2">
        <div aria-hidden="true" className={`hidden gap-x-3 sm:grid ${TIER_COLUMNS}`}>
          <span />
          <span className="type-label font-medium text-ink">Al llegar a</span>
          <span className="type-label font-medium text-ink">El video cobra</span>
        </div>
        {Array.from({ length: MAX_TIERS }, (_, index) => index + 1).map((n) => (
          <div key={n} className={`grid grid-cols-2 items-center gap-x-3 gap-y-1.5 ${TIER_COLUMNS}`}>
            <p className="col-span-2 text-[0.8125rem] text-ink-2 sm:col-span-1">Escalón {n}</p>
            <Input
              name={`tierViews${n}`}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              aria-label={`Escalón ${n}: vistas que tiene que alcanzar el video`}
              trailing="vistas"
            />
            <Input
              name={`tierAmount${n}`}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-label={`Escalón ${n}: cuánto cobra el video al alcanzarlo`}
              leading="$"
            />
          </div>
        ))}
        <p className="mt-1 text-[0.8125rem] text-ink-3">Cada video cobra el escalón más alto que alcanzó, no la suma. Completá solo los que uses.</p>
      </div>

      {/* El orden visual lo fija `order`: el fijo va debajo de las opciones del variable. */}
      <div className="flex flex-col gap-4">
        <div data-fixed className="order-2 sm:max-w-56">
          <Field label="Fijo por video aprobado">
            <Input name="fixed" type="number" min="0" step="0.01" inputMode="decimal" leading="$" />
          </Field>
        </div>
        <div data-more className="order-1">
          <Disclosure title="Más opciones" variant="plain">
            <div data-rule="cpm" className="grid items-start gap-4 sm:max-w-md sm:grid-cols-2">
              <Field label="Mínimo de vistas" hint="Debajo de esto el video no cobra.">
                <Input name="cpmMinViews" type="number" min="0" step="1" inputMode="numeric" trailing="vistas" />
              </Field>
              <Field label="Tope por video">
                <Input name="cpmCap" type="number" min="0" step="0.01" inputMode="decimal" leading="$" />
              </Field>
            </div>
          </Disclosure>
        </div>
      </div>
    </div>
  );
}
