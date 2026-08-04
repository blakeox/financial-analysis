const PDF_SIGNATURE = '%PDF-';
const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
] as const;

function startsWithBytes(bytes: Uint8Array, signature: ArrayLike<number>): boolean {
  return Array.from(signature).every((value, index) => bytes[index] === value);
}

function containsAscii(bytes: Uint8Array, value: string): boolean {
  const needle = new TextEncoder().encode(value);
  outer: for (let offset = 0; offset <= bytes.length - needle.length; offset++) {
    for (let index = 0; index < needle.length; index++) {
      if (bytes[offset + index] !== needle[index]) continue outer;
    }
    return true;
  }
  return false;
}

function isUtf8Text(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file bytes against the small, explicitly supported upload set.
 * Client MIME values are advisory; the signature check is the enforcement
 * boundary before bytes are persisted to R2.
 */
export function hasExpectedUploadSignature(contentType: string, bytes: Uint8Array): boolean {
  switch (contentType) {
    case 'application/pdf':
      return startsWithBytes(bytes, new TextEncoder().encode(PDF_SIGNATURE));
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return (
        ZIP_SIGNATURES.some((signature) => startsWithBytes(bytes, signature)) &&
        containsAscii(bytes, '[Content_Types].xml') &&
        containsAscii(bytes, 'word/')
      );
    case 'text/plain':
      return isUtf8Text(bytes);
    default:
      return false;
  }
}
