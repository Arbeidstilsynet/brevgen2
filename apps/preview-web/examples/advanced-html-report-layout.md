# Rapport fra tilsyn – {{ virksomhetNavn }}

<div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 4px;">
  <div>
    <strong>Tilsynsdato:</strong> {{ tilsynsDato }}<br/>
    <strong>Inspektør:</strong> {{ inspektorNavn }}
  </div>
  <div style="text-align: right;">
    <strong>Saksnummer:</strong> {{ saksnummer }}<br/>
    <strong>Næring:</strong> {{ naering }}
  </div>
</div>

## 1. Innledning

Arbeidstilsynet gjennomførte tilsyn hos {{ virksomhetNavn }} den {{ tilsynsDato }}. Tilsynet ble varslet {{ varselDato }}. Til stede under tilsynet var:

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <tr>
    <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333; width: 40%;">Navn</th>
    <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333; width: 30%;">Rolle</th>
    <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333; width: 30%;">Representerer</th>
  </tr>
  <tr>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ deltaker1Navn }}</td>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ deltaker1Rolle }}</td>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ virksomhetNavn }}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ deltaker2Navn }}</td>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ deltaker2Rolle }}</td>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ virksomhetNavn }}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ inspektorNavn }}</td>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">Inspektør</td>
    <td style="padding: 8px; border-bottom: 1px solid #eee;">Arbeidstilsynet</td>
  </tr>
</table>

## 2. Kontrollerte tema

<div style="break-after: avoid;">

### 2.1 Systematisk HMS-arbeid

</div>

{{ if hmsStatus == ok ::
<div style="border-left: 4px solid #28a745; padding: 8px 12px; margin: 12px 0; background: #f0fff0;">
  <strong>Ingen avvik.</strong> Virksomheten har et fungerende HMS-system i tråd med kravene i internkontrollforskriften.
</div>
}}

{{ if hmsStatus == avvik ::
<div style="border-left: 4px solid #dc3545; padding: 8px 12px; margin: 12px 0; background: #fff0f0;">
  <strong>Avvik påvist.</strong> {{ hmsAvvikTekst }}
</div>
}}

{{ if hmsStatus == merknad ::
<div style="border-left: 4px solid #ffc107; padding: 8px 12px; margin: 12px 0; background: #fffef0;">
  <strong>Merknad.</strong> {{ hmsMerknadTekst }}
</div>
}}

<div style="break-after: avoid;">

### 2.2 Arbeidstid

</div>

{{ if arbeidstidStatus == ok ::
<div style="border-left: 4px solid #28a745; padding: 8px 12px; margin: 12px 0; background: #f0fff0;">
  <strong>Ingen avvik.</strong> Arbeidstidsordningene er i tråd med arbeidsmiljøloven kapittel 10.
</div>
}}

{{ if arbeidstidStatus == avvik ::
<div style="border-left: 4px solid #dc3545; padding: 8px 12px; margin: 12px 0; background: #fff0f0;">
  <strong>Avvik påvist.</strong> {{ arbeidstidAvvikTekst }}
</div>
}}

<div style="break-before: page;"></div>

## 3. Sammendrag og videre oppfølging

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background: #f0f0f0;">
      <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Tema</th>
      <th style="padding: 10px; border: 1px solid #ccc; text-align: center; width: 100px;">Status</th>
      <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Reaksjon</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px; border: 1px solid #ccc;">Systematisk HMS-arbeid</td>
      <td style="padding: 10px; border: 1px solid #ccc; text-align: center;">{{ if hmsStatus == ok :: ✅ }}{{ if hmsStatus == avvik :: ❌ }}{{ if hmsStatus == merknad :: ⚠️ }}</td>
      <td style="padding: 10px; border: 1px solid #ccc;">{{ if hmsStatus == ok :: Ingen }}{{ if hmsStatus == avvik :: Pålegg }}{{ if hmsStatus == merknad :: Anmerkning i rapport }}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ccc;">Arbeidstid</td>
      <td style="padding: 10px; border: 1px solid #ccc; text-align: center;">{{ if arbeidstidStatus == ok :: ✅ }}{{ if arbeidstidStatus == avvik :: ❌ }}</td>
      <td style="padding: 10px; border: 1px solid #ccc;">{{ if arbeidstidStatus == ok :: Ingen }}{{ if arbeidstidStatus == avvik :: Pålegg }}</td>
    </tr>
  </tbody>
</table>

{{ if harPaalegg ::
<div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 16px; margin: 24px 0;">

### Neste steg

Arbeidstilsynet vil sende **vedtak om pålegg** i egen forsendelse. Dere vil få en frist for å rette opp avvikene.

Dersom pålegget ikke etterkommes innen fristen, kan Arbeidstilsynet ilegge tvangsmulkt, jf. arbeidsmiljøloven § 18-7.

</div>
}}

{{ if !harPaalegg ::
<div style="background: #d4edda; border: 1px solid #28a745; border-radius: 4px; padding: 16px; margin: 24px 0;">

### Tilsynet er avsluttet

Det ble ikke avdekket avvik under tilsynet. Saken avsluttes uten videre oppfølging.

</div>
}}

## 4. Om rapporten

Denne rapporten er en oppsummering av tilsynet. Rapporten er ikke et enkeltvedtak etter forvaltningsloven § 2. Eventuelle vedtak sendes i egen forsendelse.

Har dere spørsmål, ta kontakt med {{ inspektorNavn }} på telefon {{ inspektorTelefon }} eller via eDialog. Oppgi referansenummer {{ saksnummer }}.
