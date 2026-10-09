import type { ReactNode } from "react";
import { formatDate } from "@/components/ui/format";
import { BRAND } from "@/lib/brand";
import { DATA_SECTIONS, type DataSection } from "@/lib/privacy/inventory";
import { PRIVACY_POLICY_UPDATED } from "@/lib/privacy/policy";

export const metadata = { title: "Política de privacidad" };

/**
 * Qué se guarda en cada categoría. Las categorías salen del inventario de datos personales
 * (`src/lib/privacy/inventory.ts`): si ahí aparece una nueva, TypeScript exige describirla acá.
 */
const STORED: Record<DataSection, ReactNode> = {
  cuenta: "Tu nombre, tu email, tu nombre de usuario y tu contraseña. La contraseña se guarda cifrada con un algoritmo de una sola vía: nadie, tampoco nosotros, puede leerla.",
  perfil:
    "Lo que escribís para presentarte: tu línea de presentación si sos gestor, o el nombre de tu canal o marca si contratás.",
  actividad:
    "Lo que hacés en la plataforma: las búsquedas que publicás, tus postulaciones y su mensaje, las invitaciones, las contrataciones, y los videos que cargás con su link, la cuenta donde se subieron y las vistas reportadas y aprobadas.",
  pagos:
    "Si sos gestor, el titular y el alias, CBU o CVU donde cobrás. Si contratás, el titular de la cuenta desde la que pagás. También el monto de cada liquidación y, cuando se marca como pagada, una copia de la cuenta y los titulares de ese pago. No guardamos claves bancarias ni datos de tarjetas: los pagos se hacen por fuera de la plataforma.",
  conversaciones: "Los mensajes que intercambiás dentro de una contratación y las reseñas que dejás o recibís.",
  tecnicos:
    "Para mantener tu sesión guardamos la dirección IP y el navegador desde los que ingresaste. Para frenar intentos de acceso indebido llevamos un conteo de intentos por IP, email o usuario, guardado de forma que no permite reconstruirlos. Nuestros proveedores de alojamiento registran además los pedidos al sitio, como hace cualquier servidor web.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-title">{title}</h2>
      <div className="flex flex-col gap-3 text-ink-2">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5">{children}</ul>;
}

