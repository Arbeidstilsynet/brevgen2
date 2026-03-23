import { GenerateDocumentRequest } from "@repo/shared-types";

const defaultTemplateShortMd = `# Test PDF

This is a {{var}}

| THeader 1       | THeader 2       | THeader 3 |
|:----------------|:----------------|:----------|
| Cell 1          | Cell 2          | Cell 3    |
| *Italic cell 4* | **Bold cell 5** | Cell 6    |

## Heading 2

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et nisi fermentum, sodales nisi non, sagittis nulla. Cras a convallis orci, fermentum maximus enim. Pellentesque ac gravida orci, sed convallis ante. In placerat vehicula justo nec tempor.

- List item 1
  - Nested list item 1a
  - Nested list item 1b
- List item 2

We also support [links](https://www.example.com)
`;

export const defaultTemplateShortPayload: GenerateDocumentRequest = {
  md: defaultTemplateShortMd,
  mdVariables: {
    var: "test PDF",
  },
  options: {
    dynamic: {
      template: "default",
      defaultTemplateArgs: {
        language: "bm",
        signatureVariant: "automatiskBehandlet",
        fields: {
          dato: "12.24.2030",
          saksnummer: "2030/999",
          saksbehandlerNavn: "Test Testesen",
          virksomhet: {
            navn: "Test Containers",
            adresse: "Testveien 1",
            postnr: "1234",
            poststed: "Teststed",
          },
        },
      },
    },
  },
};

