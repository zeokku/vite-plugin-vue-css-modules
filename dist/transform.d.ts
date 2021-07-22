interface TransformOptions {
    preservePrefix: string;
}
declare const transform: (source: string, { preservePrefix }: TransformOptions) => any;
export default transform;
