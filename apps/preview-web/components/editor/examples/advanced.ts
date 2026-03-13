export const advancedMd = `# Examples

## Normal markdown

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Some [link out of here](https://www.arbeidstilsynet.no).
- **item 1 (bold)**
- *item 2 (italic)*

## Variable
Hey, {{ userName }}
## Nested variables
*see initial value containing dynamic fields*
{{ variableWithDynamicMarkdown }}

## Logic
*shorthand truthyness, coerces values*
{{ if isParsingFun :: *Hello, world!* }}
{{ if !isParsingFun :: *Goodbye, world!* }}

*both left and right operands can be variables, and whitespace is flexible*
{{if event == event2::NotMuchWhiteSpaceHere}}

*logic can also be nested*
{{ if meaning != 42 :: Wrong universe, {{ if userName :: userName }} }}

## Misc

<p style="color: red; text-align: center;">Random HTML</p>
<script>alert("I am sanitized")</script>
`;

export const advancedVars = {
  userName: "Saks B. Handler",
  event: "Good",
  meaning: "7",
  isParsingFun: true,
  variableWithDynamicMarkdown: "*I was nested*\nHello again, {{ userName }}\n",
} as const;
