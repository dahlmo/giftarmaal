export type Layout = {
  width?: "content" | "narrow" | "full";
  align?: "left" | "center";
};

export type Block = {
  id: string;
  type: string;
  layout?: Layout;
  data: Record<string, any>;
};

export type Field =
  | {
      kind: "string" | "text" | "number" | "url" | "boolean" | "datetime";
      name: string;
      label: string;
      placeholder?: string;
      showWhen?: { field: string; truthy: boolean };
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { label: string; value: string }[];
      showWhen?: { field: string; truthy: boolean };
    }
  | { kind: "array"; name: string; label: string; of: Field[] }
  | { kind: "blocks"; name: string; label: string; allowed?: string[] };

export type BlockDef = {
  type: string;
  title: string;
  defaults: () => Record<string, any>;
  fields: Field[];
};