const defaultTemplateLongMd = `# Lorem ipsum dolor sit amet

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse tempor tortor dui, ut convallis justo porttitor id. Aliquam lorem risus, vestibulum nec ante non, pretium maximus neque. Nulla tristique justo id tellus iaculis, ac ultrices tellus condimentum. In viverra bibendum felis commodo ullamcorper. Sed massa massa, consequat imperdiet fringilla quis, condimentum et turpis. Nulla ultricies sit amet metus et dapibus. Sed varius nibh purus, eu faucibus neque congue at. Praesent auctor turpis et massa blandit tincidunt. Nulla facilisi. Vestibulum commodo felis ante.

Suspendisse gravida eleifend fringilla. Aenean ut faucibus diam. In accumsan vel dolor scelerisque condimentum. Phasellus posuere lectus neque, a tristique eros bibendum sit amet. Sed ut augue vitae massa porta suscipit. Mauris luctus eget ante sed gravida. Ut in faucibus nulla. Sed lorem dolor, tempus nec libero vitae, consectetur facilisis nisl. Donec lacinia ornare nulla a consequat. Nam lacinia massa ante, non sagittis libero tempus eu. Duis nec ipsum quis elit fermentum sollicitudin vel sit amet arcu. Ut vulputate tortor lectus, in viverra sem congue vestibulum. Maecenas non semper erat. Aenean iaculis varius nulla nec luctus. Pellentesque sed faucibus ante, vel tincidunt quam. Donec eu urna sem.

## Foo

{{var1}}

Suspendisse erat massa, dictum ac pharetra eu, volutpat et nibh. Integer non sagittis justo. Cras porttitor ex erat, vel iaculis tellus rutrum ac. Aliquam ac sapien elementum, malesuada mi id, gravida dolor. Nullam ut quam nec mauris dapibus vulputate. Nunc sit amet neque eu tortor laoreet ullamcorper id vel justo. Sed vehicula quis nunc in placerat. Suspendisse justo erat, finibus in ullamcorper at, fermentum nec augue. Etiam elit nisi, fringilla tristique semper eu, tincidunt sed eros. Donec finibus hendrerit tellus, accumsan lacinia nibh convallis quis. Donec consequat diam nisl, id sodales augue venenatis et.

Maecenas sit amet mi lacus. Phasellus non turpis vitae mauris ornare finibus at non mauris. Fusce vehicula dignissim suscipit. Maecenas fermentum enim at ipsum mollis gravida. Vivamus vel quam cursus, varius lacus non, posuere dolor. Pellentesque tristique vehicula felis, non hendrerit nisi efficitur ac. Sed tempus, odio at pharetra venenatis, risus diam facilisis eros, non aliquet metus nisi sit amet mauris. Etiam mattis feugiat vestibulum.

Pellentesque vitae porttitor ex, sed tempor orci. Aenean elementum facilisis mi, ac euismod nisl malesuada a. Suspendisse vel feugiat diam, id ultrices libero. Fusce ornare mauris libero, nec posuere ligula finibus nec. Mauris quis eleifend orci. Nam blandit nisl mauris, nec tristique dui laoreet id. Aenean sagittis risus id eleifend faucibus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin ipsum sapien, finibus ut turpis id, iaculis dictum odio. Duis blandit vehicula est ut mollis. Donec pretium tempus lectus a mollis.

## Bar

{{var2}}

Maecenas ultrices erat a ultricies aliquet. Nullam suscipit, odio non pretium facilisis, metus eros iaculis diam, quis iaculis ipsum lectus et urna. Mauris faucibus leo sit amet libero convallis commodo. Aliquam ut tellus risus. Fusce lorem elit, tincidunt in bibendum vitae, posuere imperdiet neque. Nulla quis erat et lorem cursus finibus. Praesent hendrerit erat enim, vitae venenatis justo malesuada eget. Donec interdum enim a libero dapibus efficitur. Phasellus in venenatis felis. Phasellus pellentesque bibendum elit nec ornare. Nam eu massa tellus. Nunc volutpat turpis ac nulla mattis, sed ultricies justo condimentum. Ut dui diam, fermentum sed rhoncus ac, rutrum ac erat. Pellentesque maximus egestas ligula.

Donec eget accumsan risus. Nam est nulla, faucibus vel lectus nec, interdum lacinia orci. Vivamus efficitur viverra enim eu ullamcorper. Etiam elementum orci nec justo viverra sagittis. Nam placerat, lacus eget venenatis efficitur, enim nisi venenatis lacus, eget dapibus tortor est eget sem. Fusce metus nibh, vulputate vitae tincidunt posuere, tempor vitae magna. Maecenas id orci at nisi rutrum mollis. Nulla eget suscipit magna. Vestibulum accumsan erat vitae scelerisque varius. Nunc bibendum nec ex ac scelerisque. Mauris sagittis neque ac urna mattis tempor. Sed sed dapibus orci.

## Baz

Nam non quam nec sapien eleifend placerat. Morbi vehicula lobortis ligula at scelerisque. Sed purus tellus, rutrum mollis nisi vel, mollis tincidunt nibh. Vivamus justo mauris, gravida quis urna eleifend, ultricies mollis sem. Sed mattis purus a nisl ultrices efficitur. Maecenas mattis nunc lobortis ullamcorper interdum. In nibh magna, dapibus in ipsum vitae, lobortis facilisis lectus. Vestibulum ornare eros mattis sem efficitur, bibendum dictum quam auctor. Sed id ex justo. Pellentesque eleifend consectetur urna, non malesuada justo fringilla a. Sed sodales, augue vitae viverra tincidunt, tortor mi volutpat leo, et gravida nunc arcu quis leo. Sed congue ligula consectetur elit laoreet sagittis vitae ut ante. Aenean et elementum justo. Etiam accumsan libero vitae accumsan consectetur. Donec ultricies, nibh ac fermentum vulputate, mi tortor porta dui, et aliquam ipsum mauris non magna.

Nam euismod, nisl egestas ornare fermentum, justo neque finibus eros, id imperdiet urna nunc ac sem. Aenean rutrum tempus enim sed aliquet. Aliquam imperdiet dapibus nulla ac lobortis. Suspendisse porta orci dapibus volutpat porta. Phasellus viverra, dolor at tincidunt pellentesque, magna tortor molestie libero, ac dignissim est quam ut felis. Nunc dictum dignissim dictum. Ut malesuada nisl mauris, maximus posuere sem ornare eget. Aliquam et magna porttitor, maximus turpis a, aliquet arcu. Vivamus eu diam sem. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse lobortis augue id diam tincidunt, ut pulvinar augue aliquam. Nam dapibus nulla et justo aliquam posuere. Fusce hendrerit lorem luctus turpis suscipit iaculis.

Nunc viverra mauris non vestibulum sodales. Fusce interdum orci nisl, ut congue libero interdum at. Ut vulputate id lectus vel malesuada. Interdum et malesuada fames ac ante ipsum primis in faucibus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec molestie iaculis feugiat. Aenean faucibus elit a dolor fermentum, quis efficitur sem lobortis.

## Qux {{var3}}

Quisque fermentum quam tellus, ut fringilla metus suscipit nec. Duis et ligula sit amet metus volutpat congue. Praesent aliquet risus molestie, ultricies purus sit amet, condimentum felis. Donec non rhoncus odio, vitae vehicula dui. Donec ut molestie purus. Quisque eu ex ornare, condimentum purus in, laoreet erat. Pellentesque varius facilisis pretium. Praesent rhoncus a nisl condimentum egestas. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Morbi in risus malesuada, cursus libero vitae, efficitur arcu. Pellentesque ut cursus orci, bibendum tincidunt diam. Fusce magna tellus, porttitor id diam placerat, gravida consequat augue. Nam eu rhoncus mauris.

Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. In sit amet felis lacus. Aenean ut erat ac dui lacinia vehicula faucibus sed massa. Donec et lorem ut magna eleifend facilisis. Donec ut felis ullamcorper, commodo lorem sed, porttitor eros. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque aliquet nec dui a finibus. Suspendisse potenti. Praesent rhoncus, velit ut laoreet convallis, magna eros aliquet eros, a maximus metus dolor ac dolor. Quisque dapibus pharetra nulla id congue.

Pellentesque sed magna porta, pulvinar ex id, posuere odio. Proin eget justo gravida, vulputate sapien a, placerat justo. Ut dictum enim at diam tincidunt ullamcorper. Integer at imperdiet arcu. Duis ultrices est metus, non ultricies mi euismod a. Praesent efficitur augue et enim posuere ornare. Cras et velit urna. Integer et tellus pretium, commodo nisi sed, congue lacus.

Praesent justo ante, tristique nec arcu nec, ultrices vulputate mauris. Etiam risus massa, molestie eget suscipit id, pharetra porta elit. Nam tristique lectus vitae purus accumsan consectetur. Pellentesque at mauris hendrerit, molestie odio at, mattis orci. Aenean suscipit nisi in ante placerat finibus. Phasellus mattis convallis dapibus. Donec interdum volutpat molestie. Phasellus tempus lectus vel accumsan ornare.`;

