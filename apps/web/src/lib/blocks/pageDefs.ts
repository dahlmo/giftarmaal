import type { BlockDef } from "./types";

export const pageDefs: BlockDef[] = [
  {
    type: "agenda",
    title: "Program/Agenda",
    defaults: () => ({
      items: [
        {
          date: "2026-07-03",
          time: "18:00",
          title: "Blikjentgreier",
          detail: "Hotellet",
        },
        {
          date: "2026-07-04",
          time: "13:37",
          title: "Vielse",
          detail: "Kirken",
        },
      ],
    }),
    fields: [
      {
        kind: "array",
        name: "items",
        label: "Program",
        of: [
          {
            kind: "string",
            name: "date",
            label: "Dato",
            placeholder: "2026-07-04",
          },
          {
            kind: "string",
            name: "time",
            label: "Tid",
            placeholder: "13:30",
          },
          {
            kind: "string",
            name: "title",
            label: "Tittel",
            placeholder: "Vielse",
          },
          {
            kind: "text",
            name: "detail",
            label: "Beskrivelse",
            placeholder: "Sted eller info",
          },
        ],
      },
    ],
  },
  {
    type: "infobox",
    title: "Info-boks (OBS/varsel)",
    defaults: () => ({
      title: "OBS! Viktig beskjed",
      body: "Her kommer informasjon.",
      spoilerLabel: "Vis mer",
      spoilerText: "",
    }),
    fields: [
      {
        kind: "string",
        name: "title",
        label: "Overskrift",
      },
      {
        kind: "text",
        name: "body",
        label: "Brødtekst",
      },
      {
        kind: "string",
        name: "spoilerLabel",
        label: "Spoiler-tekst (knapp)",
        placeholder: "+ Vis mer",
      },
      {
        kind: "text",
        name: "spoilerText",
        label: "Spoiler-innhold",
        placeholder: "Teksten som vises når man klikker",
      },
    ],
  },
  {
    type: "heading",
    title: "Overskrift",
    defaults: () => ({ level: "2", text: "Ny overskrift" }),
    fields: [
      {
        kind: "select",
        name: "level",
        label: "Nivå",
        options: [
          { label: "H1", value: "1" },
          { label: "H2", value: "2" },
          { label: "H3", value: "3" },
          { label: "H4", value: "4" },
        ],
      },
      { kind: "string", name: "text", label: "Tekst" },
    ],
  },
  {
    type: "text",
    title: "Tekst",
    defaults: () => ({ text: "" }),
    fields: [{ kind: "text", name: "text", label: "Tekst" }],
  },
  {
    type: "cta",
    title: "Knapp/lenke",
    defaults: () => ({ label: "Klikk her", href: "" }),
    fields: [
      { kind: "string", name: "label", label: "Label" },
      { kind: "url", name: "href", label: "Lenke", placeholder: "https://..." },
    ],
  },
  {
    type: "grid",
    title: "Grid (kort)",
    defaults: () => ({
      columns: "3",
      items: [{ title: "Tittel", text: "Tekst" }],
    }),
    fields: [
      {
        kind: "select",
        name: "columns",
        label: "Kolonner",
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
        ],
      },
      {
        kind: "array",
        name: "items",
        label: "Elementer",
        of: [
          { kind: "string", name: "title", label: "Tittel" },
          { kind: "text", name: "text", label: "Tekst" },
        ],
      },
    ],
  },
  {
    type: "faq",
    title: "FAQ",
    defaults: () => ({ title: "FAQ", items: [{ q: "Spørsmål", a: "Svar" }] }),
    fields: [
      { kind: "string", name: "title", label: "Tittel" },
      {
        kind: "array",
        name: "items",
        label: "Spørsmål/svar",
        of: [
          { kind: "string", name: "q", label: "Spørsmål" },
          { kind: "text", name: "a", label: "Svar" },
        ],
      },
    ],
  },
  {
    type: "section",
    title: "Seksjon (container)",
    defaults: () => ({ title: "Ny seksjon", children: [] }),
    fields: [
      { kind: "string", name: "title", label: "Seksjonstittel" },
      {
        kind: "blocks",
        name: "children",
        label: "Innhold",
        allowed: [
          "heading",
          "text",
          "cta",
          "grid",
          "faq",
          "section",
          "infobox",
          "agenda",
        ],
      },
    ],
  },
  { type: "divider", title: "Linje", defaults: () => ({}), fields: [] },
  {
    type: "spacer",
    title: "Spacer",
    defaults: () => ({ size: "md" }),
    fields: [
      {
        kind: "select",
        name: "size",
        label: "Størrelse",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
    ],
  },
];
