<div style="background: #e8f0fe; border-left: 4px solid #4285f4; padding: 16px; margin-bottom: 24px; border-radius: 4px;">

**Eksempelmal: Tabeller og stilede bokser med HTML**

Denne malen viser hvordan HTML-tabeller og stilede elementer kan brukes sammen med Markdown. Teknikker som demonstreres:

- Tabeller med **rammer, bakgrunnsfarger og `colspan`**
- Fargede venstrekant-bokser for å fremheve avvik
- Advarselsbokser med **bakgrunnsfarge og avrundede hjørner**
- Tokolonners layout med tabell for kontaktinformasjon
- Betinget visning av hele seksjoner med `if`-logikk
- Tabellrader med hardkodede eksempler (i praksis genererer fagsystemet HTML-rader basert på data)

</div>

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
      <td style="border: 1px solid #333; padding: 8px;">Kjemisk arbeidsmiljø</td>
      <td style="border: 1px solid #333; padding: 8px;">Arbeidsmiljøloven § 4-1</td>
      <td style="border: 1px solid #333; padding: 8px;">01.07.2026</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 8px;">2</td>
      <td style="border: 1px solid #333; padding: 8px;">Systematisk HMS-arbeid</td>
      <td style="border: 1px solid #333; padding: 8px;">Arbeidsmiljøloven § 3-1</td>
      <td style="border: 1px solid #333; padding: 8px;">15.08.2026</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 8px;" colspan="4"><em>Ytterligere detaljer følger nedenfor</em></td>
    </tr>
  </tbody>
</table>

## Pålegg 1 – Kjemisk arbeidsmiljø

### Hva vi fant

Under tilsynet avdekket vi følgende avvik:

<div style="border-left: 4px solid #c00; padding-left: 12px; margin: 16px 0;">

**Avvik:** Virksomheten mangler oppdaterte risikovurderinger for bruk av kjemikalier i produksjonen.

**Hjemmel:** Arbeidsmiljøloven § 4-1 (1)

</div>

### Hva dere må gjøre

Dere må dokumentere at {{ virksomhetNavn }} har:

1. Kartlagt risikoen knyttet til kjemisk arbeidsmiljø
2. Vurdert risikoen og iverksatt tiltak
3. Dokumentert tiltakene i en handlingsplan

### Frist

<p style="background-color: #fff3cd; padding: 12px; border: 1px solid #ffc107; border-radius: 4px;">
  <strong>Frist for å etterkomme pålegget:</strong> 01.07.2026
</p>

{{ if harPaalegg2 ::

## Pålegg 2 – Systematisk HMS-arbeid

### Hva vi fant

<div style="border-left: 4px solid #c00; padding-left: 12px; margin: 16px 0;">

**Avvik:** Virksomheten har ikke gjennomført årlig gjennomgang av internkontrollsystemet.

**Hjemmel:** Arbeidsmiljøloven § 3-1 (2) bokstav c

</div>

### Frist

<p style="background-color: #fff3cd; padding: 12px; border: 1px solid #ffc107; border-radius: 4px;">
  <strong>Frist for å etterkomme pålegget:</strong> 15.08.2026
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
