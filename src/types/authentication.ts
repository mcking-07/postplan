type AccessClaimsType = {
  email: string;
  sub: string;
  iss: string;
  aud: string[];
  exp: number;
  iat: number;
};

export type { AccessClaimsType };