export default function PrivacyPage() {
  const mail = (
    <a href={`mailto:${BRAND.contactEmail}`} className="link">
      {BRAND.contactEmail}
    </a>
  );

  return (
    <div className="mx-auto flex max-w-prose flex-col gap-9 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="type-page">Política de privacidad</h1>
        <p className="text-[0.8125rem] text-ink-3">Última actualización: {formatDate(`${PRIVACY_POLICY_UPDATED}T12:00:00Z`)}</p>
        <p className="text-ink-2">
          Esta página explica qué datos personales guarda {BRAND.name}, para qué los usa, quién puede verlos y cómo pedir que se corrijan o se
          borren. Si algo no queda claro, escribinos a {mail}.
        </p>
      </header>

      <Section title="Quién es responsable">
        <p>
          {BRAND.name} es responsable de los datos personales que se cargan en este sitio. Para cualquier consulta o pedido sobre tus datos, el
          contacto es {mail}.
        </p>
      </Section>

      <Section title="Qué datos guardamos">
        <p>Solo los que hacen falta para que la plataforma funcione. Casi todos los cargás vos.</p>
        <dl className="flex flex-col gap-3">
          {(Object.keys(DATA_SECTIONS) as DataSection[]).map((section) => (
            <div key={section} className="flex flex-col gap-0.5">
              <dt className="font-medium text-ink">{DATA_SECTIONS[section]}</dt>
              <dd>{STORED[section]}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Para qué los usamos">
        <List>
          <li>Para que puedas publicar búsquedas, postularte, trabajar con otras personas y llevar la cuenta de lo que corresponde cobrar o pagar.</li>
          <li>Para armar tu perfil público y tu trayecto a partir de tu trabajo en la plataforma.</li>
          <li>Para proteger tu cuenta y el sitio de accesos indebidos y de abusos.</li>
        </List>
        <p>No usamos tus datos para publicidad, no armamos perfiles comerciales y no vendemos datos a nadie.</p>
      </Section>

      <Section title="Qué ve cada quién">
        <p>
          <span className="font-medium text-ink">Cualquier persona</span> puede ver tu perfil público si sos gestor: tu nombre, tu usuario, tu
          presentación, tus números de trayecto, tus insignias, tu calendario de actividad, los trabajos que hiciste con el nombre de quien te
          contrató, y las reseñas que recibiste. Si contratás, cualquiera puede ver tus búsquedas con el nombre de tu canal o marca.
        </p>
        <p>
          <span className="font-medium text-ink">La otra parte de una contratación</span> ve además los videos, las vistas, las liquidaciones y
          los mensajes de esa contratación. Tus datos de cobro los ve solo quien te contrata, y solo al momento de pagarte; el titular de la cuenta
          de quien paga lo ve solo quien cobra.
        </p>
        <p>
          <span className="font-medium text-ink">Nadie más</span> ve tu email, tus datos de cobro, tus mensajes ni los montos que cobrás o pagás.
        </p>
      </Section>

      <Section title="Con quién los compartimos">
        <p>Con los proveedores que hacen funcionar el sitio, que los tratan por cuenta nuestra y solo para eso:</p>
        <List>
          <li>Vercel, que aloja el sitio.</li>
          <li>Supabase, que aloja la base de datos.</li>
          <li>Zoho, que aloja nuestro correo: recibe lo que nos escribas por email.</li>
          <li>
            Have I Been Pwned, un servicio que avisa si una contraseña apareció en filtraciones conocidas. Al crear tu cuenta se le envía solo un
            fragmento de una huella de tu contraseña, nunca la contraseña ni tu email.
          </li>
        </List>
        <p>
          Los servidores de Vercel y de Supabase que usamos están en Estados Unidos, así que tus datos se guardan fuera de la Argentina. Al crear tu
          cuenta aceptás esa transferencia.
        </p>
        <p>Fuera de eso, solo entregamos datos si una autoridad competente lo exige por ley.</p>
      </Section>

      <Section title="Cuánto tiempo los guardamos">
        <p>
          Mientras tengas tu cuenta. Las sesiones vencen a la semana sin uso y los conteos de intentos caducan en horas y se limpian periódicamente. Si pedís la baja,
          borramos tus datos, salvo los que haya que conservar por una obligación legal y el registro de pagos que le queda a la otra parte de tus
          contrataciones.
        </p>
      </Section>

      <Section title="Cookies">
        <p>Usamos una sola cookie, la que mantiene tu sesión iniciada. No usamos cookies de publicidad ni de seguimiento.</p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Podés pedir en cualquier momento ver qué datos tuyos tenemos, que los corrijamos, que los actualicemos o que los borremos. Tu nombre, tu
          presentación y tus datos de cobro los cambiás vos desde tu perfil; para todo lo demás, escribinos a {mail} desde el email de tu cuenta.
        </p>
        <p>
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no
          inferiores a seis meses, salvo que se acredite un interés legítimo al efecto, conforme lo establecido en el artículo 14, inciso 3 de la
          Ley Nº 25.326.
        </p>
        <p>
          La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las
          denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de
          protección de datos personales.
        </p>
      </Section>

      <Section title="Cómo los cuidamos">
        <p>
          La conexión con el sitio y con la base de datos va cifrada, las contraseñas se guardan de forma que no se pueden leer, y cada dato solo
          es accesible para quien corresponde. Cambiar tus datos de cobro pide tu contraseña. Ningún sistema es infalible: si detectamos un
          incidente que afecte tus datos, te vamos a avisar.
        </p>
      </Section>

      <Section title="Menores de edad">
        <p>{BRAND.name} está pensado para personas mayores de 18 años. Si sos menor, no crees una cuenta.</p>
      </Section>

      <Section title="Cambios en esta política">
        <p>
          Cuando cambie qué datos guardamos o cómo los usamos, actualizamos esta página y la fecha de arriba. Si el cambio es importante, lo
          avisamos en el sitio.
        </p>
      </Section>
    </div>
  );
}
