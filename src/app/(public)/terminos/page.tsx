import Link from "next/link";
import { LegalPage } from "@/components/shell/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Términos" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="14 de octubre de 2026">
      <p>
        Estos términos rigen el uso de {BRAND.name}. Al crear una cuenta los aceptás. Si no estás de acuerdo con ellos, no uses el servicio. Cómo tratamos tus datos está en la{" "}
        <Link href="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>Qué es {BRAND.name}</h2>
      <p>
        Una plataforma que conecta a quienes tienen contenido (creadores y marcas) con quienes lo suben a redes sociales, y les da herramientas para gestionar ese trabajo: campañas,
        postulaciones, invitaciones, registro de videos y vistas, y el cálculo de lo que corresponde pagar.
      </p>

      <h2>Los pagos son entre las partes</h2>
      <ul>
        <li>
          Los pagos se acuerdan y se hacen <strong>directamente entre quien contrata y quien sube los videos</strong>, por fuera de {BRAND.name}. No recibimos, retenemos ni
          transferimos dinero.
        </li>
        <li>
          {BRAND.name} no es parte del acuerdo entre ellas: <strong>no garantiza que los pagos se hagan</strong> ni responde por ellos.
        </li>
        <li>
          Las liquidaciones son un cálculo hecho a partir de la regla de pago de la campaña o la invitación y de las vistas que aprobó quien contrata. &quot;Pagado&quot; y
          &quot;cobro confirmado&quot; son lo que declara cada parte; no los verificamos.
        </li>
        <li>Si hay un desacuerdo sobre un pago, lo resuelven las partes entre sí. No arbitramos disputas.</li>
        <li>Cada parte se ocupa de sus propias obligaciones impositivas, como facturar o declarar lo que cobra.</li>
        <li>Hoy usar {BRAND.name} no tiene costo. Si eso cambia, lo avisamos antes y no se aplica a lo ya acordado.</li>
      </ul>

      <h2>Lo que acepta cada parte</h2>
      <ul>
        <li>
          Quien publica una campaña o manda una invitación se compromete a pagar lo que la regla de pago calcule sobre las vistas que apruebe, y a revisar los videos y las vistas
          de buena fe.
        </li>
        <li>Quien se postula o acepta una invitación acepta esa regla de pago y se compromete a reportar videos y vistas reales.</li>
      </ul>

      <h2>Contenido</h2>
      <ul>
        <li>
          Quien publica una campaña declara tener los derechos sobre el contenido que entrega y el permiso para que se publique. También es responsable de identificarlo como
          publicidad cuando corresponda.
        </li>
        <li>
          Lo que cargás (perfil, campañas, mensajes, reseñas, links) sigue siendo tuyo. Nos das permiso para mostrarlo dentro del servicio en la medida en que haga falta para que
          funcione, por ejemplo en tu perfil público o en la página de una campaña.
        </li>
      </ul>

      <h2>Redes sociales</h2>
      <p>
        Cada persona es responsable de cumplir las reglas de las redes donde publica. {BRAND.name} no tiene relación con esas redes y no responde por cuentas suspendidas o
        eliminadas, ni por vistas que una red quite o no cuente.
      </p>

      <h2>Qué no se permite</h2>
      <ul>
        <li>Dar datos falsos o hacerte pasar por otra persona o marca.</li>
        <li>Reportar vistas falsas o simular contrataciones o pagos para inflar un perfil.</li>
        <li>Publicar contenido ilegal o sobre el que no tenés derechos.</li>
        <li>Acosar o engañar a otras personas del servicio.</li>
        <li>Intentar acceder a cuentas o datos ajenos, o afectar el funcionamiento del servicio.</li>
      </ul>

      <h2>Tu cuenta</h2>
      <p>
        Sos responsable de lo que se haga con tu cuenta y de cuidar tu contraseña. Podemos suspender una cuenta o quitar contenido que incumpla estos términos, y cuando sea posible
        te avisamos el motivo.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        Ofrecemos el servicio tal como está y hacemos lo posible para que funcione bien, pero no garantizamos que no tenga errores o interrupciones. En la medida en que la ley lo
        permita, {BRAND.name} no responde por los acuerdos entre las partes, los pagos, el contenido que cargan otras personas ni lo que pase en otras plataformas.
      </p>

      <h2>Cambios</h2>
      <p>Si cambiamos estos términos, publicamos la versión nueva acá con su fecha y, si el cambio es importante, te avisamos por email antes de que rija.</p>

      <h2>Ley aplicable y contacto</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Por cualquier consulta, escribinos a <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
