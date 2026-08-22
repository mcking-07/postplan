type PolicyAttributeType = {
  name: string;
  value: string;
};

type PolicyNodeType = {
  tagName?: string;
  attrs?: PolicyAttributeType[];
  childNodes?: PolicyNodeType[];
  nodeName?: string;
  value?: string;
};

type WalkerEntryType = {
  node: PolicyNodeType;
  depth: number;
};

type ValidationContextType = {
  has_inline_script: boolean;
  title: string | undefined;
  too_deep: boolean;
};

type ValidationResultType = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  title?: string;
  stats: {
    has_inline_script: boolean;
    external_image_hosts: string[];
  };
};

export type { PolicyAttributeType, PolicyNodeType, ValidationContextType, ValidationResultType, WalkerEntryType };
