
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[#1d1d1f] mb-3">{title}</h2>
      <div className="text-sm text-[#3d3d3f] leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  )
}

export function TermsPage() {
  const salonName = 'Nail Bar Sibiu'
  const email = 'daniela.cobosnean@gmail.com'
  const year = new Date().getFullYear()

  return (
    <div className="flex flex-col items-center px-4 pt-6 md:pt-28 pb-16">

      <div className="w-full max-w-2xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Termeni și condiții</h1>
          <p className="text-sm text-[#6e6e73]">Ultima actualizare: {year}</p>
        </header>

        <div className="glass rounded-3xl px-8 py-8">
          <Section title="1. Informații generale">
            <p>
              Prezentele Termeni și Condiții reglementează utilizarea platformei de programări online a salonului <strong>{salonName}</strong>.
              Prin utilizarea acestui site și efectuarea unei programări, acceptați integral acești termeni.
            </p>
          </Section>

          <Section title="2. Programări online">
            <p>Programările se efectuează exclusiv online prin intermediul acestei platforme.</p>
            <p>O programare este considerată confirmată doar după primirea unui mesaj de confirmare.</p>
            <p>
              Vă rugăm să anulați programarea cu cel puțin <strong>24 de ore</strong> înainte de ora stabilită, în caz contrar ne rezervăm dreptul de a restricționa accesul la programări viitoare.
            </p>
          </Section>

          <Section title="3. Prețuri și plată">
            <p>Prețurile afișate pe site sunt orientative și pot fi modificate fără notificare prealabilă.</p>
            <p>Plata se efectuează la salon, la finalul serviciului.</p>
            <p>
              Pentru servicii speciale sau cereri personalizate, prețul final poate diferi față de cel afișat — clientul va fi informat înainte de începerea lucrării.
            </p>
          </Section>

          <Section title="4. Obligațiile clientului">
            <p>Clientul se obligă să se prezinte la ora programată. O întârziere de peste 15 minute poate duce la reprogramare.</p>
            <p>Clientul este responsabil pentru exactitatea datelor de contact furnizate la programare.</p>
          </Section>

          <Section title="5. Limitarea răspunderii">
            <p>
              {salonName} nu poate fi tras la răspundere pentru reacții alergice datorate materialelor utilizate, în cazul în care clientul nu a informat în prealabil despre alergii cunoscute.
            </p>
            <p>Ne rezervăm dreptul de a refuza furnizarea serviciilor în cazul unor condiții medicale incompatibile cu procedurile oferite.</p>
          </Section>

          <Section title="6. Modificarea termenilor">
            <p>
              {salonName} își rezervă dreptul de a modifica oricând acești termeni. Versiunea actualizată va fi publicată pe această pagină.
            </p>
          </Section>

          <Section title="7. Contact">
            <p>
              Pentru orice întrebări legate de acești termeni, ne puteți contacta la adresa de email:{' '}
              <a href={`mailto:${email}`} className="text-[#34c759] no-underline hover:underline">{email}</a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
