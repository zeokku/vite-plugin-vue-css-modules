type TLocalNameGenerator = (name: string) => string;

export interface TLocalTransformOptions {
  preservePrefix: string;
  localNameGenerator: TLocalNameGenerator;
  module?: string | false;
}
