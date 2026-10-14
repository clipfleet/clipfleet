import Link from "next/link";
import { LegalPage } from "@/components/shell/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" updated="14 de octubre de 2026">
      <p>
        Esta política explica qué datos personales guarda {BRAND.name}, para qué los usa y quién los ve. Complementa los <Link href="/terminos">Términos y condiciones</Link>.
      </p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, email, nombre de usuario y contraseña (guardada cifrada; nadie puede leerla).
        </li>
        <li>
          <strong>Perfil:</strong> lo que cargás: presentación, links, país, nombre del canal o la marca, redes donde publicás.
        </li>
        <li>
          <strong>Trabajo:</strong> campañas, postulaciones, invitaciones, contrataciones, videos y sus links, vistas reportadas y aprobadas, liquidaciones, mensajes y reseñas.
        </li>
        <li>
          <strong>Datos de cobro y pago:</strong> el titular de la cuenta y, para quien cobra, el CBU, CVU o alias.
        </li>
        <li>
          <strong>Datos técnicos:</strong> la dirección IP y el navegador de cada sesión iniciada, para mantener tu sesión y detectar accesos indebidos.
        </li>
      </ul>

      <h2>Para qué los usamos</h2>
      <p>
        Para que el servicio funcione: mostrar perfiles y campañas, conectar a las partes, calcular liquidaciones, que quien paga sepa a dónde transferir y mantener las cuentas
        seguras. También para escribirte sobre tu cuenta. <strong>No vendemos tus datos ni los usamos para publicidad.</strong>
      </p>

      <h2>Quién los ve</h2>
      <ul>
        <li>
          <strong>Cualquier persona:</strong> tu perfil público (nombre, usuario, presentación, links, resultados, insignias y reseñas) y las campañas abiertas con el nombre de
          quien las publica.
        </li>
        <li>
          <strong>La otra parte de una contratación:</strong> tus datos de cobro o pago, los mensajes, los videos y las vistas de ese trabajo. Los datos de cobro solo los ve
          quien te contrata.
        </li>
        <li>
          <strong>Nuestros proveedores de infraestructura</strong> (alojamiento web y base de datos), que guardan los datos por cuenta nuestra y pueden hacerlo en servidores fuera
          de Argentina. Al usar el servicio aceptás esa transferencia.
        </li>
        <li>Autoridades, solo si la ley nos obliga.</li>
      </ul>

      <h2>Cookies</h2>
      <p>Usamos una sola cookie, la que mantiene tu sesión iniciada. No usamos cookies de analítica ni de publicidad.</p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>Mientras tengas la cuenta. Si pedís borrarla, eliminamos tus datos, salvo lo que la ley nos obligue a conservar.</p>

      <h2>Tus derechos</h2>
      <p>
        Podés acceder a tus datos, corregirlos o pedir que los borremos. La mayoría se editan desde tu perfil; para lo demás, escribinos a{" "}
        <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>. El acceso es gratuito a intervalos no menores a seis meses, salvo que acredites un interés legítimo
        (Ley 25.326, art. 14 inc. 3).
      </p>
      <p>
        La Agencia de Acceso a la Información Pública, como órgano de control de la Ley 25.326, puede atender las denuncias y reclamos de quienes vean afectados sus derechos por
        incumplimiento de las normas de protección de datos personales.
      </p>

      <h2>Cambios</h2>
      <p>Si cambiamos esta política, publicamos la versión nueva acá con su fecha y, si el cambio es importante, te avisamos por email.</p>
    </LegalPage>
  );
}
