// Paudyal Bansawali (पौड्याल बंशावली) — family data
//
// Each of the seven brothers has one entry in BROTHERS (one tab each).
// A person looks like:
//   {
//     name: "Name",
//     gender: "male" | "female",
//     note: "optional short note (birth year, place, etc.)",
//     spouses: [
//       { name: "Wife's name", children: [ ...persons ] }
//     ]
//   }
// Unknown names can stay as placeholders — just edit the text later.

const BROTHERS = [
  {
    id: "hirandalal",
    name: "Hirandalal Paudyal",
    gender: "male",
    spouses: [
      {
        name: "First wife",
        children: [
          { name: "Son 1", gender: "male" },
          { name: "Son 2", gender: "male" },
          { name: "Son 3", gender: "male" },
          { name: "Son 4", gender: "male" },
          { name: "Daughter", gender: "female" }
        ]
      },
      {
        name: "Second wife",
        children: [
          { name: "Son 5", gender: "male" }
        ]
      }
    ]
  },
  { id: "brother-2", name: "Brother 2", gender: "male" },
  { id: "brother-3", name: "Brother 3", gender: "male" },
  { id: "brother-4", name: "Brother 4", gender: "male" },
  { id: "brother-5", name: "Brother 5", gender: "male" },
  { id: "brother-6", name: "Brother 6", gender: "male" },
  { id: "brother-7", name: "Brother 7", gender: "male" }
];
