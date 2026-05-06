# Vedtak om pålegg etter tilsyn

Vi viser til tilsynet hos {{ virksomhetNavn }} den {{ tilsynsDato }}.

## Oppsummering av funn

<table style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr>
      <th style="border: 1px solid #333; padding: 8px; background-color: #f0f0f0; text-align: left;">Nr.</th>
      <th style="border: 1px solid #333; padding: 8px; background-color: #f0f0f0; text-align: left;">Tema</th>
      <th style="border: 1px solid #333; padding: 8px; background-color: #f0f0f0; text-align: left;">Hjemmel</th>
      <th style="border: 1px solid #333; padding: 8px; background-color: #f0f0f0; text-align: left;">Frist</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #333; padding: 8px;">1</td>
      <td style="border: 1px solid #333; padding: 8px;">{{ tema1 }}</td>
      <td style="border: 1px solid #333; padding: 8px;">Arbeidsmiljøloven § 4-1</td>
      <td style="border: 1px solid #333; padding: 8px;">{{ frist1 }}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 8px;">2</td>
      <td style="border: 1px solid #333; padding: 8px;">{{ tema2 }}</td>
      <td style="border: 1px solid #333; padding: 8px;">Arbeidsmiljøloven § 3-1</td>
      <td style="border: 1px solid #333; padding: 8px;">{{ frist2 }}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 8px;" colspan="4"><em>Ytterligere detaljer følger nedenfor</em></td>
    </tr>
  </tbody>
</table>

## Pålegg 1 – {{ tema1 }}

### Hva vi fant

Under tilsynet avdekket vi følgende avvik:

<div style="border-left: 4px solid #c00; padding-left: 12px; margin: 16px 0;">

**Avvik:** {{ avvikBeskrivelse1 }}

**Hjemmel:** Arbeidsmiljøloven § 4-1 (1)

</div>

### Hva dere må gjøre

Dere må dokumentere at {{ virksomhetNavn }} har:

1. Kartlagt risikoen knyttet til {{ tema1 }}
2. Vurdert risikoen og iverksatt tiltak
3. Dokumentert tiltakene i en handlingsplan

### Frist

<p style="background-color: #fff3cd; padding: 12px; border: 1px solid #ffc107; border-radius: 4px;">
  <strong>Frist for å etterkomme pålegget:</strong> {{ frist1 }}
</p>

{{ if harPaalegg2 ::

## Pålegg 2 – {{ tema2 }}

### Hva vi fant

<div style="border-left: 4px solid #c00; padding-left: 12px; margin: 16px 0;">

**Avvik:** {{ avvikBeskrivelse2 }}

**Hjemmel:** Arbeidsmiljøloven § 3-1 (2) bokstav c

</div>

### Frist

<p style="background-color: #fff3cd; padding: 12px; border: 1px solid #ffc107; border-radius: 4px;">
  <strong>Frist for å etterkomme pålegget:</strong> {{ frist2 }}
</p>
}}

## Hvordan svare på pålegget

<table style="border-collapse: collapse; width: 100%;">
  <tr>
    <td style="padding: 12px; vertical-align: top; width: 50%; border: 1px solid #ddd;">
      <strong>Digitalt</strong><br/>
      Send dokumentasjon via eDialog. Oppgi referansenummer {{ saksnummer }}.
    </td>
    <td style="padding: 12px; vertical-align: top; width: 50%; border: 1px solid #ddd;">
      <strong>Per post</strong><br/>
      Arbeidstilsynet<br/>
      Postboks 4720 Torgarden<br/>
      7468 Trondheim
    </td>
  </tr>
</table>

## Klageadgang

Dere kan klage på vedtaket innen tre uker etter at dere har mottatt dette brevet. Klagen sendes til Arbeidstilsynet. Dersom vi ikke omgjør vedtaket, sender vi klagen videre til Direktoratet for arbeidstilsynet.
