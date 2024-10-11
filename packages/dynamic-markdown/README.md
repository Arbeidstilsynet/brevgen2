# Dynamic Markdown

En ny løsning for dynamiske brevmaler.

MDX lar oss bruke komponenter i Markdown. Det er nyttig, men dekker ikke helt våre behov. Vi skal generere brev med dynamiske flettefelt, noe vi tidligere har brukt Aspose for. Dette er et tungt program som tar tid å starte opp og det krever at vi bruker Word-filer med spesielle symboler for flettefeltene. Disse binærfilene fungerer dårlig med versjonskontroll, er lette å gjøre feil i og er relativt tungvinte å skrive.

I stedet for den gamle løsningen har vi nå et alternativ. Dette er en utvidelse av Markdown med støtte for logikk og nøstede flettefelt. Flettefeltene kan igjen inneholde utvidet Markdown. Dette gjør at f.eks. varselbrev som skal ha en liste med avsnitt for hver årsak kan genereres av fagsystemet, uten at malen må forhåndsdefinere alle mulige varianter og kombinasjoner. Dynamisk Markdown er veldig fleksibelt.

For å generere brev bruker vi standard tredjepartsløsninger som konverterer Markdown (etter vår parsing) til HTML og så PDF. Disse løsningene lar oss sette inn header og footer som HTML, så vi kan bruke samme standard-mal for alle brevene våre uten å definere de i hver eneste brevmal. Brevmalene kan fokusere på innhold.

## Nytt filformat

.mdat
Dynamic Markdown (Arbeidstilsynet)

Filtype har ikke egentlig noe å si for løsningen, men det kan brukes til å skille mellom statisk og dynamisk markdown.

## Utvidet syntaks

### Variabler

```sh
Orgnr = 123456789
```

```md
# MyHeader
- Asdf
- {{ Orgnr }}
Lorem ipsum
```

#### Nøstet fletting av variabler

```sh
NestedMarkdown = "### Dere er {{ MyVar }}\n### Dere skal ikke tilbakekalles"
MyVar = "en snill virksomhet"
```

```md
## Hva vi har konkludert
{{ NestedMarkdown }}
```

### Logikk

```sh
IsNuf = true
Svartype = "automatisk"
```

Input:

```md
# MyHeader
{{ if IsNuf == true :: Svartype er {{ Svartype }} }}
Lorem ipsum
```

Output:

```md
# MyHeader
Svartype er automatisk
Lorem ipsum
```
