/**
 * Diagnostics redaction. Pure string processing; never serializes unknown
 * objects. Own data properties are read via descriptors, so accessors are not invoked and
 * toString/toJSON are never called; Proxy traps cannot generally be prohibited (see docs/API.md).
 */
export declare const MAX_INPUT = 4096;
export declare const MAX_OUTPUT = 500;
/** Redact secrets/paths from an arbitrary string, bounded to MAX_INPUT in, MAX_OUTPUT out. */
export declare function redactString(raw: string): string;
export declare function safeDiagnostic(value: unknown): string;
/** Server digests intentionally suppress arbitrary server message/stack details. */
export declare function readableTrace(value: unknown): {
    message: string;
    frames: string[];
    reference: string | null;
};
export declare const debug: Readonly<{
    error(code: string, error: unknown): void;
    warning(code: string, message: unknown): void;
}>;
