import { PlatformIcon } from "@/components/domain/platform";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { JOB_PLATFORMS, PLATFORM_LABEL } from "@/lib/domain/categories";

// Sin JavaScript: el nombre de la plataforma aparece solo con "Otra" marcada. No es `required`
// porque el navegador validaría el campo aunque esté oculto; lo valida la acción.
const RULES = `.platform-field:not(:has(input[name="platform"][value="otra"]:checked)) [data-platform-name]{display:none}`;

/** Dónde se publican los videos. Sin opción marcada: la plataforma define cuánto vale cada vista y se elige a propósito. */
export function PlatformField() {
  return (
    <div className="platform-field flex flex-col gap-3">
      <style>{RULES}</style>
      <RadioCards
        name="platform"
        legend="¿Dónde se publican los videos?"
        required
        columns={4}
        options={JOB_PLATFORMS.map((platform) => ({
          value: platform,
          title: (
            <span className="inline-flex items-center gap-1.5">
              <PlatformIcon platform={platform} />
              {PLATFORM_LABEL[platform]}
            </span>
          ),
        }))}
      />
      <div data-platform-name className="sm:max-w-64">
        <Field label="Nombre de la plataforma">
          <Input name="platformName" maxLength={40} placeholder="Ej. Facebook" />
        </Field>
      </div>
    </div>
  );
}
