export const advancedMd = `# Examples

## Normal markdown

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Some [link out of here](https://www.arbeidstilsynet.no).
- **item 1 (bold)**
- *item 2 (italic)*

## Variable

Hey, {{ userName }}

## Nested variables: {{ variableWithDynamicMarkdown }}

## Logic

{{ if isParsingFun == true :: *Hello, world!* }}

{{if event == Bad::NotMuchWhiteSpaceHere}}
{{ if meaning != 42 :: Wrong universe, {{ userName }} }}

## Misc

<p style="color: red; text-align: center;">Random HTML</p>
<script>alert("I am sanitized")</script>
`;

export const advancedVars = {
  userName: "Saks B. Handler",
  event: "Good",
  meaning: "7",
  isParsingFun: true,
  variableWithDynamicMarkdown: "*I was nested*\n" + "Hello again, {{ userName }}\n\n",
} as const;
