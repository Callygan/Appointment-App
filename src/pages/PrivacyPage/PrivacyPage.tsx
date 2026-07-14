
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[#1d1d1f] mb-3">{title}</h2>
      <div className="text-sm text-[#3d3d3f] leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  )
}

export function PrivacyPage() {
  const salonName = 'Nail Bar Sibiu'
  const email = 'daniela.cobosnean@gmail.com'
  const year = new Date().getFullYear()

  return (
    <div className="flex flex-col items-center px-4 pt-28 pb-16">

      <div className="w-full max-w-2xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Politica de confidențialitate</h1>
          <p className="text-sm text-[#6e6e73]">Ultima actualizare: {year}</p>
        </header>

        <div className="glass rounded-3xl px-8 py-8">
          <Section title="1. Cine suntem">
            <p>
              <strong>{salonName}</strong> este operatorul datelor cu caracter personal colectate prin intermediul acestui site.
              Ne puteți contacta la: <a href={`mailto:${email}`} className="text-[#34c759] no-underline hover:underline">{email}</a>
            </p>
          </Section>

          <Section title="2. Ce date colectăm">
            <p>La efectuarea unei programări online, colectăm următoarele date:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Nume și prenume</li>
              <li>Număr de telefon</li>
              <li>Cont Instagram (opțional)</li>
              <li>Serviciul selectat și ora programării</li>
            </ul>
          </Section>

          <Section title="3. Scopul prelucrării">
            <p>Datele colectate sunt folosite exclusiv pentru:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Gestionarea și confirmarea programărilor</li>
              <li>Contactarea clientului în legătură cu programarea sa</li>
              <li>Îmbunătățirea serviciilor oferite</li>
            </ul>
            <p>Nu folosim datele dvs. în scopuri de marketing fără consimțământul explicit.</p>
          </Section>

          <Section title="4. Temeiul legal">
            <p>
              Prelucrarea se realizează în baza <strong>contractului</strong> dintre client și salon (art. 6 alin. 1 lit. b din GDPR) —
              programarea reprezintă o înțelegere contractuală pentru furnizarea unui serviciu.
            </p>
          </Section>

          <Section title="5. Durata stocării">
            <p>
              Datele de programare sunt păstrate timp de maximum <strong>12 luni</strong> de la data ultimei programări,
              după care sunt șterse sau anonimizate.
            </p>
          </Section>

          <Section title="6. Partajarea datelor">
            <p>
              Nu vindem, nu închiriem și nu transmitem datele dvs. personale către terți,
              cu excepția cazurilor prevăzute de lege.
            </p>
            <p>
              Datele sunt stocate în siguranță prin intermediul platformei <strong>Supabase</strong>,
              care respectă standardele GDPR.
            </p>
          </Section>

          <Section title="7. Drepturile dvs.">
            <p>Conform GDPR, aveți dreptul de:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Acces la datele dvs. personale</li>
              <li>Rectificarea datelor incorecte</li>
              <li>Ștergerea datelor („dreptul de a fi uitat")</li>
              <li>Restricționarea prelucrării</li>
              <li>Portabilitatea datelor</li>
              <li>Opoziție față de prelucrare</li>
            </ul>
            <p>
              Pentru exercitarea acestor drepturi, contactați-ne la:{' '}
              <a href={`mailto:${email}`} className="text-[#34c759] no-underline hover:underline">{email}</a>
            </p>
          </Section>

          <Section title="8. Cookie-uri">
            <p>
              Acest site nu folosește cookie-uri de tracking sau publicitate.
              Sunt utilizate exclusiv cookie-uri tehnice necesare funcționării autentificării în panoul de administrare.
            </p>
          </Section>

          <Section title="9. Modificări">
            <p>
              Ne rezervăm dreptul de a actualiza această politică. Versiunea actualizată va fi publicată pe această pagină
              cu data ultimei modificări.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