export const defaultTemplateLongPayload: GenerateDocumentRequest = {
  md: defaultTemplateLongMd,
  mdVariables: {
    var1: "- *List item 1*\n- **List item 2**",
    var2: "Mauris nibh metus, rutrum et eleifend ut, blandit a tellus. Vestibulum vitae mauris odio. Duis non ante quis ex volutpat lacinia. Phasellus tortor lacus, sodales at pretium at, interdum vitae elit. Morbi tristique eros vitae nisi tempor, convallis semper elit vestibulum. Pellentesque egestas sodales sapien, eu vestibulum nisl auctor pellentesque. Duis hendrerit turpis arcu, id luctus augue laoreet laoreet. Proin auctor, orci sed tristique fermentum, ex est ornare sem, a vestibulum urna ipsum ut enim. Suspendisse nisl erat, porta et varius eu, sagittis ac lectus.",
    var3: "bazilikum",
  },
  options: {
    dynamic: {
      template: "default",
      defaultTemplateArgs: {
        language: "nn",
        signatureVariant: "elektroniskGodkjent",
        fields: {
          dato: "12.24.2030",
          saksnummer: "2030/999",
          saksbehandlerNavn: "Test Testesen",
          virksomhet: {
            navn: "Test Containers",
            adresse: "Testveien 1",
            postnr: "1234",
            poststed: "Teststed",
          },
        },
      },
    },
  },
};

export const defaultTemplateAllOptionalsPayload: GenerateDocumentRequest = {
  md: "# Test PDF\n\nThis is a {{var}}",
  mdVariables: {
    var: "test PDF",
  },
  options: {
    dynamic: {
      template: "default",
      defaultTemplateArgs: {
        language: "nn",
        signatureVariant: "automatiskBehandlet",
        fields: {
          dato: "12.24.2030",
          saksnummer: "2030/999",
          saksbehandlerNavn: "Test Testesen",
          virksomhet: {
            navn: "Test Containers",
            adresse: "Testveien 1",
            postnr: "1234",
            poststed: "Teststed",
          },
          deresDato: "11.11.2030",
          deresReferanse: "2030-1234-5678",
          tidligereReferanse: "2029/888",
          erUnntattOffentlighet: true,
          unntattOffentlighetHjemmel: "jf. offl. § 14",
        },
      },
    },
  },
};

export const direktoratTemplateShortPayload: GenerateDocumentRequest = {
  md: "# Direktorat Test\n\nThis is a {{var}}",
  mdVariables: {
    var: "direktorat test PDF",
  },
  options: {
    dynamic: {
      template: "direktorat",
      direktoratTemplateArgs: {
        language: "bm",
        signatureVariant: "usignert",
        fields: {
          dato: "22.01.2026",
          saksnummer: "2026/1234",
          saksbehandlerNavn: "Direktør Direktoratsen",
          mottaker: {
            navn: "Mottaker AS",
            adresse: "Mottakerveien 1",
            postnr: "0123",
            poststed: "Oslo",
          },
        },
      },
    },
  },
};

export const direktoratTemplateWithSignaturesPayload: GenerateDocumentRequest = {
  md: "# Direktorat Signert\n\nThis is a {{var}}",
  mdVariables: {
    var: "signed direktorat PDF",
  },
  options: {
    dynamic: {
      template: "direktorat",
      direktoratTemplateArgs: {
        language: "nn",
        signatureVariant: "elektroniskGodkjent",
        signatureLines: ["Ola Nordmann", "Avdelingsdirektør"],
        fields: {
          dato: "22.01.2026",
          saksnummer: "2026/5678",
          saksbehandlerNavn: "Kari Nordmann",
          mottaker: {
            navn: "Bedrift AS",
            adresse: "Bedriftsveien 42",
            postnr: "5000",
            poststed: "Bergen",
          },
        },
      },
    },
  },
};
