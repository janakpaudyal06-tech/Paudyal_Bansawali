// पौड्याल बंशावली — सुरुको डेटा
//
// यो फाइल पेजको सुरुको (default) डेटा हो। पेजमै नाम भरेपछि "डेटा डाउनलोड"
// थिचेर आएको data.js ले यो फाइललाई बदल्न सकिन्छ।
//
// एक व्यक्ति:
//   {
//     name: "नाम",
//     gender: "male" | "female",
//     note: "छोटो विवरण (ऐच्छिक)",
//     spouses: [ { name: "श्रीमतीको नाम", children: [ ...व्यक्ति ] } ]
//   }

const BROTHERS = [
  {
    id: "hirandalal",
    name: "हिरन्दलाल पौड्याल",
    gender: "male",
    spouses: [
      {
        name: "जेठी श्रीमती",
        children: [
          { name: "", gender: "male" },
          { name: "", gender: "male" },
          { name: "", gender: "male" },
          { name: "", gender: "male" },
          { name: "", gender: "female" }
        ]
      },
      {
        name: "कान्छी श्रीमती",
        children: [
          { name: "", gender: "male" }
        ]
      }
    ]
  },
  { id: "brother-2", name: "", gender: "male" },
  { id: "brother-3", name: "", gender: "male" },
  { id: "brother-4", name: "", gender: "male" },
  { id: "brother-5", name: "", gender: "male" },
  { id: "brother-6", name: "", gender: "male" },
  { id: "brother-7", name: "", gender: "male" }
];
