declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

export type TWritableBooleanKeys<T> = {
  [K in keyof T]-?: boolean extends T[K]
    ? (<U>() => { [P in K]: T[K] } extends { -readonly [P in K]: T[K] } ? K
      : never) extends (<U>() => infer I) ? I
    : never
    : never;
}[keyof T];
