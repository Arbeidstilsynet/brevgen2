// old global CSS before whitespace adjustments, replace with standard globalCss when consumers are ready
const globalCss = `
body {
  font-family: 'Aptos', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11.5pt;
  }
h1 {
  font-size: 22pt;
  font-weight: normal;
}
h2 {
  font-size: 16pt;
  font-weight: normal;
}
h3 {
  font-size: 14pt;
  font-weight: normal;
}
h4 {
  font-size: 11.5pt;
  font-weight: bold;
}
p {
  break-inside: avoid;
}
a {
  color: #3C4C7D;
}
`;

export const blankTemplate = {
  globalCss,
};
