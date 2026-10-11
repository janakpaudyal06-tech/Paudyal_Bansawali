// पौड्याल बंशावली — सुरुको डेटा
//
// यो फाइल पेजको सुरुको (default) डेटा हो। पेजमै नाम भरेपछि "डेटा डाउनलोड"
// थिचेर आएको data.js ले यो फाइललाई बदल्न सकिन्छ।
//
// एक व्यक्ति:
//   {
//     name: "नाम",
//     gender: "male" | "female",
//     nameRoman: "Roman मा लेखिएको नाम (आफैं भरिन्छ)",
//     note: "छोटो विवरण (ऐच्छिक)",
//     spouses: [ { name: "श्रीमतीको नाम", children: [ ...व्यक्ति ] } ]
//   }

// सात दाजुभाइ, जेठा (खगनाथ) देखि कान्छा (प्रेमसागर) सम्म क्रमैले।
const BROTHERS = [
  { id: "khaganath", name: "खगनाथ", gender: "male" },
  { id: "padmapani", name: "पद्मपाणि", gender: "male" },
  { id: "bhojraj", name: "भोजराज", gender: "male" },
  { id: "loknath", name: "लोकनाथ", gender: "male" },
  {
    id: "hirandalal",
    name: "हिरण्यलाल",
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
  { id: "keshav", name: "केशव", gender: "male" },
  { id: "premsagar", name: "प्रेमसागर", gender: "male" }
];
