import { PlatformIcon } from "@/components/domain/platform";
import { RadioCards } from "@/components/ui/radio-cards";
import { JOB_PLATFORMS, PLATFORM_LABEL } from "@/lib/domain/categories";

/** Dónde se publican los videos. Sin opción marcada: la plataforma define cuánto vale cada vista y se elige a propósito. */
export function PlatformField() {
  return (
    <RadioCards
      name="platform"
      legend="¿Dónde se publican los videos?"
      required
      columns={3}
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
  );
}
