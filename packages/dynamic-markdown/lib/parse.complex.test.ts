import { expect, test } from "vitest";
import { parseDynamicMd, ParseDynamicMdOptions } from "./parse";

test("Variables and nested logic", () => {
  const input = `
# Welcome to the Galactic Empire

{{ if Capital == Coruscant ::
## Capital City
The capital of the Galactic Empire is Coruscant.
{{ if Emperor == Sheev ::
### Emperor
The current Emperor is {{ Emperor }}.
{{ if isRebellionActive == true ::
#### Rebellion Status
The Rebellion is currently active.}}}}}}
{{ if Capital != Coruscant ::
  ## Other Cities
  The capital is not {{ Capital }}. It is {{ OtherCapital }}.
}}
## Population
The population of the Empire is {{ population }} billion.

Here are some key points about the Empire:

- The Empire spans across the galaxy.
- It is ruled by Emperor {{ Emperor }}.
- The capital city is {{ Capital }}.

{{ if jediTemple :: **Important Note**: The Jedi Temple is located on {{ jediTemple }}.}}
**Important Note**: The Rebellion is {{ if isRebellionActive == true :: currently active }}{{ if isRebellionActive == false :: not active }}.
`;

  const options: ParseDynamicMdOptions = {
    variables: {
      isCoreUnderAttack: false,
      Capital: "Coruscant",
      OtherCapital: "Naboo",
      Emperor: "Sheev",
      isRebellionActive: true,
      population: 1000,
      jediTemple: null,
    },
  };

  const expectedOutput = `
# Welcome to the Galactic Empire

## Capital City
The capital of the Galactic Empire is Coruscant.
### Emperor
The current Emperor is Sheev.
#### Rebellion Status
The Rebellion is currently active.

## Population
The population of the Empire is 1000 billion.

Here are some key points about the Empire:

- The Empire spans across the galaxy.
- It is ruled by Emperor Sheev.
- The capital city is Coruscant.


**Important Note**: The Rebellion is currently active.
`;

  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("Three layers of nested logic", () => {
  const input = `
# Welcome to the Nested World

{{ if level1 == true ::
## Level 1
This is the first level. It contains some introductory text.
  {{ if level2 == true ::
  ### Level 2
  This is the second level. Here is a list:
  - Item 1
  - Item 2
  - Item 3
    {{ if level3 == true ::
    #### Level 3
    This is the third level. Here is a quote:
    > "This is a nested quote."
    The message is: {{ message }}
    }}
  }}
}}

## Summary
This document demonstrates three layers of nested variables with mixed content.
`;

  const options: ParseDynamicMdOptions = {
    variables: {
      level1: true,
      level2: true,
      level3: true,
      message: "Hello from the deepest level!",
    },
  };

  const expectedOutput = `
# Welcome to the Nested World

## Level 1
This is the first level. It contains some introductory text.
  ### Level 2
  This is the second level. Here is a list:
  - Item 1
  - Item 2
  - Item 3
    #### Level 3
    This is the third level. Here is a quote:
    > "This is a nested quote."
    The message is: Hello from the deepest level!

## Summary
This document demonstrates three layers of nested variables with mixed content.
`;

  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("Nested logic and variables through variables", () => {
  const input = `
# Annual Report

{{ if level1 == true ::
## Q1 Performance
The first quarter was challenging but we made progress.
{{ nestedLogicLevel2 }}
}}

## Summary
This document provides an overview of the company's performance throughout the year.
`;

  const options: ParseDynamicMdOptions = {
    variables: {
      level1: true,
      level2: true,
      level3: true,
      highlight: "Record-breaking sales in the third quarter!",
      nestedLogicLevel2:
        "{{ if level2 == true :: ### Q2 Performance\nThe second quarter showed significant improvement.\n{{ nestedLogicLevel3 }} }}",
      nestedLogicLevel3:
        "{{ if level3 == true :: The third quarter performance was outstanding. The key highlight is: {{ highlight }} }}",
    },
  };

  const expectedOutput = `
# Annual Report

## Q1 Performance
The first quarter was challenging but we made progress.
### Q2 Performance
The second quarter showed significant improvement.
The third quarter performance was outstanding. The key highlight is: Record-breaking sales in the third quarter!

## Summary
This document provides an overview of the company's performance throughout the year.
`;

  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("Very long document with nested logic and variables", () => {
  const input = `
# Annual Report

{{ if level1 == true ::
## Q1 Performance
The first quarter was challenging but we made progress.
{{ nestedLogicLevel2 }}
}}

## Summary
This document provides an overview of the company's performance throughout the year.

## Detailed Analysis
### Financial Overview
{{ if financialOverview == true ::
#### Revenue
The revenue for the year was {{ revenue }}.
#### Expenses
The expenses for the year were {{ expenses }}.
#### Profit
The profit for the year was {{ profit }}.
}}

### Market Analysis
{{ if marketAnalysis == true ::
#### Market Share
Our market share increased by {{ marketShareIncrease }}%.
#### Competitors
We faced significant competition from {{ competitors }}.
}}

### Future Outlook
{{ if futureOutlook == true ::
#### Goals
Our goals for the next year include:
- Increase revenue by {{ revenueGoal }}%
- Reduce expenses by {{ expenseReductionGoal }}%
- Expand market share by {{ marketShareGoal }}%
#### Challenges
We anticipate the following challenges:
- {{ challenge1 }}
- {{ challenge2 }}
- {{ challenge3 }}
}}

## Conclusion
This document provides a comprehensive overview of the company's performance and future outlook.
`;

  const options: ParseDynamicMdOptions = {
    variables: {
      level1: true,
      financialOverview: true,
      marketAnalysis: true,
      futureOutlook: true,
      revenue: "$10 million",
      expenses: "$8 million",
      profit: "$2 million",
      marketShareIncrease: 5,
      competitors: "Company A, Company B, and Company C",
      revenueGoal: 10,
      expenseReductionGoal: 5,
      marketShareGoal: 3,
      challenge1: "Economic downturn",
      challenge2: "Increased competition",
      challenge3: "Regulatory changes",
      nestedLogicLevel2:
        "{{ if level2 == true :: ### Q2 Performance\nThe second quarter showed significant improvement.\n{{ nestedLogicLevel3 }} }}",
      nestedLogicLevel3:
        "{{ if level3 == true :: The third quarter performance was outstanding. The key highlight is: {{ highlight }} }}",
      level2: true,
      level3: true,
      highlight: "Record-breaking sales in the third quarter!",
    },
  };

  const expectedOutput = `
# Annual Report

## Q1 Performance
The first quarter was challenging but we made progress.
### Q2 Performance
The second quarter showed significant improvement.
The third quarter performance was outstanding. The key highlight is: Record-breaking sales in the third quarter!

## Summary
This document provides an overview of the company's performance throughout the year.

## Detailed Analysis
### Financial Overview
#### Revenue
The revenue for the year was $10 million.
#### Expenses
The expenses for the year were $8 million.
#### Profit
The profit for the year was $2 million.

### Market Analysis
#### Market Share
Our market share increased by 5%.
#### Competitors
We faced significant competition from Company A, Company B, and Company C.

### Future Outlook
#### Goals
Our goals for the next year include:
- Increase revenue by 10%
- Reduce expenses by 5%
- Expand market share by 3%
#### Challenges
We anticipate the following challenges:
- Economic downturn
- Increased competition
- Regulatory changes

## Conclusion
This document provides a comprehensive overview of the company's performance and future outlook.
`;

  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});

test("Nested truthiness checks", () => {
  const input = `
# Middle-earth Report

{{ if RingBearer ::
## The Ring-bearer
The current Ring-bearer is {{ RingBearer }}.
  {{ if isQuestActive ::
  ### The Quest
  The quest to destroy the One Ring is currently active.{{ if isSauronDefeated :: Victory! }}
  }}
}}

## Fellowship Members
The members of the Fellowship are:
- Aragorn
- Legolas
- Gimli
- Gandalf
- Boromir
- Merry
- Pippin
- Sam

{{ if isGondorUnderAttack :: **Alert**: Gondor is under attack! }}
**Status**: The quest is {{ if isQuestActive :: currently active }}{{ if isQuestActive == false :: not active }}.
`;

  const options: ParseDynamicMdOptions = {
    variables: {
      RingBearer: "Frodo",
      isQuestActive: 1,
      isSauronDefeated: 0,
      isGondorUnderAttack: null,
    },
  };

  const expectedOutput = `
# Middle-earth Report

## The Ring-bearer
The current Ring-bearer is Frodo.
  ### The Quest
  The quest to destroy the One Ring is currently active.

## Fellowship Members
The members of the Fellowship are:
- Aragorn
- Legolas
- Gimli
- Gandalf
- Boromir
- Merry
- Pippin
- Sam


**Status**: The quest is currently active.
`;

  expect(parseDynamicMd(input, options)).toEqual(expectedOutput);
});
