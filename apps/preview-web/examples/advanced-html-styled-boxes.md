# Varsel om tilsyn

<div style="background-color: #e8f4fd; border: 1px solid #b8daff; border-radius: 4px; padding: 16px; margin: 16px 0;">
  <strong style="font-size: 14pt;">Tilsynsdato: {{ tilsynsDato }}</strong><br/>
  Arbeidstilsynet vil gjennomføre tilsyn hos {{ virksomhetNavn }} på adressen {{ tilsynsAdresse }}.
</div>

Vi viser til vår telefonsamtale med {{ kontaktperson }} den {{ kontaktDato }}.

## Hva vi skal kontrollere

<div style="display: flex; gap: 16px; margin: 16px 0;">
<div style="flex: 1; border: 1px solid #ddd; border-radius: 4px; padding: 16px;">

### Arbeidsmiljø

- Fysisk arbeidsmiljø
- Psykososialt arbeidsmiljø
- {{ if ekstraTemaArbeidsmiljo :: {{ ekstraTemaArbeidsmiljo }} }}

</div>
<div style="flex: 1; border: 1px solid #ddd; border-radius: 4px; padding: 16px;">

### HMS-arbeid

- Internkontrollsystemet
- Verneombud og AMU
- {{ if ekstraTemaHMS :: {{ ekstraTemaHMS }} }}

</div>
</div>

## Dokumenter vi ber om å få tilsendt

{{ if harDokumentListe ::
<ol style="line-height: 2;">
  <li>Organisasjonskart med oversikt over ansvarsforhold</li>
  <li>Skriftlig dokumentasjon av HMS-systemet (internkontroll)</li>
  <li>Oversikt over verneombud og arbeidsmiljøutvalg</li>
  <li>Risikovurderinger knyttet til {{ risikoTema }}</li>
  <li>{{ if ekstraDokument :: {{ ekstraDokument }} }}</li>
</ol>
}}

{{ if !harDokumentListe ::
Vi vil be om dokumentasjon under tilsynet.
}}

<div style="border: 2px solid #dc3545; border-radius: 4px; padding: 16px; margin: 24px 0;">
  <p style="margin: 0 0 8px 0;"><strong style="color: #dc3545;">Viktig:</strong></p>
  <p style="margin: 0;">Send dokumentene til oss senest <strong>{{ dokumentFrist }}</strong>. Bruk eDialog og oppgi referansenummer {{ saksnummer }}.</p>
</div>

## Hvem bør delta

<table style="width: 100%; border-collapse: collapse;">
  <tr style="background-color: #f8f9fa;">
    <th style="text-align: left; padding: 10px; border-bottom: 2px solid #333;">Rolle</th>
    <th style="text-align: left; padding: 10px; border-bottom: 2px solid #333;">Formål</th>
  </tr>
  <tr>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Daglig leder / representant for arbeidsgiver</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Ansvarlig for HMS</td>
  </tr>
  <tr>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Verneombud</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Arbeidstakernes representant</td>
  </tr>
  {{ if harBHT ::
  <tr>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Bedriftshelsetjeneste</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">Faglig rådgiver</td>
  </tr>
  }}
</table>

## Praktisk informasjon

<div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin-top: 16px;">

| | |
|---|---|
| **Dato** | {{ tilsynsDato }} |
| **Klokkeslett** | {{ tilsynsKlokkeslett }} |
| **Sted** | {{ tilsynsAdresse }} |
| **Inspektør** | {{ inspektorNavn }} |
| **Telefon** | {{ inspektorTelefon }} |
| **Referanse** | {{ saksnummer }} |

</div>

## Om Arbeidstilsynets myndighet

Arbeidstilsynet fører tilsyn med at virksomhetene følger arbeidsmiljølovens krav. Arbeidsgiver plikter å gi oss adgang til arbeidsplassen og fremlegge nødvendig dokumentasjon, jf. arbeidsmiljøloven § 18-4.

[Les mer om hva som skjer ved tilsyn (arbeidstilsynet.no)](https://www.arbeidstilsynet.no/om-oss/tilsyn/)
